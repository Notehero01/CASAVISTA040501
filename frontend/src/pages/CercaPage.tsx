import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Maximize, X, Map, List, Heart, Scale, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { annunciApi } from '@/utils/api';
import { usePreferiti } from '@/hooks/usePreferiti';
import { useConfronto } from '@/hooks/useConfronto';
import { MapView, AddressSearch } from '@/components/MapView';
import { SEO } from '@/utils/seo';
import { CLASSI_ENERGETICHE, STATI_IMMOBILE, RISCALDAMENTO, CARATTERISTICHE } from '@/types/annuncio';
import type { Annuncio } from '@/types/annuncio';

export function CercaPage() {
  const [searchParams] = useSearchParams();
  const [annunci, setAnnunci] = useState<Annuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { isPreferito, togglePreferito } = usePreferiti();
  const { isNelConfronto, toggleConfronto, canAddMore } = useConfronto();
  
  const [filters, setFilters] = useState({
    tipo: searchParams.get('tipo') || '',
    categoria: searchParams.get('categoria') || '',
    citta: searchParams.get('citta') || '',
    prezzoMin: '',
    prezzoMax: '',
    superficieMin: '',
    superficieMax: '',
    localiMin: '',
    camereMin: '',
    bagniMin: '',
    stato: '',
    classeEnergetica: '',
    riscaldamento: '',
    annoCostruzioneMin: '',
    annoCostruzioneMax: '',
    raggioKm: '',
    caratteristiche: [] as string[],
  });

  // Ottieni posizione utente per ricerca per raggio
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('Posizione rilevata!');
        },
        () => {
          toast.error('Impossibile ottenere la posizione');
        }
      );
    }
  };

  const handlePreferito = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    togglePreferito(id);
    toast.success(isPreferito(id) ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
  };

  const handleConfronto = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleConfronto(id);
    toast.success(result.message);
  };

  useEffect(() => {
    fetchAnnunci();
  }, []);

  const fetchAnnunci = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.categoria) params.categoria = filters.categoria;
      if (filters.citta) params.citta = filters.citta;
      if (filters.prezzoMin) params.prezzoMin = filters.prezzoMin;
      if (filters.prezzoMax) params.prezzoMax = filters.prezzoMax;
      if (filters.superficieMin) params.superficieMin = filters.superficieMin;
      if (filters.superficieMax) params.superficieMax = filters.superficieMax;
      if (filters.localiMin) params.localiMin = filters.localiMin;
      if (filters.camereMin) params.camereMin = filters.camereMin;
      if (filters.bagniMin) params.bagniMin = filters.bagniMin;
      if (filters.stato) params.stato = filters.stato;
      if (filters.classeEnergetica) params.classeEnergetica = filters.classeEnergetica;
      if (filters.riscaldamento) params.riscaldamento = filters.riscaldamento;
      if (filters.annoCostruzioneMin) params.annoCostruzioneMin = filters.annoCostruzioneMin;
      if (filters.annoCostruzioneMax) params.annoCostruzioneMax = filters.annoCostruzioneMax;
      if (filters.raggioKm && userLocation) {
        params.raggioKm = filters.raggioKm;
        params.lat = userLocation.lat.toString();
        params.lng = userLocation.lng.toString();
      }
      if (filters.caratteristiche.length > 0) {
        params.caratteristiche = filters.caratteristiche.join(',');
      }
      
      const data = await annunciApi.getAll(params);
      setAnnunci(data.annunci);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCaratteristica = (car: string) => {
    setFilters(prev => ({
      ...prev,
      caratteristiche: prev.caratteristiche.includes(car)
        ? prev.caratteristiche.filter(c => c !== car)
        : [...prev.caratteristiche, car]
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipo: '',
      categoria: '',
      citta: '',
      prezzoMin: '',
      prezzoMax: '',
      superficieMin: '',
      superficieMax: '',
      localiMin: '',
      camereMin: '',
      bagniMin: '',
      stato: '',
      classeEnergetica: '',
      riscaldamento: '',
      annoCostruzioneMin: '',
      annoCostruzioneMax: '',
      raggioKm: '',
      caratteristiche: [],
    });
    setUserLocation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Città" value={filters.citta} onChange={(e) => setFilters({ ...filters, citta: e.target.value })} className="pl-10" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />Filtri
            </Button>
            <Button onClick={fetchAnnunci} className="bg-[#e74c3c]"><Search className="h-4 w-4 mr-2" />Cerca</Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              {/* Filtri base */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Prezzo min (€)</label>
                  <Input type="number" placeholder="0" value={filters.prezzoMin} onChange={(e) => setFilters({ ...filters, prezzoMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Prezzo max (€)</label>
                  <Input type="number" placeholder="Max" value={filters.prezzoMax} onChange={(e) => setFilters({ ...filters, prezzoMax: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Superficie min (m²)</label>
                  <Input type="number" placeholder="0" value={filters.superficieMin} onChange={(e) => setFilters({ ...filters, superficieMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Superficie max (m²)</label>
                  <Input type="number" placeholder="Max" value={filters.superficieMax} onChange={(e) => setFilters({ ...filters, superficieMax: e.target.value })} />
                </div>
              </div>

              {/* Filtri avanzati */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Locali min</label>
                  <Input type="number" placeholder="1" value={filters.localiMin} onChange={(e) => setFilters({ ...filters, localiMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Camere min</label>
                  <Input type="number" placeholder="1" value={filters.camereMin} onChange={(e) => setFilters({ ...filters, camereMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Bagni min</label>
                  <Input type="number" placeholder="1" value={filters.bagniMin} onChange={(e) => setFilters({ ...filters, bagniMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Stato</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={filters.stato}
                    onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
                  >
                    <option value="">Tutti</option>
                    {STATI_IMMOBILE.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Classe energetica</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={filters.classeEnergetica}
                    onChange={(e) => setFilters({ ...filters, classeEnergetica: e.target.value })}
                  >
                    <option value="">Tutte</option>
                    {CLASSI_ENERGETICHE.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Riscaldamento</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={filters.riscaldamento}
                    onChange={(e) => setFilters({ ...filters, riscaldamento: e.target.value })}
                  >
                    <option value="">Tutti</option>
                    {RISCALDAMENTO.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Anno costruzione da</label>
                  <Input type="number" placeholder="1900" value={filters.annoCostruzioneMin} onChange={(e) => setFilters({ ...filters, annoCostruzioneMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Anno costruzione a</label>
                  <Input type="number" placeholder="2024" value={filters.annoCostruzioneMax} onChange={(e) => setFilters({ ...filters, annoCostruzioneMax: e.target.value })} />
                </div>
              </div>

              {/* Ricerca per raggio */}
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#e74c3c]" />
                  <span className="text-sm font-medium">Cerca nelle vicinanze</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={getUserLocation}
                  className={userLocation ? 'bg-green-50 text-green-700' : ''}
                >
                  {userLocation ? 'Posizione attiva' : 'Usa la mia posizione'}
                </Button>
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Entro</span>
                    <select 
                      className="px-2 py-1 border rounded text-sm"
                      value={filters.raggioKm}
                      onChange={(e) => setFilters({ ...filters, raggioKm: e.target.value })}
                    >
                      <option value="1">1 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="20">20 km</option>
                      <option value="50">50 km</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Caratteristiche */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Caratteristiche</label>
                <div className="flex flex-wrap gap-2">
                  {CARATTERISTICHE.slice(0, 10).map((car) => (
                    <button
                      key={car}
                      onClick={() => toggleCaratteristica(car)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.caratteristiche.includes(car)
                          ? 'bg-[#e74c3c] text-white'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      {car}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pulsanti azione filtri */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />Resetta filtri
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{annunci.length} annunci trovati</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#e74c3c]' : ''}
            >
              <List className="h-4 w-4 mr-2" />Lista
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-[#e74c3c]' : ''}
            >
              <Map className="h-4 w-4 mr-2" />Mappa
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'map' ? (
          <MapView annunci={annunci} height="600px" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annunci.map((a) => (
              <Link key={a.id} to={`/annuncio/${a.slug || a.id}`} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-[4/3] relative">
                  <img src={a.immagini[0] || 'https://via.placeholder.com/400x300'} alt={a.titolo} className="w-full h-full object-cover" />
                  <Badge className={`absolute top-3 left-3 ${a.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}`}>
                    {a.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                  </Badge>
                  {/* Pulsanti azione */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handlePreferito(e, a.id)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        isPreferito(a.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isPreferito(a.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleConfronto(e, a.id)}
                      disabled={!isNelConfronto(a.id) && !canAddMore}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        isNelConfronto(a.id) ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:text-blue-500'
                      } ${!isNelConfronto(a.id) && !canAddMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Scale className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{a.titolo}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{a.citta}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{a.camere}</span>
                    <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{a.bagni}</span>
                    <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{a.superficie}m²</span>
                  </div>
                  <p className="text-xl font-bold text-[#e74c3c] mt-3">€ {a.prezzo.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
