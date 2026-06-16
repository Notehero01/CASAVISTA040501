import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, ShieldCheck, Users, Ban, Home, RefreshCw, Trash2 } from 'lucide-react';
import { adminApi } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdminSummary {
  users: number;
  agencies: number;
  verifiedAgencies: number;
  blockedUsers: number;
  annunci: number;
  hiddenAnnunci: number;
  conversations: number;
}

interface AdminUser {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  telefono?: string;
  tipo: 'utente' | 'admin' | 'amministrazione';
  verified?: boolean;
  blocked?: boolean;
  annunciCount?: number;
  createdAt?: string;
}

interface AdminAnnuncio {
  id: string;
  slug?: string;
  titolo: string;
  citta?: string;
  prezzo?: number;
  tipo?: string;
  moderationStatus?: 'published' | 'hidden' | 'deleted';
  createdAt?: string;
  owner?: AdminUser | null;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function StatusBadge({ children, tone }: { children: ReactNode; tone: 'green' | 'red' | 'gray' | 'blue' }) {
  const tones = {
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return <Badge variant="outline" className={tones[tone]}>{children}</Badge>;
}

export function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [annunci, setAnnunci] = useState<AdminAnnuncio[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, usersData, annunciData] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getUsers(),
        adminApi.getAnnunci()
      ]);
      setSummary(summaryData);
      setUsers(usersData);
      setAnnunci(annunciData);
    } catch (error: any) {
      toast.error(error.message || 'Impossibile caricare area admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const setUserVerified = async (user: AdminUser, verified: boolean) => {
    try {
      await adminApi.setUserVerified(user.id, verified);
      toast.success(verified ? 'Account verificato' : 'Verifica rimossa');
      loadAdminData();
    } catch (error: any) {
      toast.error(error.message || 'Operazione non riuscita');
    }
  };

  const setUserBlocked = async (user: AdminUser, blocked: boolean) => {
    try {
      await adminApi.setUserBlocked(user.id, blocked);
      toast.success(blocked ? 'Utente bloccato' : 'Utente sbloccato');
      loadAdminData();
    } catch (error: any) {
      toast.error(error.message || 'Operazione non riuscita');
    }
  };

  const setAnnuncioStatus = async (annuncio: AdminAnnuncio, status: 'published' | 'hidden') => {
    try {
      await adminApi.setAnnuncioStatus(annuncio.id, status);
      toast.success(status === 'hidden' ? 'Annuncio nascosto' : 'Annuncio pubblicato');
      loadAdminData();
    } catch (error: any) {
      toast.error(error.message || 'Operazione non riuscita');
    }
  };

  const deleteAnnuncio = async (annuncio: AdminAnnuncio) => {
    if (!window.confirm(`Rimuovere l'annuncio "${annuncio.titolo}"?`)) return;

    try {
      await adminApi.deleteAnnuncio(annuncio.id);
      toast.success('Annuncio rimosso');
      loadAdminData();
    } catch (error: any) {
      toast.error(error.message || 'Operazione non riuscita');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#e74c3c]">CasaVista</p>
            <h1 className="text-3xl font-bold text-gray-900">Area admin</h1>
            <p className="text-gray-600">Controllo rapido di utenti, agenzie e annunci.</p>
          </div>
          <Button onClick={loadAdminData} variant="outline" disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aggiorna
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <div className="rounded-lg border bg-white p-4">
            <Users className="mb-2 h-5 w-5 text-blue-600" />
            <p className="text-2xl font-bold">{summary?.users ?? '-'}</p>
            <p className="text-sm text-gray-500">Utenti</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Building2 className="mb-2 h-5 w-5 text-[#e74c3c]" />
            <p className="text-2xl font-bold">{summary?.agencies ?? '-'}</p>
            <p className="text-sm text-gray-500">Agenzie</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-green-600" />
            <p className="text-2xl font-bold">{summary?.verifiedAgencies ?? '-'}</p>
            <p className="text-sm text-gray-500">Verificate</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Home className="mb-2 h-5 w-5 text-indigo-600" />
            <p className="text-2xl font-bold">{summary?.annunci ?? '-'}</p>
            <p className="text-sm text-gray-500">Annunci online</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <EyeOff className="mb-2 h-5 w-5 text-amber-600" />
            <p className="text-2xl font-bold">{summary?.hiddenAnnunci ?? '-'}</p>
            <p className="text-sm text-gray-500">Nascosti</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Ban className="mb-2 h-5 w-5 text-red-600" />
            <p className="text-2xl font-bold">{summary?.blockedUsers ?? '-'}</p>
            <p className="text-sm text-gray-500">Bloccati</p>
          </div>
        </div>

        <section className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">Utenti e agenzie</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Annunci</th>
                  <th className="px-4 py-3 font-medium">Stato</th>
                  <th className="px-4 py-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.nome} {user.cognome}</p>
                      <p className="text-xs text-gray-500">Iscritto: {formatDate(user.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={user.tipo === 'admin' ? 'blue' : user.tipo === 'amministrazione' ? 'green' : 'gray'}>
                        {user.tipo}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">{user.annunciCount ?? 0}</td>
                    <td className="px-4 py-3 space-x-2">
                      {user.verified ? <StatusBadge tone="green">verificato</StatusBadge> : <StatusBadge tone="gray">non verificato</StatusBadge>}
                      {user.blocked && <StatusBadge tone="red">bloccato</StatusBadge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setUserVerified(user, !user.verified)}>
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          {user.verified ? 'Rimuovi' : 'Verifica'}
                        </Button>
                        {user.tipo !== 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => setUserBlocked(user, !user.blocked)}>
                            <Ban className="mr-1 h-4 w-4" />
                            {user.blocked ? 'Sblocca' : 'Blocca'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">Annunci</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Annuncio</th>
                  <th className="px-4 py-3 font-medium">Proprietario</th>
                  <th className="px-4 py-3 font-medium">Prezzo</th>
                  <th className="px-4 py-3 font-medium">Stato</th>
                  <th className="px-4 py-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {annunci.map(annuncio => {
                  const status = annuncio.moderationStatus || 'published';
                  return (
                    <tr key={annuncio.id}>
                      <td className="px-4 py-3">
                        <Link to={`/annuncio/${annuncio.slug || annuncio.id}`} className="font-medium text-gray-900 hover:text-[#e74c3c]">
                          {annuncio.titolo}
                        </Link>
                        <p className="text-xs text-gray-500">{annuncio.citta || '-'} - {formatDate(annuncio.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {annuncio.owner ? `${annuncio.owner.nome} ${annuncio.owner.cognome}` : '-'}
                      </td>
                      <td className="px-4 py-3">{annuncio.prezzo ? `EUR ${annuncio.prezzo.toLocaleString('it-IT')}` : '-'}</td>
                      <td className="px-4 py-3">
                        {status === 'hidden' ? <StatusBadge tone="red">nascosto</StatusBadge> : <StatusBadge tone="green">pubblicato</StatusBadge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAnnuncioStatus(annuncio, status === 'hidden' ? 'published' : 'hidden')}>
                            {status === 'hidden' ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
                            {status === 'hidden' ? 'Pubblica' : 'Nascondi'}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteAnnuncio(annuncio)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Rimuovi
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
