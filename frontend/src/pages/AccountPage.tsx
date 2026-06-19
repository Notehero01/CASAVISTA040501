import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, Mail, Phone, Trash2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { User } from '@/hooks/useAuth';

interface AccountPageProps {
  user: User | null;
  onDeleteProfile: () => Promise<boolean>;
}

export function AccountPage({ user, onDeleteProfile }: AccountPageProps) {
  const navigate = useNavigate();

  const handleDeleteProfile = async () => {
    if (!user) return;
    const firstConfirm = window.confirm('Vuoi davvero eliminare il profilo CasaVista? Gli annunci non saranno più visibili.');
    if (!firstConfirm) return;

    const secondConfirm = window.confirm('Confermi definitivamente? Questa operazione non può essere annullata.');
    if (!secondConfirm) return;

    try {
      await onDeleteProfile();
      toast.success('Profilo eliminato.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Non sono riuscito a eliminare il profilo.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#e74c3c]">CasaVista</p>
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="text-gray-600">Gestisci profilo, annunci e dati di accesso.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#e74c3c]" />Dati profilo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-semibold text-gray-900">{user.nome} {user.cognome}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Tipo account</p>
                  <p className="font-semibold text-gray-900">{user.tipo === 'amministrazione' ? 'Agenzia' : user.tipo}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Mail className="h-5 w-5 text-[#e74c3c]" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="break-all font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Phone className="h-5 w-5 text-[#e74c3c]" />
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium">{user.telefono || 'Non indicato'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/miei-annunci">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Building2 className="mr-2 h-4 w-4" />I miei annunci
                  </Button>
                </Link>
                {user.tipo === 'amministrazione' && (
                  <Link to="/profilo-agenzia">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Building2 className="mr-2 h-4 w-4" />Profilo agenzia
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />Zona pericolosa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Eliminando il profilo, l'account viene rimosso e gli annunci collegati non saranno più pubblici.
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteProfile}
                disabled={user.tipo === 'admin'}
              >
                <Trash2 className="mr-2 h-4 w-4" />Elimina profilo
              </Button>
              {user.tipo === 'admin' && (
                <p className="text-xs text-gray-500">Gli account admin non possono essere eliminati da questa pagina.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
