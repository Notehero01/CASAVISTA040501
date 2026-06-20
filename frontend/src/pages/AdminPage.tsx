import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle, Clock, Eye, EyeOff, ShieldCheck, Users, Ban, Home, RefreshCw, Trash2, XCircle } from 'lucide-react';
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
  pendingAnnunci: number;
  hiddenAnnunci: number;
  rejectedAnnunci: number;
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
  descrizione?: string;
  citta?: string;
  indirizzo?: string;
  prezzo?: number;
  tipo?: string;
  categoria?: string;
  superficie?: number;
  immagini?: string[];
  moderationStatus?: 'pending' | 'published' | 'hidden' | 'rejected' | 'deleted';
  createdAt?: string;
  owner?: AdminUser | null;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function StatusBadge({ children, tone }: { children: ReactNode; tone: 'green' | 'red' | 'gray' | 'blue' | 'amber' }) {
  const tones = {
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200'
  };

  return <Badge variant="outline" className={tones[tone]}>{children}</Badge>;
}

function getAnnuncioStatus(status?: AdminAnnuncio['moderationStatus']) {
  const current = status || 'published';
  const meta = {
    pending: { label: 'in revisione', tone: 'amber' },
    published: { label: 'pubblicato', tone: 'green' },
    hidden: { label: 'nascosto', tone: 'red' },
    rejected: { label: 'rifiutato', tone: 'red' },
    deleted: { label: 'eliminato', tone: 'gray' }
  } as const;

  return meta[current] || meta.published;
}

export function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [annunci, setAnnunci] = useState<AdminAnnuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingAnnunci = annunci.filter(annuncio => annuncio.moderationStatus === 'pending');

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

  const setAnnuncioStatus = async (annuncio: AdminAnnuncio, status: 'pending' | 'published' | 'hidden' | 'rejected') => {
    try {
      await adminApi.setAnnuncioStatus(annuncio.id, status);
      toast.success({
        pending: 'Annuncio rimesso in revisione',
        published: 'Annuncio approvato e pubblicato',
        hidden: 'Annuncio nascosto',
        rejected: 'Annuncio rifiutato'
      }[status]);
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

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
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
            <Clock className="mb-2 h-5 w-5 text-amber-600" />
            <p className="text-2xl font-bold">{summary?.pendingAnnunci ?? '-'}</p>
            <p className="text-sm text-gray-500">Da approvare</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <EyeOff className="mb-2 h-5 w-5 text-amber-600" />
            <p className="text-2xl font-bold">{summary?.hiddenAnnunci ?? '-'}</p>
            <p className="text-sm text-gray-500">Nascosti</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <XCircle className="mb-2 h-5 w-5 text-red-600" />
            <p className="text-2xl font-bold">{summary?.rejectedAnnunci ?? '-'}</p>
            <p className="text-sm text-gray-500">Rifiutati</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <Ban className="mb-2 h-5 w-5 text-red-600" />
            <p className="text-2xl font-bold">{summary?.blockedUsers ?? '-'}</p>
            <p className="text-sm text-gray-500">Bloccati</p>
          </div>
        </div>

        <section className="rounded-lg border bg-white">
          <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Annunci da approvare</h2>
              <p className="text-sm text-gray-500">Controlla testo, contatti e foto prima di renderli pubblici.</p>
            </div>
            <StatusBadge tone={pendingAnnunci.length > 0 ? 'amber' : 'green'}>
              {pendingAnnunci.length} in revisione
            </StatusBadge>
          </div>

          {pendingAnnunci.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Nessun annuncio in attesa di approvazione.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
              {pendingAnnunci.map(annuncio => (
                <div key={annuncio.id} className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-lg border bg-white">
                      <div className="aspect-[4/3] bg-gray-100">
                        {annuncio.immagini?.[0] ? (
                          <img src={annuncio.immagini[0]} alt={annuncio.titolo} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-400">Nessuna foto</div>
                        )}
                      </div>
                      {annuncio.immagini && annuncio.immagini.length > 1 && (
                        <div className="flex gap-1 overflow-x-auto border-t bg-white p-2">
                          {annuncio.immagini.slice(0, 8).map((img, index) => (
                            <img
                              key={`${annuncio.id}-${index}`}
                              src={img}
                              alt={`Foto ${index + 1}`}
                              className="h-12 w-16 flex-shrink-0 rounded border object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link to={`/annuncio/${annuncio.slug || annuncio.id}`} className="text-lg font-semibold text-gray-900 hover:text-[#e74c3c]">
                            {annuncio.titolo}
                          </Link>
                          <p className="mt-1 text-sm text-gray-600">
                            {annuncio.indirizzo || '-'} {annuncio.citta ? `- ${annuncio.citta}` : ''}
                          </p>
                        </div>
                        <StatusBadge tone="amber">in revisione</StatusBadge>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm text-gray-700">{annuncio.descrizione || 'Descrizione non indicata'}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <span>Prezzo: {annuncio.prezzo ? `EUR ${annuncio.prezzo.toLocaleString('it-IT')}` : '-'}</span>
                        <span>Superficie: {annuncio.superficie || '-'} mq</span>
                        <span>Tipo: {annuncio.tipo || '-'}</span>
                        <span>Categoria: {annuncio.categoria || '-'}</span>
                      </div>

                      <p className="mt-3 text-sm text-gray-600">
                        Proprietario: {annuncio.owner ? `${annuncio.owner.nome} ${annuncio.owner.cognome} - ${annuncio.owner.email}` : '-'}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setAnnuncioStatus(annuncio, 'published')}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approva
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => setAnnuncioStatus(annuncio, 'rejected')}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Rifiuta
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAnnuncioStatus(annuncio, 'hidden')}>
                          <EyeOff className="mr-1 h-4 w-4" />
                          Nascondi
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteAnnuncio(annuncio)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Rimuovi
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                  const statusInfo = getAnnuncioStatus(status);
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
                        <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {status !== 'published' && (
                            <Button size="sm" variant="outline" onClick={() => setAnnuncioStatus(annuncio, 'published')}>
                              <Eye className="mr-1 h-4 w-4" />
                              Approva
                            </Button>
                          )}
                          {status !== 'hidden' && (
                            <Button size="sm" variant="outline" onClick={() => setAnnuncioStatus(annuncio, 'hidden')}>
                              <EyeOff className="mr-1 h-4 w-4" />
                              Nascondi
                            </Button>
                          )}
                          {status !== 'rejected' && (
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => setAnnuncioStatus(annuncio, 'rejected')}>
                              <XCircle className="mr-1 h-4 w-4" />
                              Rifiuta
                            </Button>
                          )}
                          {status !== 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => setAnnuncioStatus(annuncio, 'pending')}>
                              <Clock className="mr-1 h-4 w-4" />
                              Revisione
                            </Button>
                          )}
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
