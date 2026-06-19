import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { usePreferiti } from '@/hooks/usePreferiti';
import { annunciApi } from '@/utils/api';
import type { Annuncio } from '@/types/annuncio';

export function PreferitiPage() {
  const { preferiti, rimuoviPreferito, clearPreferiti } = usePreferiti();
  const [annunci, setAnnunci] = useState<Annuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnunci();
  }, [preferiti]);

  const fetchAnnunci = async () => {
    if (preferiti.length === 0) {
      setAnnunci([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await annunciApi.getAll({});
      const preferitiAnnunci = data.annunci.filter((a: Annuncio) => preferiti.includes(a.id));
      setAnnunci(preferitiAnnunci);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (preferiti.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Nessun annuncio salvato</h1>
          <p className="text-gray-500 mb-6">Aggiungi annunci ai preferiti per trovarli facilmente</p>
          <Button onClick={() => navigate('/cerca')} className="bg-[#e74c3c]">
            Cerca annunci
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">I tuoi preferiti</h1>
            <p className="text-gray-500">{preferiti.length} annunci salvati</p>
          </div>
          <Button variant="outline" onClick={clearPreferiti} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />Svuota tutto
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annunci.map((annuncio) => (
              <div key={annuncio.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-[4/3] relative">
                  <WatermarkedImage src={annuncio.immagini[0]} alt={annuncio.titolo} className="h-full w-full" fit="contain" />
                  <button
                    onClick={() => rimuoviPreferito(annuncio.id)}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-sm font-medium ${
                    annuncio.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'
                  }`}>
                    {annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                  </div>
                </div>
                
                <div className="p-4">
                  <Link to={`/annuncio/${annuncio.id}`}>
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#e74c3c] transition-colors">
                      {annuncio.titolo}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />{annuncio.citta}, {annuncio.provincia}
                  </p>
                  
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />{annuncio.camere}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />{annuncio.bagni}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="h-4 w-4" />{annuncio.superficie}m²
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xl font-bold text-[#e74c3c]">
                      € {annuncio.prezzo.toLocaleString()}
                      {annuncio.tipo === 'affitto' && <span className="text-sm text-gray-500">/mese</span>}
                    </p>
                    <Link to={`/annuncio/${annuncio.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        Dettagli <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
