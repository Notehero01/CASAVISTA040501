import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, Home, Castle, Briefcase, Store, Trees, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { annunciApi } from '@/utils/api';
import type { Annuncio } from '@/types/annuncio';

const categorie = [
  { value: 'appartamento', label: 'Appartamento', icon: Building2 },
  { value: 'casa', label: 'Casa', icon: Home },
  { value: 'villa', label: 'Villa', icon: Castle },
  { value: 'ufficio', label: 'Ufficio', icon: Briefcase },
  { value: 'negozio', label: 'Negozio', icon: Store },
  { value: 'terreno', label: 'Terreno', icon: Trees },
];

export function HomePage() {
  const [featured, setFeatured] = useState<Annuncio[]>([]);
  const [recent, setRecent] = useState<Annuncio[]>([]);
  const [citta, setCitta] = useState('');

  useEffect(() => {
    annunciApi.getFeatured().then(setFeatured);
    annunciApi.getRecent().then(setRecent);
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-32">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#e74c3c]/20 text-[#e74c3c] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#e74c3c] rounded-full animate-pulse"></span>
              100% Gratuito - Pubblica e cerca senza costi
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Trova la casa dei tuoi <span className="text-[#e74c3c]">sogni</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10">
              Il portale immobiliare completamente gratuito. <span className="text-[#e74c3c] font-semibold">Zero commissioni, zero costi nascosti.</span>
            </p>

            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input placeholder="Inserisci città" value={citta} onChange={(e) => setCitta(e.target.value)} className="pl-10 h-12 text-gray-900" />
                </div>
                <Link to={`/cerca?citta=${citta}`}>
                  <Button className="h-12 px-8 bg-[#e74c3c] hover:bg-[#c0392b]">
                    <Search className="h-5 w-5 mr-2" />Cerca
                  </Button>
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Categorie:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categorie.map((cat) => (
                    <Link key={cat.value} to={`/cerca?categoria=${cat.value}`} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-[#e74c3c] hover:text-white transition-colors">
                      <cat.icon className="h-4 w-4" />{cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-6 w-6 text-[#e74c3c]" />
            <h2 className="text-2xl font-bold">In Evidenza</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((a) => (
              <Link key={a.id} to={`/annuncio/${a.id}`} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] relative">
                  <img src={a.immagini[0] || 'https://via.placeholder.com/400x300'} alt={a.titolo} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white ${a.tipo === 'vendita' ? 'bg-[#e74c3c]' : 'bg-blue-600'}`}>
                    {a.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{a.titolo}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{a.citta}</p>
                  <p className="text-xl font-bold text-[#e74c3c] mt-2">€ {a.prezzo.toLocaleString()}{a.tipo === 'affitto' && '/mese'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Nuovi Arrivi</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((a) => (
              <Link key={a.id} to={`/annuncio/${a.id}`} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] relative">
                  <img src={a.immagini[0] || 'https://via.placeholder.com/400x300'} alt={a.titolo} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{a.titolo}</h3>
                  <p className="text-gray-500 text-sm mt-1">{a.citta}</p>
                  <p className="text-xl font-bold text-[#e74c3c] mt-2">€ {a.prezzo.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
