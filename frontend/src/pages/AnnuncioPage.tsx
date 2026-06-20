import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, User, Phone, Mail, ArrowLeft, Heart, Check, Eye, MessageCircle, Scale, Share2, BadgeCheck, Building2, ChevronLeft, ChevronRight, Image, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { annunciApi, authApi } from '@/utils/api';
import { usePreferiti } from '@/hooks/usePreferiti';
import { useConfronto } from '@/hooks/useConfronto';
import { MapView } from '@/components/MapView';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import { SEO, generateMetaTitle, generateMetaDescription } from '@/utils/seo';
import { RISCALDAMENTO, STATI_IMMOBILE } from '@/types/annuncio';
import type { Annuncio } from '@/types/annuncio';
import type { User as AuthUser } from '@/hooks/useAuth';

interface AnnuncioPageProps {
  currentUser: AuthUser | null;
  onStartChat: (annuncio: Annuncio) => Promise<string>;
}

function getPropertySchemaType(categoria: Annuncio['categoria']) {
  const schemaTypes: Record<Annuncio['categoria'], string> = {
    appartamento: 'Apartment',
    casa: 'House',
    villa: 'House',
    ufficio: 'Place',
    negozio: 'Store',
    terreno: 'Landform'
  };

  return schemaTypes[categoria] || 'Accommodation';
}

