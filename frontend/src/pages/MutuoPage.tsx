import { useState, useEffect } from 'react';
import { Calculator, Euro, Percent, Calendar, Info, Banknote, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface MutuoResult {
  rataMensile: number;
  importoTotale: number;
  interessiTotali: number;
}

const DURATE = [10, 15, 20, 25, 30];

export function MutuoPage() {
  const [importo, setImporto] = useState(200000);
  const [capitale, setCapitale] = useState(20000);
  const [durata, setDurata] = useState(25);
  const [tasso, setTasso] = useState(3.5);
  const [risultato, setRisultato] = useState<MutuoResult | null>(null);

  useEffect(() => {
    calcola();
  }, [importo, capitale, durata, tasso]);

  const calcola = () => {
    const capitaleFinanziato = importo - capitale;
    const tassoMensile = tasso / 100 / 12;
    const numeroRate = durata * 12;

    if (capitaleFinanziato <= 0) return;

    const rata = capitaleFinanziato * (tassoMensile * Math.pow(1 + tassoMensile, numeroRate)) / (Math.pow(1 + tassoMensile, numeroRate) - 1);
    const totale = rata * numeroRate;

    setRisultato({
      rataMensile: rata,
      importoTotale: totale,
      interessiTotali: totale - capitaleFinanziato
    });
  };

  const ltv = ((importo - capitale) / importo) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e74c3c]/10 rounded-full mb-4">
            <Calculator className="h-8 w-8 text-[#e74c3c]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Calcola il tuo mutuo</h1>
          <p className="text-gray-600">Pianifica il tuo investimento immobiliare</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-[#e74c3c]" />Dati del mutuo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="flex justify-between">
                    <span>Valore immobile</span>
                    <span className="text-[#e74c3c] font-semibold">€ {importo.toLocaleString()}</span>
                  </Label>
                  <Slider value={[importo]} onValueChange={(v) => setImporto(v[0])} max={1000000} step={10000} className="mt-3" />
                </div>

                <div>
                  <Label className="flex justify-between">
                    <span>Capitale iniziale</span>
                    <span className="text-green-600 font-semibold">€ {capitale.toLocaleString()}</span>
                  </Label>
                  <Slider value={[capitale]} onValueChange={(v) => setCapitale(v[0])} max={importo} step={5000} className="mt-3" />
                  <p className="text-xs text-gray-500 mt-1">LTV: {ltv.toFixed(1)}%</p>
                </div>

                <div>
                  <Label className="flex justify-between">
                    <span>Tasso di interesse</span>
                    <span className="text-[#e74c3c] font-semibold">{tasso}%</span>
                  </Label>
                  <Slider value={[tasso]} onValueChange={(v) => setTasso(v[0])} min={0.5} max={10} step={0.1} className="mt-3" />
                </div>

                <div>
                  <Label>Durata del mutuo</Label>
                  <div className="flex gap-2 mt-2">
                    {DURATE.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDurata(d)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${durata === d ? 'bg-[#e74c3c] text-white' : 'bg-gray-100'}`}
                      >
                        {d} anni
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-[#e74c3c]/20">
                <CardHeader className="bg-gradient-to-r from-[#e74c3c]/5 to-transparent">
                  <CardTitle>Riepilogo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {risultato ? (
                    <>
                      <div className="text-center py-4 bg-gradient-to-br from-[#e74c3c]/10 to-[#e74c3c]/5 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Rata mensile</p>
                        <p className="text-3xl font-bold text-[#e74c3c]">€ {Math.round(risultato.rataMensile).toLocaleString()}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Importo finanziato</span>
                          <span className="font-medium">€ {(importo - capitale).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Durata</span>
                          <span className="font-medium">{durata} anni</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Interessi totali</span>
                          <span className="font-medium text-[#e74c3c]">€ {Math.round(risultato.interessiTotali).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-800">
                          Calcolo indicativo. Per un preventivo preciso, contatta una banca.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Inserisci i dati per vedere la rata</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">LTV</span>
                    <Badge variant={ltv > 80 ? 'destructive' : ltv > 60 ? 'default' : 'secondary'}>
                      {ltv.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
