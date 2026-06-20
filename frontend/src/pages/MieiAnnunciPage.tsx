import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bath, Bed, Building2, Eye, MapPin, Maximize, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { annunciApi } from '@/utils/api';
import { toast } from 'sonner';
import type { Annuncio } from '@/types/annuncio';

function formatPrice(annuncio: Annuncio) {
  return `€ ${Number(annuncio.prezzo || 0).toLocaleString('it-IT')}${annuncio.tipo === 'affitto' ? '/mese' : ''}`;
}

function getModerationMeta(status?: Annuncio['moderationStatus']) {
  const current = status || 'published';
  const meta: Record<string, { label: string; className: string; description: string }> = {
    pending: {
      label: 'In revisione',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Non e ancora visibile al pubblico.'
    },
    published: {
      label: 'Online',
      className: 'bg-green-100 text-green-800 border-green-200',
      description: 'Visibile su CasaVista.'
    },
    hidden: {
      label: 'Nascosto',
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      description: 'Non visibile al pubblico.'
    },
    rejected: {
      label: 'Da correggere',
      className: 'bg-red-100 text-red-700 border-red-200',
      description: 'Modifica l annuncio e reinvialo in revisione.'
    },
    deleted: {
      label: 'Eliminato',
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      description: ''
    }
  };

  return meta[current] || meta.published;
}

export function MieiAnnunciPage() {
  const [annunci, setAnnunci] = useState<Annuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAnnunci = async () => {
    setLoading(true);
    try {
      const data = await annunciApi.getMine();
      setAnnunci(data);
    } catch (error: any) {
      toast.error(error.message || 'Impossibile caricare i tuoi annunci.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnunci();
  }, []);

  const deleteAnnuncio = async (annuncio: Annuncio) => {
    if (!window.confirm(`Eliminare l'annuncio "${annuncio.titolo}"?`)) return;

    setDeletingId(annuncio.id);
    try {
      await annunciApi.delete(annuncio.id);
      setAnnunci(prev => prev.filter(item => item.id !== annuncio.id));
      toast.success('Annuncio eliminato.');
    } catch (error: any) {
      toast.error(error.message || 'Non sono riuscito a eliminare l\'annuncio.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#e74c3c]">CasaVista</p>
            <h1 className="text-3xl font-bold text-gray-900">I miei annunci</h1>
            <p className="text-gray-600">Gestisci gli immobili che hai caricato.</p>
          </div>
          <Link to="/pubblica">
            <Button className="bg-[#e74c3c]">
              <Plus className="mr-2 h-4 w-4" />Nuovo annuncio
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e74c3c] border-t-transparent" />
          </div>
        ) : annunci.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h2 className="text-xl font-semibold">Non hai ancora annunci</h2>
              <p className="mt-2 text-gray-500">Quando pubblichi un immobile, lo trovi qui.</p>
              <Link to="/pubblica">
                <Button className="mt-6 bg-[#e74c3c]">Pubblica il primo annuncio</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {annunci.map(annuncio => {
              const status = getModerationMeta(annuncio.moderationStatus);

              return (
              <Card key={annuncio.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <WatermarkedImage src={annuncio.immagini?.[0]} alt={annuncio.titolo} className="h-full w-full" fit="contain" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <Badge className={annuncio.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}>
                      {annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                    </Badge>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h2 className="line-clamp-2 font-semibold text-gray-900">{annuncio.titolo}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />{annuncio.citta || 'Città non indicata'}
                  </p>
                  {status.description && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{status.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{annuncio.camere}</span>
                    <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{annuncio.bagni}</span>
                    <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{annuncio.superficie} m²</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-[#e74c3c]">{formatPrice(annuncio)}</p>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Link to={`/annuncio/${annuncio.slug || annuncio.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />Vedi
                      </Button>
                    </Link>
                    <Link to={`/modifica-annuncio/${annuncio.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Pencil className="mr-2 h-4 w-4" />Modifica
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600"
                      onClick={() => deleteAnnuncio(annuncio)}
                      disabled={deletingId === annuncio.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === annuncio.id ? 'Elimino...' : 'Elimina'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
