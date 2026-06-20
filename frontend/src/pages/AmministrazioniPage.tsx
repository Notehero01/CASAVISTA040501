import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, CheckCircle, Mail, MapPin, Phone, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { amministrazioniApi } from '@/utils/api';
import { toast } from 'sonner';

const SERVIZI = [
  'Amministrazione condominiale',
  'Contabilita',
  'Manutenzione ordinaria',
  'Manutenzione straordinaria',
  'Consulenza legale',
  'Assicurazioni'
];

interface Amministrazione {
  id: string;
  slug?: string;
  nome: string;
  cognome: string;
  displayName?: string;
  email: string;
  telefono?: string;
  citta?: string;
  rating?: number;
  recensioni?: number;
  servizi?: string[];
  verified?: boolean;
  ragioneSociale?: string;
  logo?: string;
  annunciCount?: number;
}

function isCondominiumAdministration(amministrazione: Amministrazione) {
  return (amministrazione.servizi || []).some(servizio => {
    const normalized = servizio.toLowerCase();
    return normalized.includes('amministrazione') || normalized.includes('condomin');
  });
}

export function AmministrazioniPage() {
  const [amministrazioni, setAmministrazioni] = useState<Amministrazione[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroServizi, setFiltroServizi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    amministrazioniApi.getAll()
      .then(setAmministrazioni)
      .catch(() => toast.error('Impossibile caricare le amministrazioni.'))
      .finally(() => setLoading(false));
  }, []);

  const amministrazioniCondominiali = amministrazioni.filter(isCondominiumAdministration);

  const filtered = amministrazioniCondominiali.filter((a) => {
    const haystack = `${a.nome} ${a.cognome} ${a.ragioneSociale || ''} ${a.citta || ''}`.toLowerCase();
    const matchSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    const matchServizi = filtroServizi.length === 0 || filtroServizi.every(s => a.servizi?.includes(s));
    return matchSearch && matchServizi;
  });

  const toggleServizio = (s: string) => {
    setFiltroServizi(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e74c3c]/10 rounded-full mb-4">
            <Building className="h-8 w-8 text-[#e74c3c]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Amministrazioni condominiali</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trova profili specializzati in amministrazione condominiale registrati su CasaVista.
          </p>
          <div className="mt-6">
            <Link to="/registrazione">
              <Button className="bg-[#e74c3c]">
                <Building className="h-4 w-4 mr-2" />Registra il tuo profilo
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Cerca amministrazione o citta"
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
          {loading && (
            <Card className="lg:col-span-2">
              <CardContent className="p-8 text-center text-gray-500">
                Caricamento amministrazioni...
              </CardContent>
            </Card>
          )}

          {!loading && filtered.length === 0 && (
            <Card className="lg:col-span-2">
              <CardContent className="p-8 text-center">
                <Building className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900">Nessuna amministrazione trovata</h2>
                <p className="mt-2 text-gray-500">I profili con servizio di amministrazione condominiale compariranno qui.</p>
                <Link to="/registrazione">
                  <Button className="mt-5 bg-[#e74c3c]">Registra il tuo profilo</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!loading && filtered.map((amm) => (
            <Card key={amm.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#e74c3c]/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {amm.logo ? (
                      <img src={amm.logo} alt={amm.displayName || amm.ragioneSociale || amm.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Building className="h-7 w-7 md:h-8 md:w-8 text-[#e74c3c]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold break-words">
                          {amm.displayName || amm.ragioneSociale || `${amm.nome} ${amm.cognome}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= Math.round(amm.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">
                            {amm.rating || 0} ({amm.recensioni || 0} recensioni)
                          </span>
                        </div>
                      </div>
                      {amm.verified && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          <CheckCircle className="h-3 w-3" />Verificata
                        </span>
                      )}
                    </div>

                    {Boolean(amm.servizi?.length) && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {amm.servizi?.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                      {amm.citta && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{amm.citta}</span>}
                      <span className="flex items-center gap-1"><Building className="h-4 w-4" />{amm.annunciCount || 0} annunci</span>
                      {amm.telefono && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{amm.telefono}</span>}
                      {amm.email && <span className="flex items-center gap-1 break-all"><Mail className="h-4 w-4" />{amm.email}</span>}
                    </div>

                    <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/agenzia/${amm.slug || amm.id}`}>Dettagli</Link>
                      </Button>
                      <Button className="flex-1 bg-[#e74c3c]" asChild>
                        <a href={`mailto:${amm.email}`}>Contatta</a>
                      </Button>
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