export function AnnuncioPage({ currentUser, onStartChat }: AnnuncioPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [annuncio, setAnnuncio] = useState<Annuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    isVerified?: boolean;
    isAgency?: boolean;
    slug?: string;
    displayName?: string;
    ragioneSociale?: string;
    annunciCount?: number;
  } | null>(null);
  const { isPreferito, togglePreferito } = usePreferiti();
  const { isNelConfronto, toggleConfronto, canAddMore } = useConfronto();
  const immagini = Array.isArray(annuncio?.immagini) ? annuncio.immagini.filter(Boolean) : [];
  const activeImage = immagini[activeImageIndex] || 'https://via.placeholder.com/800x600';
  const hasMultipleImages = immagini.length > 1;
  const canEditAnnuncio = Boolean(currentUser && annuncio && (currentUser.id === annuncio.userId || currentUser.tipo === 'admin'));
  const moderationStatus = annuncio?.moderationStatus || 'published';
  const isPublished = moderationStatus === 'published';
  const moderationCopy = {
    pending: {
      label: 'Annuncio in revisione',
      text: 'Questo annuncio non e ancora visibile al pubblico. Un admin deve approvarlo.'
    },
    hidden: {
      label: 'Annuncio nascosto',
      text: 'Questo annuncio non e visibile al pubblico.'
    },
    rejected: {
      label: 'Annuncio da correggere',
      text: 'Questo annuncio non e visibile al pubblico. Modificalo e reinvialo in revisione.'
    }
  } as const;
  const showPreviousImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex((current) => (current === 0 ? immagini.length - 1 : current - 1));
  };
  const showNextImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex((current) => (current + 1) % immagini.length);
  };
  const closeLightbox = () => setIsLightboxOpen(false);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      setAnnuncio(null);
      setUserInfo(null);

      // Incrementa visualizzazioni
      annunciApi.incrementViews(slug).catch(() => {});
      
      annunciApi.getById(slug)
        .then(data => {
          setAnnuncio(data);
          // Carica info utente per badge verificato
          if (data.userId) {
            authApi.getPublicUser(data.userId)
              .then(setUserInfo)
              .catch(() => {});
          }
        })
        .catch(() => {
          setAnnuncio(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [slug]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [annuncio?.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') showPreviousImage();
      if (event.key === 'ArrowRight') showNextImage();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: annuncio?.titolo,
          text: `Guarda questo annuncio su CasaVista: ${annuncio?.titolo}`,
          url: window.location.href,
        });
      } catch (err) {
        // Utente ha annullato
      }
    } else {
      // Fallback: copia link
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiato negli appunti!');
    }
  };

  const handlePreferito = () => {
    if (annuncio?.id) {
      togglePreferito(annuncio.id);
      toast.success(isPreferito(annuncio.id) ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
    }
  };

  const handleConfronto = () => {
    if (annuncio?.id) {
      const result = toggleConfronto(annuncio.id);
      toast.success(result.message);
    }
  };

  const handleStartChat = async () => {
    if (!annuncio) return;
    if (!currentUser) {
      toast.error('Accedi o registrati per scrivere in chat.');
      navigate('/login');
      return;
    }
    if (currentUser.id === annuncio.userId) {
      toast.info('Questo annuncio appartiene al tuo account.');
      return;
    }

    setChatLoading(true);
    try {
      await onStartChat(annuncio);
      toast.success('Chat aperta.');
    } catch (error: any) {
      toast.error(error.message || 'Impossibile aprire la chat.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" /></div>;
  if (!annuncio) return <div className="text-center py-20">Annuncio non trovato</div>;

  const statoLabel = STATI_IMMOBILE.find(item => item.value === annuncio.stato)?.label || annuncio.stato;
  const riscaldamentoLabel = RISCALDAMENTO.find(item => item.value === annuncio.riscaldamento)?.label || annuncio.riscaldamento;
  const technicalDetails = [
    annuncio.classe_energetica ? { label: 'Classe energetica', value: annuncio.classe_energetica } : null,
    statoLabel ? { label: 'Stato', value: statoLabel } : null,
    riscaldamentoLabel ? { label: 'Riscaldamento', value: riscaldamentoLabel } : null,
    annuncio.anno_costruzione ? { label: 'Anno costruzione', value: String(annuncio.anno_costruzione) } : null,
    annuncio.piano !== undefined && annuncio.piano !== null ? { label: 'Piano', value: String(annuncio.piano) } : null
  ].filter(Boolean) as { label: string; value: string }[];

  const metaTitle = generateMetaTitle(annuncio);
  const metaDescription = generateMetaDescription(annuncio);
  const canonicalUrl = `https://casavista.it/annuncio/${annuncio.slug || slug}`;
  const annuncioStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: annuncio.titolo,
    description: annuncio.descrizione,
    url: canonicalUrl,
    price: annuncio.prezzo,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    businessFunction: annuncio.tipo === 'affitto'
      ? 'http://purl.org/goodrelations/v1#LeaseOut'
      : 'http://purl.org/goodrelations/v1#Sell',
    image: immagini,
    seller: {
      '@type': userInfo?.isAgency ? 'RealEstateAgent' : 'Person',
      name: userInfo?.displayName || userInfo?.ragioneSociale || annuncio.nome_contatto,
      url: userInfo?.isAgency && userInfo.slug ? `https://casavista.it/agenzia/${userInfo.slug}` : undefined
    },
    itemOffered: {
      '@type': getPropertySchemaType(annuncio.categoria),
      name: annuncio.titolo,
      description: annuncio.descrizione,
      image: immagini,
      floorSize: {
        '@type': 'QuantitativeValue',
        value: annuncio.superficie,
        unitCode: 'MTK'
      },
      numberOfRooms: annuncio.locali,
      numberOfBedrooms: annuncio.camere,
      numberOfBathroomsTotal: annuncio.bagni,
      address: {
        '@type': 'PostalAddress',
        streetAddress: annuncio.indirizzo,
        addressLocality: annuncio.citta,
        postalCode: annuncio.cap,
        addressRegion: annuncio.provincia,
        addressCountry: 'IT'
      },
      geo: annuncio.coordinate ? {
        '@type': 'GeoCoordinates',
        latitude: annuncio.coordinate.lat,
        longitude: annuncio.coordinate.lng
      } : undefined
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Dinamico */}
      <SEO 
        title={metaTitle}
        description={metaDescription}
        url={canonicalUrl}
        image={annuncio.immagini[0]}
        type="article"
        structuredData={annuncioStructuredData}
      />
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/cerca" className="inline-flex items-center text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />Torna alla ricerca
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!isPublished && moderationCopy[moderationStatus as keyof typeof moderationCopy] && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">{moderationCopy[moderationStatus as keyof typeof moderationCopy].label}</p>
            <p className="mt-1 text-sm">{moderationCopy[moderationStatus as keyof typeof moderationCopy].text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
              <div className="aspect-video relative">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="h-full w-full cursor-zoom-in bg-gray-100"
                  aria-label="Apri foto a schermo intero"
                >
                  <WatermarkedImage
                    src={activeImage}
                    alt={`${annuncio.titolo} - foto ${activeImageIndex + 1}`}
                    className="h-full w-full"
                    fit="contain"
                  />
                </button>
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={annuncio.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}>
                    {annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                  </Badge>
                </div>
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Foto precedente"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Foto successiva"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/65 px-3 py-1 text-sm font-medium text-white">
                      <Image className="h-4 w-4" />
                      {activeImageIndex + 1}/{immagini.length}
                    </div>
                  </>
                )}
              </div>
              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto border-t bg-white p-3">
                  {immagini.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        activeImageIndex === index ? 'border-[#e74c3c]' : 'border-transparent hover:border-gray-300'
                      }`}
                      aria-label={`Mostra foto ${index + 1}`}
                    >
                      <WatermarkedImage
                        src={img}
                        alt={`${annuncio.titolo} miniatura ${index + 1}`}
                        fit="contain"
                        watermark={false}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{annuncio.titolo}</h1>
                  <p className="text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{annuncio.indirizzo}, {annuncio.citta}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#e74c3c]">€ {annuncio.prezzo.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1"><Eye className="h-4 w-4" />{annuncio.visualizzazioni} views</p>
                </div>
              </div>

              {/* Azioni rapide */}
              <div className="flex flex-wrap gap-2 mb-6">
                {isPublished && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreferito}
                      className={isPreferito(annuncio.id) ? 'text-red-500 border-red-200 bg-red-50' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isPreferito(annuncio.id) ? 'fill-current' : ''}`} />
                      {isPreferito(annuncio.id) ? 'Salvato' : 'Salva'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConfronto}
                      disabled={!isNelConfronto(annuncio.id) && !canAddMore}
                      className={isNelConfronto(annuncio.id) ? 'text-blue-500 border-blue-200 bg-blue-50' : ''}
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      {isNelConfronto(annuncio.id) ? 'Nel confronto' : 'Confronta'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />Condividi
                    </Button>
                  </>
                )}
                {canEditAnnuncio && (
                  <Link to={`/modifica-annuncio/${annuncio.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-2" />Modifica
                    </Button>
                  </Link>
                )}
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Maximize className="h-6 w-6 text-[#e74c3c] mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Superficie</p>
                  <p className="font-semibold">{annuncio.superficie} m²</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Bed className="h-6 w-6 text-[#e74c3c] mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Camere</p>
                  <p className="font-semibold">{annuncio.camere}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Bath className="h-6 w-6 text-[#e74c3c] mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Bagni</p>
                  <p className="font-semibold">{annuncio.bagni}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Locali</p>
                  <p className="font-semibold">{annuncio.locali}</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold mb-3">Descrizione</h2>
              <p className="text-gray-600 whitespace-pre-line">{annuncio.descrizione}</p>

              {annuncio.caratteristiche.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold mt-6 mb-3">Caratteristiche</h2>
                  <div className="flex flex-wrap gap-2">
                    {annuncio.caratteristiche.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-1">
                        <Check className="h-3 w-3" />{c}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {technicalDetails.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold mt-6 mb-3">Dettagli immobile</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {technicalDetails.map((detail) => (
                      <div key={detail.label} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-500">{detail.label}</p>
                        <p className="font-semibold text-gray-900">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Mappa */}
              <h2 className="text-lg font-semibold mt-6 mb-3">Posizione</h2>
              <MapView 
                annunci={annuncio.coordinate ? [annuncio] : []} 
                center={annuncio.coordinate}
                zoom={15}
                height="300px"
              />
              {!annuncio.coordinate && (
                <p className="text-gray-500 text-sm mt-2">Coordinate non disponibili per questa proprietà</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Contatta</h3>
              
              {/* Badge Verificato */}
              {userInfo?.isVerified && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {userInfo?.isAgency ? 'Agenzia Verificata' : 'Utente Verificato'}
                    </p>
                    <p className="text-xs text-blue-600">
                      Identità confermata da CasaVista
                    </p>
                  </div>
                </div>
              )}

              {userInfo?.isAgency && (
                <Link
                  to={`/agenzia/${userInfo.slug || annuncio.userId}`}
                  className="mb-4 flex items-center gap-3 rounded-lg border bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="rounded-full bg-[#e74c3c]/10 p-3">
                    <Building2 className="h-5 w-5 text-[#e74c3c]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Pagina agenzia</p>
                    <p className="truncate font-medium">
                      {userInfo.displayName || userInfo.ragioneSociale || annuncio.nome_contatto}
                    </p>
                    <p className="text-xs text-gray-500">{userInfo.annunciCount || 0} annunci pubblicati</p>
                  </div>
                </Link>
              )}
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#e74c3c]/10 p-3 rounded-full">
                    <User className="h-5 w-5 text-[#e74c3c]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inserzionista</p>
                    <p className="font-medium">{annuncio.nome_contatto}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium">{annuncio.telefono_contatto}</p>
                  </div>
                </div>
              </div>

              {isPublished ? (
                <>
                  <Button
                    className="w-full bg-[#e74c3c] hover:bg-[#c0392b] mb-3"
                    onClick={handleStartChat}
                    disabled={chatLoading}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {chatLoading ? 'Apertura chat...' : 'Scrivi in chat'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = `tel:${annuncio.telefono_contatto}`}>
                    <Phone className="h-4 w-4 mr-2" />Chiama
                  </Button>
                </>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  I contatti saranno disponibili quando l annuncio sara approvato.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[1100] flex flex-col bg-black/95 text-white [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <div className="z-20 flex shrink-0 items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0 text-sm text-white/75">
              <p className="truncate font-medium text-white">{annuncio.titolo}</p>
              <p>{activeImageIndex + 1}/{immagini.length || 1}</p>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/22"
              aria-label="Chiudi foto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-0 sm:px-5" onClick={(event) => event.stopPropagation()}>
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 sm:left-8 sm:h-14 sm:w-14"
                  aria-label="Foto precedente nel viewer"
                >
                  <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 sm:right-8 sm:h-14 sm:w-14"
                  aria-label="Foto successiva nel viewer"
                >
                  <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
                </button>
              </>
            )}
            <WatermarkedImage
              src={activeImage}
              alt={`${annuncio.titolo} - foto ${activeImageIndex + 1}`}
              fit="contain"
              className="h-full min-h-0 w-full max-w-6xl bg-black"
              watermarkClassName="text-white/20 mix-blend-normal"
            />
          </div>

          {hasMultipleImages && (
            <div className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto flex max-h-24 max-w-6xl gap-2 overflow-x-auto rounded-xl bg-white/8 p-2">
                {immagini.map((img, index) => (
                  <button
                    key={`${img}-viewer-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-20 sm:w-28 ${
                      activeImageIndex === index ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Apri foto ${index + 1} nel viewer`}
                  >
                    <WatermarkedImage src={img} alt={`${annuncio.titolo} miniatura ${index + 1}`} fit="contain" watermark={false} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
