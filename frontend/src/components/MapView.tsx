import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bath, Bed, LocateFixed, MapPin, Maximize, Navigation, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WatermarkedImage } from '@/components/WatermarkedImage';
import type { Annuncio } from '@/types/annuncio';

interface MapViewProps {
  annunci: Annuncio[];
  onAnnuncioClick?: (annuncio: Annuncio) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showPoi?: boolean;
}

interface AddressSearchProps {
  onSelect: (
    address: string,
    coordinates: { lat: number; lng: number },
    details?: { citta?: string; cap?: string; provincia?: string }
  ) => void;
  placeholder?: string;
}

interface GeoResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string | undefined>;
}

interface Poi {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
  label: string;
  color: string;
}

interface PoiElement {
  id: number;
  type: string;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

const DEFAULT_CENTER: [number, number] = [44.6471, 10.9252]; // Modena
const MODENA_VIEWBOX = '10.73,44.78,11.08,44.49';
const PROVINCE_CODES: Record<string, string> = {
  modena: 'MO',
  bologna: 'BO',
  reggio: 'RE',
  parma: 'PR',
  piacenza: 'PC',
  ferrara: 'FE',
  ravenna: 'RA',
  forl: 'FC',
  rimini: 'RN'
};

const POI_STYLE: Record<string, { label: string; color: string }> = {
  restaurant: { label: 'Ristorante', color: '#ff6b35' },
  cafe: { label: 'Caffe', color: '#8b5a2b' },
  bar: { label: 'Bar', color: '#9b59b6' },
  pharmacy: { label: 'Farmacia', color: '#e74c3c' },
  bank: { label: 'Banca', color: '#3498db' },
  supermarket: { label: 'Supermercato', color: '#27ae60' },
  hotel: { label: 'Hotel', color: '#f59e0b' },
};

function formatPrice(annuncio: Annuncio) {
  return `EUR ${annuncio.prezzo.toLocaleString('it-IT')}${annuncio.tipo === 'affitto' ? '/mese' : ''}`;
}

function getAnnuncioUrl(annuncio: Annuncio) {
  return `/annuncio/${annuncio.slug || annuncio.id}`;
}

function cleanAddressPart(value?: string) {
  return String(value || '')
    .replace(/^Comune di\s+/i, '')
    .replace(/^Provincia di\s+/i, '')
    .trim();
}

function compactAddress(result: GeoResult) {
  const address = result.address || {};
  const road = address.road || address.pedestrian || address.footway || address.cycleway || address.path;
  const street = [cleanAddressPart(road), cleanAddressPart(address.house_number)].filter(Boolean).join(' ');
  const city = cleanAddressPart(address.city || address.town || address.village || address.municipality || address.county);
  const postcode = cleanAddressPart(address.postcode);
  const firstFallback = result.display_name.split(',')[0]?.trim();
  const parts = [street || firstFallback, city, postcode].filter(Boolean);

  return Array.from(new Set(parts)).join(', ');
}

function getProvinceCode(address?: Record<string, string | undefined>) {
  if (!address) return '';
  const isoCode = address['ISO3166-2-lvl6'] || address['ISO3166-2-lvl4'];
  const isoMatch = isoCode?.match(/IT-([A-Z]{2})$/i);
  if (isoMatch) return isoMatch[1].toUpperCase();

  const province = cleanAddressPart(address.province || address.county || address.state_district).toLowerCase();
  const matchedKey = Object.keys(PROVINCE_CODES).find(key => province.includes(key));
  return matchedKey ? PROVINCE_CODES[matchedKey] : '';
}

function getAddressDetails(result: GeoResult) {
  const address = result.address || {};
  return {
    citta: cleanAddressPart(address.city || address.town || address.village || address.municipality || address.county),
    cap: cleanAddressPart(address.postcode),
    provincia: getProvinceCode(address)
  };
}

function createAnnuncioIcon(tipo: Annuncio['tipo']) {
  const color = tipo === 'vendita' ? '#e74c3c' : '#2563eb';

  return L.divIcon({
    className: 'casavista-property-marker',
    html: `
      <div style="width:40px;height:48px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.25));">
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2C10.1 2 2 10.1 2 20c0 13.5 18 26 18 26s18-12.5 18-26C38 10.1 29.9 2 20 2Z" fill="${color}" stroke="white" stroke-width="3"/>
          <path d="M12.5 22.5V18l7.5-5.5 7.5 5.5v4.5c0 .8-.7 1.5-1.5 1.5h-3.5v-5h-5v5H14c-.8 0-1.5-.7-1.5-1.5Z" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -44],
  });
}

function createPoiIcon(poi: Poi) {
  return L.divIcon({
    className: 'casavista-poi-marker',
    html: `
      <div style="width:26px;height:26px;border-radius:999px;background:${poi.color};border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.22);display:flex;align-items:center;justify-content:center;">
        <span style="width:7px;height:7px;border-radius:999px;background:white;display:block;"></span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

function createClusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count > 99 ? 50 : count > 24 ? 44 : 38;

  return L.divIcon({
    className: 'casavista-cluster-marker',
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:999px;background:#111827;color:white;border:3px solid white;box-shadow:0 6px 18px rgba(17,24,39,.25);display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;font-size:13px;">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitMapToContent({ annunci, center, zoom }: { annunci: Annuncio[]; center?: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    const points = annunci
      .map((annuncio) => annuncio.coordinate)
      .filter((coordinate): coordinate is { lat: number; lng: number } => Boolean(coordinate));

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], Math.max(zoom, 15), { animate: true });
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [40, 40], maxZoom: 15 });
      return;
    }

