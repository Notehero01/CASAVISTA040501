import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Building2, Eye, Globe, ImagePlus, Mail, MapPin, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { amministrazioniApi, uploadApi } from '@/utils/api';
import { toast } from 'sonner';
import type { User } from '@/hooks/useAuth';

const SERVIZI_AGENZIA = [
  'Compravendite',
  'Locazioni',
  'Valutazioni immobiliari',
  'Consulenza mutuo',
  'Gestione pratiche',
  'Immobili residenziali',
  'Immobili commerciali',
  'Amministrazione condominiale'
];

interface ProfiloAgenziaPageProps {
  user: User | null;
}

export function ProfiloAgenziaPage({ user }: ProfiloAgenziaPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    descrizione: '',
    citta: '',
    provincia: '',
    indirizzo: '',
    sitoWeb: '',
    telefono: '',
    whatsapp: '',
    logo: '',
    servizi: [] as string[],
    annoFondazione: '',
    condominiGestiti: ''
  });

  useEffect(() => {
    if (!user || user.tipo !== 'amministrazione') {
      setLoading(false);
      return;
    }

    amministrazioniApi.getById(user.id)
      .then((profile) => {
        setPublicSlug(profile.slug || user.id);
        setFormData({
          ragioneSociale: profile.ragioneSociale || `${user.nome} ${user.cognome}`,
          descrizione: profile.descrizione || '',
          citta: profile.citta || '',
          provincia: profile.provincia || '',
          indirizzo: profile.indirizzo || '',
          sitoWeb: profile.sitoWeb || '',
          telefono: profile.telefono || user.telefono || '',
          whatsapp: profile.whatsapp || '',
          logo: profile.logo || '',
          servizi: Array.isArray(profile.servizi) ? profile.servizi : [],
          annoFondazione: profile.annoFondazione ? String(profile.annoFondazione) : '',
          condominiGestiti: profile.condominiGestiti ? String(profile.condominiGestiti) : ''
        });
      })
      .catch(() => {
        setFormData(prev => ({
          ...prev,
          ragioneSociale: `${user.nome} ${user.cognome}`,
          telefono: user.telefono || ''
        }));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const toggleServizio = (servizio: string) => {
    setFormData(prev => ({
      ...prev,
      servizi: prev.servizi.includes(servizio)
        ? prev.servizi.filter(item => item !== servizio)
        : [...prev.servizi, servizio]
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadApi.uploadImage(file);
      setFormData(prev => ({ ...prev, logo: result.url }));
      toast.success('Logo caricato.');
    } catch (error: any) {
      toast.error(error.message || 'Impossibile caricare il logo.');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await amministrazioniApi.updateProfile(formData);
      if (user) {
        const profile = await amministrazioniApi.getById(user.id);
        setPublicSlug(profile.slug || user.id);
      }
      toast.success('Profilo agenzia aggiornato.');
    } catch (error: any) {
      toast.error(error.message || 'Impossibile salvare il profilo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.tipo !== 'amministrazione') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h1 className="text-2xl font-bold">Profilo riservato alle agenzie</h1>
              <p className="mt-2 text-gray-600">Registrati come agenzia per creare la tua pagina pubblica.</p>
              <Link to="/registrazione">
                <Button className="mt-6 bg-[#e74c3c]">Crea account agenzia</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profilo agenzia</h1>
            <p className="mt-1 text-gray-600">Completa la pagina pubblica che vedranno clienti e altre agenzie.</p>
          </div>
          {publicSlug && (
            <Link to={`/agenzia/${publicSlug}`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />Vedi pagina pubblica
              </Button>
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#e74c3c]" />Dati pubblici
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Nome agenzia *</Label>
                <Input
                  value={formData.ragioneSociale}
                  onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Descrizione</Label>
                <Textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  className="min-h-[160px]"
                  placeholder="Racconta zona, servizi e specializzazione dell'agenzia."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Citta</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={formData.citta}
                      onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                      className="pl-10"
                      placeholder="Modena"
                    />
                  </div>
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="MO"
                  />
                </div>
              </div>

              <div>
                <Label>Indirizzo</Label>
                <Input
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="Via, numero civico"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Telefono</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="pl-10"
                      placeholder="+393..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Sito web</Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={formData.sitoWeb}
                    onChange={(e) => setFormData({ ...formData, sitoWeb: e.target.value })}
                    className="pl-10"
                    placeholder="www.agenzia.it"
                  />
                </div>
              </div>

              <div>
                <Label>Servizi</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SERVIZI_AGENZIA.map(servizio => (
                    <button
                      key={servizio}
                      type="button"
                      onClick={() => toggleServizio(servizio)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        formData.servizi.includes(servizio)
                          ? 'border-[#e74c3c] bg-[#e74c3c] text-white'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {servizio}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo agenzia" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-14 w-14 text-gray-300" />
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Carica logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingLogo} asChild>
                    <span>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {uploadingLogo ? 'Caricamento...' : 'Carica logo'}
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>La pagina pubblica si aggiorna automaticamente con gli annunci che pubblichi.</p>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>L'email dell'account resta visibile come contatto pubblico dell'agenzia.</p>
                </div>
                <Button type="submit" className="w-full bg-[#e74c3c]" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvataggio...' : 'Salva profilo'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
