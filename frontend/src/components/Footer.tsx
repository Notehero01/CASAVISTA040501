import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-[#e74c3c] p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">CasaVista</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Il portale immobiliare 100% gratuito. Pubblica annunci senza limiti.
            </p>
            <div className="flex gap-3">
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-[#e74c3c] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-[#e74c3c] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-[#e74c3c] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
              <li><Link to="/cerca" className="text-gray-400 hover:text-white text-sm">Cerca Annunci</Link></li>
              <li><Link to="/pubblica" className="text-gray-400 hover:text-white text-sm">Pubblica Annuncio</Link></li>
              <li><Link to="/contatti" className="text-gray-400 hover:text-white text-sm">Contatti</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Servizi</h3>
            <ul className="space-y-2">
              <li><Link to="/valutazione" className="text-gray-400 hover:text-white text-sm">Valuta Immobile</Link></li>
              <li><Link to="/mutuo" className="text-gray-400 hover:text-white text-sm">Calcola Mutuo</Link></li>
              <li><Link to="/amministrazioni" className="text-gray-400 hover:text-white text-sm">Amministrazioni</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Legale</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
              <li><Link to="/termini" className="text-gray-400 hover:text-white text-sm">Termini di servizio</Link></li>
              <li><Link to="/cookie" className="text-gray-400 hover:text-white text-sm">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contatti</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#e74c3c] flex-shrink-0" />
                <span className="text-gray-400 text-sm">Modena, Italia</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#e74c3c] flex-shrink-0" />
                <span className="text-gray-400 text-sm">info@casavista.it</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CasaVista. Tutti i diritti riservati. 100% Gratuito.
          </p>
        </div>
      </div>
    </footer>
  );
}
