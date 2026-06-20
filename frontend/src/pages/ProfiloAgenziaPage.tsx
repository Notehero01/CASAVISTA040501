import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BarChart3, Building2, Eye, Globe, Home, ImagePlus, Mail, MapPin, Percent, Phone, Save, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { amministrazioniApi, annunciApi, uploadApi } from '@/utils/api';
import { toast } from 'sonner';
import type { User } from '@/hooks/useAuth';
import type { Annuncio } from '@/types/annuncio';

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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [ownAnnunci, setOwnAnnunci] = useState<Annuncio[]>([]);
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
    coverImage: '',
    categoriaProfilo: 'agenzia',
    servizi: [] as string[],
    annoFondazione: '',
    condominiGestiti: ''
  });

  useEffect(() => {
    if (!user || user.tipo !== 'amministrazione') {
      setLoading(false);
      return;
    }

    const loadAgencyData = async () => {
      try {
        const profile = await amministrazioniApi.getById(user.id);
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
          coverImage: profile.coverImage || '',
          categoriaProfilo: profile.categoriaProfilo === 'amministrazione_condominiale' ? 'amministrazione_condominiale' : 'agenzia',
          servizi: Array.isArray(profile.servizi) ? profile.servizi : [],
          annoFondazione: profile.annoFondazione ? String(profile.annoFondazione) : '',
          condominiGestiti: profile.condominiGestiti ? String(profile.condominiGestiti) : ''
        });
      } catch {
        setFormData(prev => ({
          ...prev,
          ragioneSociale: `${user.nome} ${user.cognome}`,
          telefono: user.telefono || ''
        }));
      }

      try {
        const data = await annunciApi.getMine();
        setOwnAnnunci(data);
      } catch {
        setOwnAnnunci([]);
      } finally {
        setLoading(false);
      }
    };

    loadAgencyData();
  }, [user]);

  const agencyStats = useMemo(() => {
    const totalAnnunci = ownAnnunci.length;
    const totalViews = ownAnnunci.reduce((sum, annuncio) => sum + Number(annuncio.visualizzazioni || 0), 0);
    const published = ownAnnunci.filter(annuncio => (annuncio.moderationStatus || 'published') === 'published').length;
    const pending = ownAnnunci.filter(annuncio => annuncio.moderationStatus === 'pending').length;
    const hidden = ownAnnunci.filter(annuncio => annuncio.moderationStatus === 'hidden' || annuncio.moderationStatus === 'rejected').length;
    const vendita = ownAnnunci.filter(annuncio => annuncio.tipo === 'vendita').length;
    const affitto = ownAnnunci.filter(annuncio => annuncio.tipo === 'affitto').length;
    const averageViews = totalAnnunci > 0 ? Math.round(totalViews / totalAnnunci) : 0;
    const onlinePercent = totalAnnunci > 0 ? Math.round((published / totalAnnunci) * 100) : 0;
    const maxViews = Math.max(1, ...ownAnnunci.map(annuncio => Number(annuncio.visualizzazioni || 0)));
    const topAnnunci = [...ownAnnunci]
      .sort((a, b) => Number(b.visualizzazioni || 0) - Number(a.visualizzazioni || 0))
      .slice(0, 5);

    const typeRows = [
      { label: 'Vendita', value: vendita, percent: totalAnnunci > 0 ? Math.round((vendita / totalAnnunci) * 100) : 0, className: 'bg-[#e74c3c]' },
      { label: 'Affitto', value: affitto, percent: totalAnnunci > 0 ? Math.round((affitto / totalAnnunci) * 100) : 0, className: 'bg-blue-600' }
    ];

    const statusRows = [
      { label: 'Online', value: published, percent: onlinePercent, className: 'bg-green-600' },
      { label: 'In revisione', value: pending, percent: totalAnnunci > 0 ? Math.round((pending / totalAnnunci) * 100) : 0, className: 'bg-amber-500' },
      { label: 'Nascosti o da correggere', value: hidden, percent: totalAnnunci > 0 ? Math.round((hidden / totalAnnunci) * 100) : 0, className: 'bg-gray-500' }
    ];

    return {
      totalAnnunci,
      totalViews,
      averageViews,
      onlinePercent,
      topAnnunci,
      maxViews,
      typeRows,
      statusRows
    };
  }, [ownAnnunci]);

  const toggleServizio = (servizio: string) => {
    setFormData(prev => ({
      ...prev,
      servizi: prev.servizi.includes(servizio)
        ? prev.servizi.filter(item => item !== servizio)
        : [...prev.servizi, servizio]
    }));
  };

  const setCategoriaProfilo = (categoriaProfilo: 'agenzia' | 'amministrazione_condominiale') => {
    setFormData(prev => ({
      ...prev,
      categoriaProfilo,
      servizi: categoriaProfilo === 'amministrazione_condominiale' && !prev.servizi.includes('Amministrazione condominiale')
        ? [...prev.servizi, 'Amministrazione condominiale']
        : prev.servizi
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

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const result = await uploadApi.uploadImage(file);
      setFormData(prev => ({ ...prev, coverImage: result.url }));
      toast.success('Copertina caricata.');
    } catch (error: any) {
      toast.error(error.message || 'Impossibile caricare la copertina.');
    } finally {
      setUploadingCover(false);
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
      toast.success('Profilo professionale aggiornato.');
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
              <h1 className="text-2xl font-bold">Profilo riservato ai professionisti</h1>
              <p className="mt-2 text-gray-600">Registrati come agenzia o amministrazione per creare la tua pagina pubblica.</p>
              <Link to="/registrazione?tipo=agenzia">
                <Button className="mt-6 bg-[#e74c3c]">Crea account professionale</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profilo professionale</h1>
            <p className="mt-1 text-gray-600">Completa la pagina pubblica che vedranno clienti, agenzie e amministrazioni.</p>
          </div>
          {publicSlug && (
            <Link to={`/agenzia/${publicSlug}`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />Vedi pagina pubblica
              </Button>
            </Link>
          )}
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <Home className="mb-3 h-5 w-5 text-[#e74c3c]" />
            <p className="text-2xl font-bold text-gray-900">{agencyStats.totalAnnunci}</p>
            <p className="text-sm text-gray-500">Annunci caricati</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Eye className="mb-3 h-5 w-5 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{agencyStats.totalViews.toLocaleString('it-IT')}</p>
            <p className="text-sm text-gray-500">Visualizzazioni totali</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <TrendingUp className="mb-3 h-5 w-5 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{agencyStats.averageViews}</p>
            <p className="text-sm text-gray-500">Media viste per annuncio</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Percent className="mb-3 h-5 w-5 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{agencyStats.onlinePercent}%</p>
            <p className="text-sm text-gray-500">Annunci online</p>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-[#e74c3c]" />Panoramica annunci
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {agencyStats.statusRows.map(row => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-medium text-gray-900">{row.value} ({row.percent}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${row.className}`} style={{ width: `${row.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-5">
                <p className="mb-3 text-sm font-medium text-gray-700">Vendita / affitto</p>
                <div className="space-y-3">
                  {agencyStats.typeRows.map(row => (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">{row.label}</span>
                        <span className="font-medium text-gray-900">{row.value} ({row.percent}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${row.className}`} style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-600" />Annunci piu visti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agencyStats.topAnnunci.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Pubblica il primo annuncio per vedere le statistiche.
                </div>
              ) : (
                <div className="space-y-4">
                  {agencyStats.topAnnunci.map(annuncio => {
                    const views = Number(annuncio.visualizzazioni || 0);
                    const percent = Math.max(4, Math.round((views / agencyStats.maxViews) * 100));

                    return (
                      <div key={annuncio.id}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <Link to={`/annuncio/${annuncio.slug || annuncio.id}`} className="line-clamp-1 text-sm font-medium text-gray-900 hover:text-[#e74c3c]">
                            {annuncio.titolo}
                          </Link>
                          <span className="shrink-0 text-sm font-semibold text-gray-700">{views.toLocaleString('it-IT')} viste</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#e74c3c]" />Dati pubblici
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Tipo profilo</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCategoriaProfilo('agenzia')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                      formData.categoriaProfilo === 'agenzia'
                        ? 'border-[#e74c3c] bg-[#e74c3c] text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Agenzia immobiliare
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaProfilo('amministrazione_condominiale')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                      formData.categoriaProfilo === 'amministrazione_condominiale'
                        ? 'border-[#e74c3c] bg-[#e74c3c] text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Amministrazione condominiale
                  </button>
                </div>
              </div>

              <div>
                <Label>{formData.categoriaProfilo === 'amministrazione_condominiale' ? 'Nome amministrazione *' : 'Nome agenzia *'}</Label>
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
                  placeholder="Racconta zona, servizi e specializzazione del profilo."
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
                    placeholder="www.tuosito.it"
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
                <CardTitle className="text-lg">Copertina</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Copertina profilo" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Carica copertina</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingCover} asChild>
                    <span>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {uploadingCover ? 'Caricamento...' : 'Carica copertina'}
                    </span>
                  </Button>
                </label>
                {formData.coverImage && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-gray-600"
                    onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                  >
                    Rimuovi copertina
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo profilo" className="h-full w-full object-cover" />
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
                  <p>L'email dell'account resta visibile come contatto pubblico del profilo.</p>
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
