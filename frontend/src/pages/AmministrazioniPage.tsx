import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, MapPin, Phone, Mail, Star, Search, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const SERVIZI = [
  'Amministrazione condominiale',
  'Contabilità',
  'Manutenzione ordinaria',
  'Manutenzione straordinaria',
  'Consulenza legale',
  'Assicurazioni'
];

interface Amministrazione {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  citta?: string;
  rating?: number;
  recensioni?: number;
  servizi?: string[];
}

export function AmministrazioniPage() {
  const [amministrazioni, setAmministrazioni] = useState<Amministrazione[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroServizi, setFiltroServizi] = useState<string[]>([]);

  useEffect(() => {
    // Simulazione dati - in produzione verrebbero dall'API
    setAmministrazioni([
      {
        id: '1',
        nome: 'Studio',
        cognome: 'Rossi Amministrazioni',
        email: 'rossi@example.com',
        telefono: '+39 333 1234567',
        citta: 'Firenze',
        rating: 4.5,
        recensioni: 23,
        servizi: ['Amministrazione condominiale', 'Contabilità']
      },
      {
        id: '2',
        nome: 'Amministrazione',
        cognome: 'Bianchi',
        email: 'bianchi@example.com',
        telefono: '+39 338 7654321',
        citta: 'Milano',
        rating: 4.8,
        recensioni: 45,
        servizi: ['Amministrazione condominiale', 'Manutenzione ordinaria']
      }
    ]);
  }, []);

  const filtered = amministrazioni.filter(a => {
    const matchSearch = !searchQuery || a.nome.toLowerCase().includes(searchQuery.toLowerCase()) || a.citta?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchServizi = filtroServizi.length === 0 || filtroServizi.every(s => a.servizi?.includes(s));
    return matchSearch && matchServizi;
  });

  const toggleServizio = (s: string) => {
    setFiltroServizi(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e74c3c]/10 rounded-full mb-4">
            <Building className="h-8 w-8 text-[#e74c3c]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Amministrazioni Condominiali</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trova e confronta le migliori amministrazioni della tua zona
          </p>
          <div className="mt-6">
            <Link to="/registrazione">
              <Button className="bg-[#e74c3c]">
                <Building className="h-4 w-4 mr-2" />Registra la tua amministrazione
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Cerca amministrazione o città..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <p className="text-sm text-gray-500 mb-2">Filtra per servizi:</p>
          <div className="flex flex-wrap gap-2">
            {SERVIZI.map((s) => (
              <button
                key={s}
                onClick={() => toggleServizio(s)}
                className={`px-3 py-1.5 rounded-full text-sm border ${filtroServizi.includes(s) ? 'bg-[#e74c3c] text-white border-[#e74c3c]' : 'border-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((amm) => (
            <Card key={amm.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#e74c3c] to-[#c0392b] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{amm.nome} {amm.cognome}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= Math.round(amm.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">{amm.rating} ({amm.recensioni} recensioni)</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />Verificata
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {amm.servizi?.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                      {amm.citta && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{amm.citta}</span>}
                      {amm.telefono && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{amm.telefono}</span>}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1">Dettagli</Button>
                      <Button className="flex-1 bg-[#e74c3c]">Contatta</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
