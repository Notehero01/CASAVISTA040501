import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, User, Phone, Mail, ArrowLeft, Heart, Check, Eye, MessageCircle, Scale, Share2, BadgeCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { annunciApi, authApi } from '@/utils/api';
import { usePreferiti } from '@/hooks/usePreferiti';
import { useConfronto } from '@/hooks/useConfronto';
import { MapView } from '@/components/MapView';
import { SEO, generateMetaTitle, generateMetaDescription } from '@/utils/seo';
import type { Annuncio } from '@/types/annuncio';
import type { User as AuthUser } from '@/hooks/useAuth';

interface AnnuncioPageProps {
  currentUser: AuthUser | null;
  onStartChat: (annuncio: Annuncio) => Promise<string>;
}

export function AnnuncioPage({ currentUser, onStartChat }: AnnuncioPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [annuncio, setAnnuncio] = useState<Annuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
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

  useEffect(() => {
    if (slug) {
      // Incrementa visualizzazioni
      annunciApi.incrementViews(slug).catch(() => {});
      
      annunciApi.getById(slug).then(data => {
        setAnnuncio(data);
        // Carica info utente per badge verificato
        if (data.userId) {
          authApi.getPublicUser(data.userId)
            .then(setUserInfo)
            .catch(() => {});
        }
        setLoading(false);
      });
    }
  }, [slug]);

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

  const metaTitle = generateMetaTitle(annuncio);
  const metaDescription = generateMetaDescription(annuncio);
  const canonicalUrl = `https://casavista.it/annuncio/${annuncio.slug || slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Dinamico */}
      <SEO 
        title={metaTitle}
        description={metaDescription}
        url={canonicalUrl}
        image={annuncio.immagini[0]}
        type="article"
      />
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/cerca" className="inline-flex items-center text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />Torna alla ricerca
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
              <div className="aspect-video relative">
                <img src={annuncio.immagini[0] || 'https://via.placeholder.com/800x600'} alt={annuncio.titolo} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={annuncio.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}>
                    {annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                  </Badge>
                </div>
              </div>
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
              <div className="flex gap-2 mb-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
