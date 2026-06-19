import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Scale, Bed, Bath, Maximize, MapPin, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { useConfronto } from '@/hooks/useConfronto';
import { annunciApi } from '@/utils/api';
import type { Annuncio } from '@/types/annuncio';

export function ConfrontoPage() {
  const { confrontoIds, rimuoviDalConfronto, clearConfronto } = useConfronto();
  const [annunci, setAnnunci] = useState<Annuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnunci();
  }, [confrontoIds]);

  const fetchAnnunci = async () => {
    if (confrontoIds.length === 0) {
      setAnnunci([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch tutti gli annunci e filtra quelli nel confronto
      const data = await annunciApi.getAll({});
      const confrontoAnnunci = data.annunci.filter((a: Annuncio) => confrontoIds.includes(a.id));
      setAnnunci(confrontoAnnunci);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (confrontoIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Nessun annuncio da confrontare</h1>
          <p className="text-gray-500 mb-6">Aggiungi annunci al confronto per compararli fianco a fianco</p>
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
            <h1 className="text-2xl font-bold">Confronta annunci</h1>
            <p className="text-gray-500">Confronta fino a 4 annunci fianco a fianco</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={clearConfronto}>
              <XCircle className="h-4 w-4 mr-2" />Svuota tutto
            </Button>
            <Button onClick={() => navigate('/cerca')} variant="outline">
              Aggiungi altri
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm">
              <thead>
                <tr>
                  <th className="p-4 text-left border-b bg-gray-50 sticky left-0 z-10 min-w-[150px]">Caratteristica</th>
                  {annunci.map((annuncio) => (
                    <th key={annuncio.id} className="p-4 border-b min-w-[280px]">
                      <div className="relative">
                        <button
                          onClick={() => rimuoviDalConfronto(annuncio.id)}
                          className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Link to={`/annuncio/${annuncio.id}`}>
                          <WatermarkedImage src={annuncio.immagini[0]} alt={annuncio.titolo} className="mb-3 h-32 w-full rounded-lg" fit="contain" />
                          <h3 className="font-semibold text-sm line-clamp-2">{annuncio.titolo}</h3>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Prezzo */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white">Prezzo</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      <span className="text-xl font-bold text-[#e74c3c]">
                        € {annuncio.prezzo.toLocaleString()}
                      </span>
                      {annuncio.tipo === 'affitto' && <span className="text-sm text-gray-500">/mese</span>}
                    </td>
                  ))}
                </tr>

                {/* Prezzo per m² */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-gray-50">Prezzo/m²</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      € {Math.round(annuncio.prezzo / annuncio.superficie).toLocaleString()}/m²
                    </td>
                  ))}
                </tr>

                {/* Superficie */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white">Superficie</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Maximize className="h-4 w-4" />{annuncio.superficie} m²
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Locali */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-gray-50">Locali</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      {annuncio.locali} locali
                    </td>
                  ))}
                </tr>

                {/* Camere */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white">Camere</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Bed className="h-4 w-4" />{annuncio.camere}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Bagni */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-gray-50">Bagni</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Bath className="h-4 w-4" />{annuncio.bagni}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Piano */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white">Piano</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      {annuncio.piano !== undefined ? 
                        (annuncio.piano === 0 ? 'Piano terra' : 
                         annuncio.piano === -1 ? 'Seminterrato' : 
                         `${annuncio.piano}° piano`) : 'N/D'}
                    </td>
                  ))}
                </tr>

                {/* Città */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-gray-50">Città</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      <span className="flex items-center justify-center gap-1">
                        <MapPin className="h-4 w-4" />{annuncio.citta}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Classe energetica */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white">Classe energetica</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      {annuncio.classe_energetica ? (
                        <span className={`inline-block px-2 py-1 rounded text-white text-sm font-bold ${
                          annuncio.classe_energetica.startsWith('A') ? 'bg-green-500' :
                          annuncio.classe_energetica === 'B' ? 'bg-green-600' :
                          annuncio.classe_energetica === 'C' ? 'bg-yellow-500' :
                          annuncio.classe_energetica === 'D' ? 'bg-yellow-600' :
                          annuncio.classe_energetica === 'E' ? 'bg-orange-500' :
                          annuncio.classe_energetica === 'F' ? 'bg-orange-600' :
                          'bg-red-500'
                        }`}>
                          {annuncio.classe_energetica}
                        </span>
                      ) : 'N/D'}
                    </td>
                  ))}
                </tr>

                {/* Stato */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-gray-50">Stato</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b text-center">
                      {annuncio.stato ? (
                        <span className={`inline-flex items-center gap-1 ${
                          annuncio.stato === 'nuovo' ? 'text-green-600' :
                          annuncio.stato === 'ristrutturato' ? 'text-blue-600' :
                          annuncio.stato === 'buono' ? 'text-yellow-600' :
                          'text-orange-600'
                        }`}>
                          <Check className="h-4 w-4" />
                          {annuncio.stato === 'nuovo' ? 'Nuovo' :
                           annuncio.stato === 'ristrutturato' ? 'Ristrutturato' :
                           annuncio.stato === 'buono' ? 'Buono stato' :
                           'Da ristrutturare'}
                        </span>
                      ) : 'N/D'}
                    </td>
                  ))}
                </tr>

                {/* Caratteristiche */}
                <tr>
                  <td className="p-4 border-b font-medium sticky left-0 bg-white align-top">Caratteristiche</td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 border-b align-top">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {annuncio.caratteristiche.slice(0, 5).map((car, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {car}
                          </span>
                        ))}
                        {annuncio.caratteristiche.length > 5 && (
                          <span className="text-xs text-gray-500">+{annuncio.caratteristiche.length - 5}</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Azioni */}
                <tr>
                  <td className="p-4 sticky left-0 bg-gray-50"></td>
                  {annunci.map((annuncio) => (
                    <td key={annuncio.id} className="p-4 text-center">
                      <Link to={`/annuncio/${annuncio.id}`}>
                        <Button className="bg-[#e74c3c] w-full">Vedi annuncio</Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
