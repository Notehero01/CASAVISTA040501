import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  Bed,
  Building2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { amministrazioniApi } from '@/utils/api';
import { SEO } from '@/utils/seo';
import type { Annuncio } from '@/types/annuncio';

interface AgenziaProfile {
  id: string;
  slug: string;
  displayName: string;
  ragioneSociale: string;
  descrizione?: string;
  email?: string;
  telefono?: string;
  whatsapp?: string;
  citta?: string;
  provincia?: string;
  indirizzo?: string;
  sitoWeb?: string;
  logo?: string;
  coverImage?: string;
  servizi?: string[];
  verified?: boolean;
  annunciCount: number;
  venditaCount: number;
  affittoCount: number;
  createdAt?: string;
  annunci?: Annuncio[];
}

function normalizeWebsite(url?: string) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function normalizePhone(value?: string) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'CV';
}

export function AgenziaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [agenzia, setAgenzia] = useState<AgenziaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    amministrazioniApi.getById(slug)
      .then(setAgenzia)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const annunci = useMemo(() => agenzia?.annunci || [], [agenzia]);
  const whatsappUrl = agenzia?.whatsapp
    ? `https://wa.me/${normalizePhone(agenzia.whatsapp)}`
    : '';
  const websiteUrl = normalizeWebsite(agenzia?.sitoWeb);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !agenzia) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold">Agenzia non trovata</h1>
          <p className="mt-2 text-gray-600">La pagina cercata non esiste o non e piu disponibile.</p>
          <Link to="/amministrazioni">
            <Button className="mt-6 bg-[#e74c3c]">Torna alle agenzie</Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = `${agenzia.displayName} | Agenzia immobiliare su CasaVista`;
  const description = agenzia.descrizione
    ? agenzia.descrizione.slice(0, 155)
    : `Scopri gli annunci immobiliari di ${agenzia.displayName} su CasaVista.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={title}
        description={description}
        image={agenzia.coverImage || agenzia.logo}
        url={`https://casavista.it/agenzia/${agenzia.slug}`}
        type="profile"
      />

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/amministrazioni" className="inline-flex items-center text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />Torna alle agenzie
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                {agenzia.logo ? (
                  <img src={agenzia.logo} alt={agenzia.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#e74c3c]">{getInitials(agenzia.displayName)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {agenzia.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      <BadgeCheck className="h-4 w-4" />Agenzia verificata
                    </span>
                  )}
                  {agenzia.citta && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      <MapPin className="h-4 w-4" />{agenzia.citta}
                    </span>
                  )}
                </div>
                <h1 className="break-words text-3xl font-bold tracking-normal text-gray-900 md:text-4xl">
                  {agenzia.displayName}
                </h1>
                {agenzia.indirizzo && (
                  <p className="mt-2 flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0" />{agenzia.indirizzo}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-lg border bg-gray-50 text-center">
              <div className="p-3">
                <p className="text-2xl font-bold text-gray-900">{agenzia.annunciCount}</p>
                <p className="text-xs text-gray-500">Annunci</p>
              </div>
              <div className="border-x p-3">
                <p className="text-2xl font-bold text-gray-900">{agenzia.venditaCount}</p>
                <p className="text-xs text-gray-500">Vendita</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-bold text-gray-900">{agenzia.affittoCount}</p>
                <p className="text-xs text-gray-500">Affitto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-lg border bg-white p-5 md:p-6">
            <h2 className="text-xl font-semibold">Profilo agenzia</h2>
            {agenzia.descrizione ? (
              <p className="mt-3 whitespace-pre-line text-gray-600">{agenzia.descrizione}</p>
            ) : (
              <p className="mt-3 text-gray-500">Questa agenzia non ha ancora completato la descrizione pubblica.</p>
            )}

            {Boolean(agenzia.servizi?.length) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {agenzia.servizi?.map(servizio => (
                  <Badge key={servizio} variant="outline" className="bg-gray-50">
                    {servizio}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Annunci pubblicati</h2>
                <p className="text-sm text-gray-500">Immobili caricati da questa agenzia su CasaVista.</p>
              </div>
              {agenzia.citta && (
                <Link to={`/cerca?citta=${encodeURIComponent(agenzia.citta)}`}>
                  <Button variant="outline" size="sm">Vedi zona</Button>
                </Link>
              )}
            </div>

            {annunci.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  L'agenzia non ha ancora annunci pubblicati.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {annunci.map(annuncio => (
                  <Link
                    key={annuncio.id}
                    to={`/annuncio/${annuncio.slug || annuncio.id}`}
                    className="overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img
                        src={annuncio.immagini?.[0] || 'https://via.placeholder.com/600x450'}
                        alt={annuncio.titolo}
                        className="h-full w-full object-cover"
                      />
                      <Badge className={`absolute left-3 top-3 ${annuncio.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}`}>
                        {annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-semibold text-gray-900">{annuncio.titolo}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />{annuncio.citta}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{annuncio.camere}</span>
                        <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{annuncio.bagni}</span>
                        <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{annuncio.superficie} m2</span>
                      </div>
                      <p className="mt-3 text-xl font-bold text-[#e74c3c]">
                        Euro {Number(annuncio.prezzo || 0).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-5 md:sticky md:top-24">
            <h2 className="text-lg font-semibold">Contatta agenzia</h2>
            <div className="mt-4 space-y-3 text-sm">
              {agenzia.telefono && (
                <a href={`tel:${normalizePhone(agenzia.telefono)}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <Phone className="h-4 w-4 text-[#e74c3c]" />
                  <span className="break-all">{agenzia.telefono}</span>
                </a>
              )}
              {agenzia.email && (
                <a href={`mailto:${agenzia.email}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <Mail className="h-4 w-4 text-[#e74c3c]" />
                  <span className="break-all">{agenzia.email}</span>
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span>WhatsApp</span>
                </a>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <Globe className="h-4 w-4 text-[#e74c3c]" />
                  <span className="break-all">Sito web</span>
                  <ExternalLink className="ml-auto h-3 w-3 text-gray-400" />
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
