import { useEffect, useRef, useState } from 'react';
import { MapPin, X, Bed, Bath, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Annuncio } from '@/types/annuncio';

interface MapViewProps {
  annunci: Annuncio[];
  onAnnuncioClick?: (annuncio: Annuncio) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

// Componente mappa che usa Google Maps API
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function MapView({ annunci, onAnnuncioClick, center, zoom = 12, height = '500px' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedAnnuncio, setSelectedAnnuncio] = useState<Annuncio | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Carica script Google Maps
  useEffect(() => {
    if (window.google) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Inizializza mappa
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !window.google) return;

    const defaultCenter = center || { lat: 41.9028, lng: 12.4964 }; // Roma
    
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(newMap);
  }, [scriptLoaded, center, zoom]);

  // Aggiungi marker per ogni annuncio
  useEffect(() => {
    if (!map || !window.google) return;

    // Rimuovi marker precedenti
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: any[] = [];
    const bounds = new window.google.maps.LatLngBounds();

    annunci.forEach((annuncio) => {
      if (!annuncio.coordinate) return;

      const marker = new window.google.maps.Marker({
        position: { lat: annuncio.coordinate.lat, lng: annuncio.coordinate.lng },
        map: map,
        title: annuncio.titolo,
        icon: {
          url: annuncio.tipo === 'vendita' 
            ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2U3NGMzYyI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg=='
            : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzI1NmViYiI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      marker.addListener('click', () => {
        setSelectedAnnuncio(annuncio);
        if (onAnnuncioClick) onAnnuncioClick(annuncio);
      });

      newMarkers.push(marker);
      bounds.extend({ lat: annuncio.coordinate.lat, lng: annuncio.coordinate.lng });
    });

    setMarkers(newMarkers);

    // Centra mappa sui marker se ce ne sono
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      // Se c'è un solo marker, zooma di più
      if (newMarkers.length === 1) {
        map.setZoom(15);
      }
    }
  }, [map, annunci]);

  if (!scriptLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="rounded-lg overflow-hidden" style={{ height }} />
      
      {/* Popup annuncio selezionato */}
      {selectedAnnuncio && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-sm">
          <button 
            onClick={() => setSelectedAnnuncio(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex gap-3">
            <img 
              src={selectedAnnuncio.immagini[0] || 'https://via.placeholder.com/100x75'} 
              alt={selectedAnnuncio.titolo}
              className="w-24 h-16 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{selectedAnnuncio.titolo}</h4>
              <p className="text-gray-500 text-xs">{selectedAnnuncio.citta}</p>
              <div className="flex gap-2 mt-1 text-xs text-gray-600">
                <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{selectedAnnuncio.camere}</span>
                <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{selectedAnnuncio.bagni}</span>
                <span className="flex items-center gap-0.5"><Maximize className="h-3 w-3" />{selectedAnnuncio.superficie}m²</span>
              </div>
              <p className="text-[#e74c3c] font-bold mt-1">€ {selectedAnnuncio.prezzo.toLocaleString()}</p>
            </div>
          </div>
          
          <Button 
            size="sm" 
            className="w-full mt-3 bg-[#e74c3c]"
            onClick={() => window.location.href = `/annuncio/${selectedAnnuncio.id}`}
          >
            Vedi dettagli
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente per ricerca indirizzo con autocomplete
export function AddressSearch({ onSelect, placeholder = 'Cerca indirizzo...' }: { onSelect: (address: string, coordinates: { lat: number; lng: number }) => void; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.google) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'it' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        onSelect(place.formatted_address, {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  }, [scriptLoaded, onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e74c3c] focus:border-transparent"
    />
  );
}
