import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface RegistrazionePageProps {
  onRegister: (data: any) => Promise<{ success: boolean; message: string }>;
}

type TipoRegistrazione = 'utente' | 'agenzia' | 'amministrazione_condominiale';

function getInitialTipo(searchParams: URLSearchParams): TipoRegistrazione {
  const requested = searchParams.get('tipo');

  if (requested === 'agenzia') return 'agenzia';
  if (requested === 'amministrazione' || requested === 'amministrazione_condominiale') {
    return 'amministrazione_condominiale';
  }

  return 'utente';
}

export function RegistrazionePage({ onRegister }: RegistrazionePageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [tipo, setTipo] = useState<TipoRegistrazione>(() => getInitialTipo(searchParams));
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    ragioneSociale: '',
    email: '',
    telefono: '',
    telefonoFisso: '',
    cellulare: '',
    password: '',
    confermaPassword: '',
    privacyConsent: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confermaPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    if (!formData.privacyConsent) {
      toast.error('Devi accettare Privacy Policy e Termini di servizio');
      return;
    }
    if (tipo !== 'utente' && !formData.ragioneSociale.trim()) {
      toast.error(tipo === 'agenzia' ? 'Inserisci il nome dell\'agenzia' : 'Inserisci il nome dell\'amministrazione');
      return;
    }
    setLoading(true);
    const registerData = tipo !== 'utente'
      ? {
          ...formData,
          nome: formData.ragioneSociale,
          cognome: tipo === 'agenzia' ? 'Agenzia' : 'Amministrazione',
          ragioneSociale: formData.ragioneSociale,
          telefono: formData.telefonoFisso || formData.cellulare,
          telefonoFisso: formData.telefonoFisso,
          cellulare: formData.cellulare,
          tipo: 'amministrazione',
          categoriaProfilo: tipo,
          servizi: tipo === 'amministrazione_condominiale' ? ['Amministrazione condominiale'] : []
        }
      : { ...formData, tipo };
    const result = await onRegister(registerData);
    if (result.success) {
      toast.success('Registrazione completata!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <Link to="/" className="inline-flex items-center text-gray-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Torna alla home
        </Link>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-[#e74c3c] p-3 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoRegistrazione)}>
              <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
                <TabsTrigger value="utente" className="min-h-10 whitespace-normal px-2 text-center leading-tight">
                  Privato
                </TabsTrigger>
                <TabsTrigger value="agenzia" className="min-h-10 whitespace-normal px-2 text-center leading-tight">
                  Agenzia
                </TabsTrigger>
                <TabsTrigger value="amministrazione_condominiale" className="min-h-10 whitespace-normal px-2 text-center leading-tight">
                  Amministrazione
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tipo !== 'utente' ? (
                <div>
                  <Label>{tipo === 'agenzia' ? 'Nome agenzia *' : 'Nome amministrazione *'}</Label>
                  <Input
                    value={formData.ragioneSociale}
                    onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                    placeholder={tipo === 'agenzia' ? 'Es: Immobiliare Modena Centro' : 'Es: Studio Amministrazioni Rossi'}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {tipo === 'agenzia'
                      ? 'Creerai una pagina pubblica nella sezione Agenzie.'
                      : 'Creerai una pagina pubblica nella sezione Amministrazioni condominiali.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Cognome *</Label>
                    <Input value={formData.cognome} onChange={(e) => setFormData({ ...formData, cognome: e.target.value })} required />
                  </div>
                </div>
              )}
              <div>
                <Label>Email *</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" required />
                </div>
              </div>
              {tipo !== 'utente' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Telefono fisso</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input type="tel" value={formData.telefonoFisso} onChange={(e) => setFormData({ ...formData, telefonoFisso: e.target.value })} className="pl-10" placeholder="059..." />
                    </div>
                  </div>
                  <div>
                    <Label>Cellulare</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input type="tel" value={formData.cellulare} onChange={(e) => setFormData({ ...formData, cellulare: e.target.value })} className="pl-10" placeholder="+39 3..." />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Telefono</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="pl-10" />
                  </div>
                </div>
              )}
              <div>
                <Label>Password *</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Conferma Password *</Label>
                <Input type="password" value={formData.confermaPassword} onChange={(e) => setFormData({ ...formData, confermaPassword: e.target.value })} required />
              </div>
              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.privacyConsent}
                  onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  required
                />
                <span>
                  Accetto la <Link to="/privacy" className="text-[#e74c3c] font-medium">Privacy Policy</Link> e i <Link to="/termini" className="text-[#e74c3c] font-medium">Termini di servizio</Link>.
                </span>
              </label>
              <Button type="submit" className="w-full bg-[#e74c3c] hover:bg-[#c0392b]" disabled={loading}>
                {loading ? 'Registrazione...' : 'Registrati'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hai già un account? <Link to="/login" className="text-[#e74c3c] font-medium">Accedi</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
