import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/utils/api';
import { toast } from 'sonner';

export function ReimpostaPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Link non valido');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.resetPassword(token, password);
      toast.success(result.message);
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Reset non riuscito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center text-gray-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Torna al login
        </Link>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-[#e74c3c] p-3 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Nuova password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-new-password">Conferma password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#e74c3c] hover:bg-[#c0392b]" disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
