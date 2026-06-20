import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle, Mail, MapPin, Phone, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { amministrazioniApi } from '@/utils/api';
import { SEO } from '@/utils/seo';
import { toast } from 'sonner';

interface Agenzia {
  id: string;
  slug?: string;
  nome: string;
  cognome: string;
  displayName?: string;
  email: string;
  telefono?: string;
  citta?: string;
  servizi?: string[];
  verified?: boolean;
  ragioneSociale?: string;
  logo?: string;
  coverImage?: string;
  annunciCount?: number;
}

export function AgenziePage() {
  const [agenzie, setAgenzie] = useState<Agenzia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    amministrazioniApi.getAll()
      .then(setAgenzie)
      .catch(() => toast.error('Impossibile caricare le agenzie.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = agenzie.filter((agenzia) => {
    const haystack = `${agenzia.nome} ${agenzia.cognome} ${agenzia.ragioneSociale || ''} ${agenzia.citta || ''}`.toLowerCase();
    return !searchQuery || haystack.includes(searchQuery.toLowerCase());
  });
  const agenzieStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Agenzie immobiliari su CasaVista',
    itemListElement: filtered.slice(0, 50).map((agenzia, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: agenzia.displayName || agenzia.ragioneSociale || `${agenzia.nome} ${agenzia.cognome}`,
      url: `https://casavista.it/agenzia/${agenzia.slug || agenzia.id}`
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 md:py-12">
      <SEO
        title="Agenzie immobiliari a Modena | CasaVista"
        description="Scopri le agenzie immobiliari registrate su CasaVista e consulta i loro annunci a Modena e provincia."
        url="https://casavista.it/agenzie"
        structuredData={agenzieStructuredData}
      />
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center md:mb-12">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#e74c3c]/10">
            <Building2 className="h-8 w-8 text-[#e74c3c]" />
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Agenzie immobiliari</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Trova le agenzie registrate su CasaVista e consulta gli annunci pubblicati.
          </p>
          <div className="mt-6">
            <Link to="/registrazione">
              <Button className="bg-[#e74c3c]">
                <Building2 className="mr-2 h-4 w-4" />Registra la tua agenzia
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm md:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cerca agenzia o citta"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {loading && (
            <Card className="lg:col-span-2">
              <CardContent className="p-8 text-center text-gray-500">
                Caricamento agenzie...
              </CardContent>
            </Card>
          )}

          {!loading && filtered.length === 0 && (
            <Card className="lg:col-span-2">
              <CardContent className="p-8 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900">Nessuna agenzia trovata</h2>
                <p className="mt-2 text-gray-500">Le agenzie compariranno qui appena completano il profilo.</p>
                <Link to="/registrazione">
                  <Button className="mt-5 bg-[#e74c3c]">Registra la tua agenzia</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!loading && filtered.map((agenzia) => (
            <Card key={agenzia.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              {agenzia.coverImage && (
                <div className="aspect-[5/2] bg-gray-100">
                  <img src={agenzia.coverImage} alt={agenzia.displayName || agenzia.ragioneSociale || agenzia.nome} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e74c3c]/10 md:h-16 md:w-16">
                    {agenzia.logo ? (
                      <img src={agenzia.logo} alt={agenzia.displayName || agenzia.ragioneSociale || agenzia.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7 text-[#e74c3c] md:h-8 md:w-8" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold">
                          {agenzia.displayName || agenzia.ragioneSociale || `${agenzia.nome} ${agenzia.cognome}`}
                        </h3>
                        {agenzia.verified && (
                          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            <CheckCircle className="h-3 w-3" />Verificata
                          </span>
                        )}
                      </div>
                      <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                        {agenzia.annunciCount || 0} annunci
                      </span>
                    </div>

                    {Boolean(agenzia.servizi?.length) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {agenzia.servizi?.slice(0, 4).map((servizio) => (
                          <span key={servizio} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{servizio}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                      {agenzia.citta && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{agenzia.citta}</span>}
                      {agenzia.telefono && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{agenzia.telefono}</span>}
                      {agenzia.email && <span className="flex items-center gap-1 break-all"><Mail className="h-4 w-4" />{agenzia.email}</span>}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/agenzia/${agenzia.slug || agenzia.id}`}>Pagina agenzia</Link>
                      </Button>
                      <Button className="flex-1 bg-[#e74c3c]" asChild>
                        <a href={`mailto:${agenzia.email}`}>Contatta</a>
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
