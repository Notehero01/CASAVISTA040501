export interface Annuncio {
  id: string;
  titolo: string;
  descrizione: string;
  prezzo: number;
  tipo: 'vendita' | 'affitto';
  categoria: 'appartamento' | 'casa' | 'villa' | 'ufficio' | 'negozio' | 'terreno';
  superficie: number;
  locali: number;
  camere: number;
  bagni: number;
  piano?: number;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  // Coordinate per mappa
  coordinate?: {
    lat: number;
    lng: number;
  };
  immagini: string[];
  caratteristiche: string[];
  riscaldamento?: 'autonomo' | 'centralizzato' | 'pompa_di_calore' | 'nessuno';
  stato?: 'nuovo' | 'ristrutturato' | 'buono' | 'da_ristrutturare';
  classe_energetica?: 'A4' | 'A3' | 'A2' | 'A1' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  anno_costruzione?: number;
  nome_contatto: string;
  telefono_contatto: string;
  email_contatto?: string;
  userId: string;
  moderationStatus?: 'pending' | 'published' | 'hidden' | 'rejected' | 'deleted';
  reviewRequestedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  hiddenAt?: string;
  rejectedAt?: string;
  visualizzazioni: number;
  createdAt: string;
  updatedAt: string;
  // SEO
  slug?: string;
  metaDescription?: string;
  // Evidenza
  inEvidenza?: boolean;
  dataEvidenza?: string;
}

export interface FiltriRicerca {
  tipo?: 'vendita' | 'affitto' | 'tutti';
  categoria?: string;
  prezzoMin?: number;
  prezzoMax?: number;
  superficieMin?: number;
  superficieMax?: number;
  localiMin?: number;
  localiMax?: number;
  citta?: string;
  camereMin?: number;
  bagniMin?: number;
  // Filtri avanzati
  stato?: string;
  classeEnergetica?: string;
  riscaldamento?: string;
  annoCostruzioneMin?: number;
  annoCostruzioneMax?: number;
  piano?: number;
  caratteristiche?: string[];
  // Ricerca per raggio
  lat?: number;
  lng?: number;
  raggioKm?: number;
}

export const CATEGORIE = [
  { value: 'appartamento', label: 'Appartamento', icon: 'Building2' },
  { value: 'casa', label: 'Casa', icon: 'Home' },
  { value: 'villa', label: 'Villa', icon: 'Castle' },
  { value: 'ufficio', label: 'Ufficio', icon: 'Briefcase' },
  { value: 'negozio', label: 'Negozio', icon: 'Store' },
  { value: 'terreno', label: 'Terreno', icon: 'Trees' },
] as const;

export const CARATTERISTICHE = [
  'Posto auto',
  'Giardino',
  'Balcone',
  'Ascensore',
  'Arredato',
  'Climatizzazione',
  'Riscaldamento autonomo',
  'Vista mare',
  'Vista montagna',
  'Piscina',
  'Terrazzo',
  'Cantina',
  'Soffitta',
  'Camino',
  'Allarme',
  'Porta blindata',
  'Videocitofono',
  'Fibra ottica',
  'Pannelli solari',
  'Impianto fotovoltaico',
] as const;

export const CLASSI_ENERGETICHE = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export const STATI_IMMOBILE = [
  { value: 'nuovo', label: 'Nuovo / In costruzione' },
  { value: 'ristrutturato', label: 'Ristrutturato' },
  { value: 'buono', label: 'Buono stato' },
  { value: 'da_ristrutturare', label: 'Da ristrutturare' },
] as const;

export const RISCALDAMENTO = [
  { value: 'autonomo', label: 'Autonomo' },
  { value: 'centralizzato', label: 'Centralizzato' },
  { value: 'pompa_di_calore', label: 'Pompa di calore' },
  { value: 'nessuno', label: 'Nessuno' },
] as const;
