import { useState } from 'react';
import { Calculator, MapPin, Home, Maximize, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORIE, STATI_IMMOBILE } from '@/types/annuncio';

const PREZZI_MEDIO: Record<string, Record<string, number>> = {
  'Firenze': { appartamento: 4200, casa: 3800, villa: 5500, ufficio: 3200, negozio: 4500, terreno: 800 },
  'Milano': { appartamento: 5800, casa: 5200, villa: 7500, ufficio: 4800, negozio: 6200, terreno: 1200 },
  'Roma': { appartamento: 5100, casa: 4600, villa: 6800, ufficio: 4200, negozio: 5500, terreno: 1000 },
  'Napoli': { appartamento: 2800, casa: 2500, villa: 3800, ufficio: 2200, negozio: 3200, terreno: 600 },
  'Torino': { appartamento: 2400, casa: 2100, villa: 3200, ufficio: 1900, negozio: 2800, terreno: 500 },
  'Bologna': { appartamento: 3600, casa: 3200, villa: 4800, ufficio: 2900, negozio: 4000, terreno: 750 },
  'default': { appartamento: 2500, casa: 2200, villa: 3500, ufficio: 2000, negozio: 2800, terreno: 500 },
};

const FATTORI_STATO: Record<string, number> = {
  nuovo: 1.15, ristrutturato: 1.08, buono: 1.0, da_ristrutturare: 0.75
};

export function ValutazionePage() {
  const [citta, setCitta] = useState('');
  const [categoria, setCategoria] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [stato, setStato] = useState('');
  const [risultato, setRisultato] = useState<any>(null);

  const calcola = () => {
    if (!citta || !categoria || !superficie) return;
    
    const cittaData = PREZZI_MEDIO[citta] || PREZZI_MEDIO.default;
    const prezzoBase = cittaData[categoria] || PREZZI_MEDIO.default[categoria];
    let fattore = stato ? FATTORI_STATO[stato] : 1;
    
    const prezzoMq = Math.round(prezzoBase * fattore);
    const valore = prezzoMq * parseFloat(superficie);
    
    setRisultato({
      valoreMin: Math.round(valore * 0.9),
      valoreMax: Math.round(valore * 1.1),
      valoreMedio: Math.round(valore),
      prezzoMq
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e74c3c]/10 rounded-full mb-4">
            <Calculator className="h-8 w-8 text-[#e74c3c]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Valuta il tuo immobile</h1>
          <p className="text-gray-600">Scopri il valore di mercato in pochi click</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-[#e74c3c]" />Dati dell'immobile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Città *</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input value={citta} onChange={(e) => setCitta(e.target.value)} className="pl-10" placeholder="Es: Firenze" />
                </div>
              </div>

              <div>
                <Label>Tipologia *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CATEGORIE.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategoria(cat.value)}
                      className={`p-3 rounded-lg border text-sm ${categoria === cat.value ? 'border-[#e74c3c] bg-[#e74c3c]/5 text-[#e74c3c]' : 'border-gray-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Superficie (m²) *</Label>
                <div className="relative mt-2">
                  <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="number" value={superficie} onChange={(e) => setSuperficie(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div>
                <Label>Stato immobile</Label>
                <select value={stato} onChange={(e) => setStato(e.target.value)} className="w-full mt-2 px-3 py-2 border rounded-lg">
                  <option value="">Seleziona...</option>
                  {STATI_IMMOBILE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <Button onClick={calcola} disabled={!citta || !categoria || !superficie} className="w-full bg-[#e74c3c]">
                <TrendingUp className="h-4 w-4 mr-2" />Calcola valore
              </Button>
            </CardContent>
          </Card>

          <div>
            {risultato ? (
              <Card className="border-[#e74c3c]/20">
                <CardHeader className="bg-gradient-to-r from-[#e74c3c]/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />Valutazione completata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-br from-[#e74c3c]/10 to-[#e74c3c]/5 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Valore stimato</p>
                    <p className="text-4xl font-bold text-[#e74c3c]">€ {risultato.valoreMedio.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Range: € {risultato.valoreMin.toLocaleString()} - € {risultato.valoreMax.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Prezzo al m²</span>
                      <span className="font-medium">€ {risultato.prezzoMq.toLocaleString()}/m²</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Superficie</span>
                      <span className="font-medium">{superficie} m²</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Questa valutazione è indicativa. Per una stima precisa, contatta un agente immobiliare.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Inserisci i dati per ottenere una stima</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
