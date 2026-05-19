import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface RegistrazionePageProps {
  onRegister: (data: any) => Promise<{ success: boolean; message: string }>;
}

export function RegistrazionePage({ onRegister }: RegistrazionePageProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [tipo, setTipo] = useState<'utente' | 'amministrazione'>('utente');
  const [formData, setFormData] = useState({
    nome: '', cognome: '', email: '', telefono: '', password: '', confermaPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confermaPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    setLoading(true);
    const result = await onRegister({ ...formData, tipo });
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
            <Tabs value={tipo} onValueChange={(v) => setTipo(v as 'utente' | 'amministrazione')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="utente">Utente</TabsTrigger>
                <TabsTrigger value="amministrazione">Amministrazione</TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
                <Label>Email *</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" required />
                </div>
              </div>
              <div>
                <Label>Telefono</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="pl-10" />
                </div>
              </div>
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
              <Button type="submit" className="w-full bg-[#e74c3c] hover:bg-[#c0392b]" disabled={loading}>
                {loading ? 'Registrazione...' : 'Registrati gratis'}
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
