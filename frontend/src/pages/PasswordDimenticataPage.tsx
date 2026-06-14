import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/utils/api';
import { toast } from 'sonner';

export function PasswordDimenticataPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      setSent(true);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || 'Richiesta non riuscita');
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
            <CardTitle className="text-2xl">Recupera password</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-6 text-center">
                <p className="text-sm text-gray-600">
                  Se l'indirizzo risulta registrato, riceverai a breve il link per scegliere una nuova password.
                </p>
                <Button asChild className="w-full bg-[#e74c3c] hover:bg-[#c0392b]">
                  <Link to="/login">Vai al login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#e74c3c] hover:bg-[#c0392b]" disabled={loading}>
                  {loading ? 'Invio...' : 'Invia link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
