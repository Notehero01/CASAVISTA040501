import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calculator,
  CheckCircle2,
  Database,
  Home,
  Info,
  Loader2,
  MapPin,
  Maximize,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORIE, STATI_IMMOBILE } from '@/types/annuncio';
import { valutazioniApi } from '@/utils/api';

interface ValutazioneZone {
  id: string;
  label: string;
  zoneCode: string;
  isFallback?: boolean;
}

interface ValutazioneResult {
  citta: string;
  provincia: string;
  categoriaLabel: string;
  superficie: number;
  zona: ValutazioneZone;
  quotazioneBase: {
    minMq: number;
    maxMq: number;
    avgMq: number;
  };
  stima: {
    valoreMin: number;
    valoreMax: number;
    valoreMedio: number;
    prezzoMqMin: number;
    prezzoMqMax: number;
    prezzoMqMedio: number;
  };
  confidence: string;
  factors: Array<{
    key: string;
    label: string;
    impact: string;
  }>;
  source: {
    name: string;
    url: string;
    semester: string;
    isOfficialImport: boolean;
    note: string;
  };
  disclaimer: string;
}

const PIANI = [
  { value: 'seminterrato', label: 'Seminterrato' },
  { value: 'terra', label: 'Piano terra' },
  { value: 'intermedio', label: 'Piano intermedio' },
  { value: 'alto', label: 'Piano alto' },
  { value: 'attico', label: 'Attico / ultimo piano' }
];

const PERTINENZE = [
  { value: 'balcone', label: 'Balcone / terrazzo' },
  { value: 'garage', label: 'Garage / posto auto' },
  { value: 'giardino', label: 'Giardino' },
  { value: 'cantina', label: 'Cantina' }
];

const formatEuro = (value: number) =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(value);