    if (center) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
      return;
    }

    map.setView(DEFAULT_CENTER, 12);
  }, [annunci, center, map, zoom]);

  return null;
}

function MapController({ flyTarget, zoomAction }: { flyTarget: [number, number] | null; zoomAction: 'in' | 'out' | null }) {
  const map = useMap();

  useEffect(() => {
    if (flyTarget) map.flyTo(flyTarget, 15, { duration: 0.8 });
  }, [flyTarget, map]);

  useEffect(() => {
    if (zoomAction === 'in') map.zoomIn();
    if (zoomAction === 'out') map.zoomOut();
  }, [map, zoomAction]);

  return null;
}

function PoiLoader({ enabled, onLoad, onLoading }: { enabled: boolean; onLoad: (pois: Poi[]) => void; onLoading: (loading: boolean) => void }) {
  const timerRef = useRef<number | null>(null);

  const fetchPois = useCallback(
    (map: L.Map) => {
      if (!enabled) return;

      if (timerRef.current) window.clearTimeout(timerRef.current);

      timerRef.current = window.setTimeout(async () => {
        const bounds = map.getBounds();
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();

        onLoading(true);

        try {
          const query = `[out:json][timeout:12];(node["amenity"~"restaurant|cafe|bar|pharmacy|bank|supermarket"](${south},${west},${north},${east});node["tourism"="hotel"](${south},${west},${north},${east}););out body 120;`;
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: new URLSearchParams({ data: query }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          const data = await response.json();
          const parsed = ((data.elements || []) as PoiElement[])
            .filter((item) => item.type === 'node' && item.tags?.name)
            .map((item) => {
              const type = item.tags?.amenity || item.tags?.tourism || 'poi';
              const style = POI_STYLE[type] || { label: 'Luogo', color: '#64748b' };

              return {
                id: item.id,
                lat: item.lat,
                lon: item.lon,
                name: item.tags?.name || 'Luogo',
                type,
                ...style,
              };
            });

          onLoad(parsed);
        } catch {
          onLoad([]);
        } finally {
          onLoading(false);
        }
      }, 600);
    },
    [enabled, onLoad, onLoading],
  );

  const map = useMapEvents({
    moveend: () => fetchPois(map),
    zoomend: () => fetchPois(map),
  });

  useEffect(() => {
    fetchPois(map);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [fetchPois, map]);

  return null;
}

function ControlButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-lg transition hover:scale-105 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function PropertyPopup({ annuncio, onAnnuncioClick }: { annuncio: Annuncio; onAnnuncioClick?: (annuncio: Annuncio) => void }) {
  return (
    <div className="w-64 overflow-hidden rounded-xl bg-white">
      <WatermarkedImage src={annuncio.immagini[0]} alt={annuncio.titolo} className="h-32 w-full" fit="contain" />
      <div className="space-y-2 p-3">
        <div>
          <p className="text-lg font-bold text-[#e74c3c]">{formatPrice(annuncio)}</p>
          <p className="line-clamp-2 text-sm font-semibold text-gray-900">{annuncio.titolo}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {annuncio.citta}
          </p>
        </div>
        <div className="flex justify-between border-y py-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {annuncio.camere}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {annuncio.bagni}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3 w-3" />
            {annuncio.superficie} mq
          </span>
        </div>
        <a
          href={getAnnuncioUrl(annuncio)}
          onClick={() => onAnnuncioClick?.(annuncio)}
          className="block rounded-lg bg-[#e74c3c] px-3 py-2 text-center text-sm font-semibold text-white"
        >
          Vedi dettagli
        </a>
      </div>
    </div>
  );
}

export function MapView({ annunci, onAnnuncioClick, center, zoom = 12, height = '500px', showPoi = true }: MapViewProps) {
  const [isSatellite, setIsSatellite] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [zoomAction, setZoomAction] = useState<'in' | 'out' | null>(null);
  const [searchText, setSearchText] = useState('');
  const [poiList, setPoiList] = useState<Poi[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);

  const annunciConCoordinate = useMemo(() => annunci.filter((annuncio) => annuncio.coordinate), [annunci]);
  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : annunciConCoordinate[0]?.coordinate
      ? [annunciConCoordinate[0].coordinate.lat, annunciConCoordinate[0].coordinate.lng]
      : DEFAULT_CENTER;

  const triggerZoom = (action: 'in' | 'out') => {
    setZoomAction(action);
    window.setTimeout(() => setZoomAction(null), 80);
  };

  const searchAddress = async () => {
    const query = searchText.trim();
    if (query.length < 3) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=it&addressdetails=1&dedupe=1&viewbox=${MODENA_VIEWBOX}&bounded=0`,
        { headers: { 'Accept-Language': 'it' } },
      );
      const results = (await response.json()) as GeoResult[];
      const first = results[0];
      if (first) setFlyTarget([Number(first.lat), Number(first.lon)]);
    } catch {
      // Search is optional; keep the map usable even when the geocoder is unavailable.
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm" style={{ height }}>
      <div className="absolute left-3 right-3 top-3 z-[600] flex max-w-md gap-2 sm:left-4 sm:right-auto sm:w-96">
        <div className="flex h-11 flex-1 items-center rounded-full border border-gray-200 bg-white px-4 shadow-lg">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && searchAddress()}
            placeholder="Cerca indirizzo, via o citta"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          {searchText && (
            <button type="button" aria-label="Cancella ricerca" onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={searchAddress}
          className="h-11 rounded-full bg-[#e74c3c] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#c0392b]"
        >
          Cerca
        </button>
      </div>

      <div className="absolute right-3 top-3 z-[600] hidden flex-col gap-2 sm:flex">
        <button
          type="button"
          onClick={() => setIsSatellite(false)}
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${!isSatellite ? 'bg-[#e74c3c] text-white' : 'bg-white text-gray-800'}`}
        >
          Mappa
        </button>
        <button
          type="button"
          onClick={() => setIsSatellite(true)}
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${isSatellite ? 'bg-[#e74c3c] text-white' : 'bg-white text-gray-800'}`}
        >
          Satellite
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-[600] flex flex-col gap-2">
        <ControlButton label="Zoom avanti" onClick={() => triggerZoom('in')}>
          <ZoomIn className="h-5 w-5" />
        </ControlButton>
        <ControlButton label="Zoom indietro" onClick={() => triggerZoom('out')}>
          <ZoomOut className="h-5 w-5" />
        </ControlButton>
        <ControlButton label="Centra annunci" onClick={() => setFlyTarget(mapCenter)}>
          <Navigation className="h-5 w-5" />
        </ControlButton>
        <ControlButton
          label="Usa la mia posizione"
          onClick={() => navigator.geolocation?.getCurrentPosition((position) => setFlyTarget([position.coords.latitude, position.coords.longitude]))}
        >
          <LocateFixed className="h-5 w-5" />
        </ControlButton>
      </div>

      {showPoi && (
        <div className="absolute bottom-4 left-4 z-[600] rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-lg">
          {poiLoading ? 'Carico luoghi...' : `${poiList.length} luoghi vicini`}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={zoom} minZoom={5} maxZoom={19} scrollWheelZoom doubleClickZoom zoomControl={false} style={{ height: '100%', width: '100%' }}>
        {!isSatellite ? (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={19}
          />
        ) : (
          <>
            <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={19}
              opacity={0.9}
            />
          </>
        )}

        <FitMapToContent annunci={annunciConCoordinate} center={center} zoom={zoom} />
        <MapController flyTarget={flyTarget} zoomAction={zoomAction} />
        {showPoi && <PoiLoader enabled={showPoi} onLoad={setPoiList} onLoading={setPoiLoading} />}

        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} spiderfyOnMaxZoom iconCreateFunction={createClusterIcon}>
          {annunciConCoordinate.map((annuncio) => (
            <Marker
              key={annuncio.id}
              position={[annuncio.coordinate!.lat, annuncio.coordinate!.lng]}
              icon={createAnnuncioIcon(annuncio.tipo)}
              eventHandlers={{ click: () => onAnnuncioClick?.(annuncio) }}
            >
              <Popup closeButton={false} minWidth={260}>
                <PropertyPopup annuncio={annuncio} onAnnuncioClick={onAnnuncioClick} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {showPoi &&
          poiList.map((poi) => (
            <Marker key={`poi-${poi.id}`} position={[poi.lat, poi.lon]} icon={createPoiIcon(poi)}>
              <Popup closeButton={false}>
                <div className="min-w-40 p-2">
                  <p className="text-sm font-semibold text-gray-900">{poi.name}</p>
                  <p className="text-xs text-gray-500">{poi.label}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export function AddressSearch({ onSelect, placeholder = 'Cerca indirizzo...' }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=6&countrycodes=it&addressdetails=1&dedupe=1&viewbox=${MODENA_VIEWBOX}&bounded=0`,
          { headers: { 'Accept-Language': 'it' } },
        );
        const data = (await response.json()) as GeoResult[];
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const selectResult = (result: GeoResult) => {
    const cleanAddress = compactAddress(result);
    setQuery(cleanAddress);
    setOpen(false);
    onSelect(cleanAddress, { lat: Number(result.lat), lng: Number(result.lon) }, getAddressDetails(result));
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border px-10 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-[#e74c3c]"
        />
        {loading && <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#e74c3c] border-t-transparent" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-lg border bg-white shadow-xl">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => selectResult(result)}
              className="block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50"
            >
              {compactAddress(result)}
              <span className="mt-1 block text-xs text-gray-500">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