export function ValutazionePage() {
  const [citta, setCitta] = useState('Modena');
  const [zones, setZones] = useState<ValutazioneZone[]>([]);
  const [zonaId, setZonaId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [stato, setStato] = useState('buono');
  const [piano, setPiano] = useState('intermedio');
  const [ascensore, setAscensore] = useState(false);
  const [pertinenze, setPertinenze] = useState<string[]>([]);
  const [risultato, setRisultato] = useState<ValutazioneResult | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ValutazioneResult['source'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoneLoading, setZoneLoading] = useState(false);
  const [error, setError] = useState('');

  const canCalculate = useMemo(() => {
    return Boolean(citta.trim() && zonaId && categoria && Number(superficie) > 0 && !loading);
  }, [citta, zonaId, categoria, superficie, loading]);

  useEffect(() => {
    let active = true;
    const city = citta.trim();

    if (!city) {
      setZones([]);
      setZonaId('');
      return;
    }

    setZoneLoading(true);
    valutazioniApi
      .getZone(city)
      .then((data) => {
        if (!active) return;
        setZones(data.zones || []);
        setZonaId((current) => {
          const nextZones: ValutazioneZone[] = data.zones || [];
          const currentStillValid = nextZones.some((zone) => zone.id === current);
          return currentStillValid ? current : data.defaultZoneId || nextZones[0]?.id || '';
        });
        setSourceInfo(data.source || null);
      })
      .catch(() => {
        if (!active) return;
        setZones([]);
        setZonaId('');
        setSourceInfo(null);
      })
      .finally(() => {
        if (active) setZoneLoading(false);
      });

    return () => {
      active = false;
    };
  }, [citta]);

  const togglePertinenza = (value: string) => {
    setPertinenze((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const calcola = async () => {
    if (!canCalculate) return;

    setLoading(true);
    setError('');

    try {
      const data = await valutazioniApi.stima({
        citta,
        zonaId,
        categoria,
        superficie: Number(superficie),
        stato,
        piano,
        ascensore,
        pertinenze
      });
      setRisultato(data);
    } catch (err) {
      setRisultato(null);
      setError(err instanceof Error ? err.message : 'Errore durante la valutazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#e74c3c]/10">
              <Calculator className="h-6 w-6 text-[#e74c3c]" />
            </div>
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Valuta il tuo immobile</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Stima indicativa con zone di mercato per Modena, pronta per essere alimentata dai dati OMI.
            </p>
          </div>

          {sourceInfo && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Database className="h-4 w-4 text-[#e74c3c]" />
                {sourceInfo.isOfficialImport ? 'Dati OMI importati' : 'Dataset iniziale'}
              </div>
              <p className="mt-1">{sourceInfo.semester}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Home className="h-5 w-5 text-[#e74c3c]" />
                Dati dell'immobile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Citta *</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={citta}
                      onChange={(event) => setCitta(event.target.value)}
                      className="pl-10"
                      placeholder="Modena"
                    />
                  </div>
                </div>

                <div>
                  <Label>Zona *</Label>
                  <select
                    value={zonaId}
                    onChange={(event) => setZonaId(event.target.value)}
                    disabled={zoneLoading || zones.length === 0}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {zoneLoading && <option>Caricamento zone...</option>}
                    {!zoneLoading && zones.length === 0 && <option>Nessuna zona disponibile</option>}
                    {!zoneLoading &&
                      zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Tipologia *</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORIE.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategoria(cat.value)}
                      className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        categoria === cat.value
                          ? 'border-[#e74c3c] bg-[#e74c3c]/5 text-[#e74c3c]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label>Superficie *</Label>
                  <div className="relative mt-2">
                    <Maximize className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min="10"
                      value={superficie}
                      onChange={(event) => setSuperficie(event.target.value)}
                      className="pl-10"
                      placeholder="mq"
                    />
                  </div>
                </div>

                <div>
                  <Label>Stato</Label>
                  <select
                    value={stato}
                    onChange={(event) => setStato(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {STATI_IMMOBILE.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Piano</Label>
                  <select
                    value={piano}
                    onChange={(event) => setPiano(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PIANI.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Caratteristiche rilevanti</Label>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex min-h-[42px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={ascensore}
                      onChange={(event) => setAscensore(event.target.checked)}
                      className="h-4 w-4 accent-[#e74c3c]"
                    />
                    Ascensore
                  </label>
                  {PERTINENZE.map((item) => (
                    <label
                      key={item.value}
                      className="flex min-h-[42px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={pertinenze.includes(item.value)}
                        onChange={() => togglePertinenza(item.value)}
                        className="h-4 w-4 accent-[#e74c3c]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button onClick={calcola} disabled={!canCalculate} className="w-full bg-[#e74c3c] hover:bg-[#d84332]">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Calcola stima
              </Button>
            </CardContent>
          </Card>

          <div>
            {risultato ? (
              <Card className="border-[#e74c3c]/20">
                <CardHeader className="border-b bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Stima completata
                    </CardTitle>
                    <Badge className="bg-slate-900 text-white hover:bg-slate-900">
                      Attendibilita {risultato.confidence}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="rounded-lg bg-[#e74c3c]/10 p-5 text-center">
                    <p className="text-sm font-medium text-slate-600">Valore stimato</p>
                    <p className="mt-2 text-3xl font-bold text-[#e74c3c] sm:text-4xl">
                      {formatEuro(risultato.stima.valoreMedio)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Range {formatEuro(risultato.stima.valoreMin)} - {formatEuro(risultato.stima.valoreMax)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase text-slate-500">Prezzo mq</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {formatEuro(risultato.stima.prezzoMqMedio)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase text-slate-500">Base zona</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {formatNumber(risultato.quotazioneBase.minMq)} - {formatNumber(risultato.quotazioneBase.maxMq)} EUR/mq
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-slate-500">Zona</span>
                      <span className="text-right font-medium text-slate-950">{risultato.zona.label}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-slate-500">Tipologia</span>
                      <span className="text-right font-medium text-slate-950">{risultato.categoriaLabel}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <span className="text-slate-500">Superficie</span>
                      <span className="text-right font-medium text-slate-950">{risultato.superficie} mq</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Building2 className="h-4 w-4 text-[#e74c3c]" />
                      Fattori applicati
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {risultato.factors.map((factor) => (
                        <Badge key={factor.key} variant="secondary" className="rounded-md">
                          {factor.label} {factor.impact}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-3">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-900">
                        <p>{risultato.disclaimer}</p>
                        <p className="mt-2">
                          Fonte: {risultato.source.name}.{' '}
                          {!risultato.source.isOfficialImport &&
                            'Dati iniziali pronti per sostituzione con fornitura ufficiale OMI.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex min-h-[520px] items-center justify-center">
                <CardContent className="px-6 py-12 text-center">
                  <Calculator className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <p className="font-medium text-slate-700">Inserisci i dati per ottenere una stima</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    La stima usa range al mq, zona, stato dell'immobile e caratteristiche principali.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
