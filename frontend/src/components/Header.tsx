import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, Menu, X, Plus, Search, Home, Phone, Calculator, 
  BarChart3, Building, LogIn, User as UserIcon, MessageCircle, LogOut,
  Heart, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePreferiti } from '@/hooks/usePreferiti';
import { useConfronto } from '@/hooks/useConfronto';
import type { User } from '@/hooks/useAuth';

interface HeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  unreadMessages: number;
  onLogout: () => void;
}

export function Header({ user, isAuthenticated, isAdmin, unreadMessages, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { preferitiCount } = usePreferiti();
  const { confrontoCount, maxConfronto } = useConfronto();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/cerca', label: 'Cerca', icon: Search },
    { to: '/valutazione', label: 'Valuta', icon: BarChart3 },
    { to: '/mutuo', label: 'Mutuo', icon: Calculator },
    { to: '/amministrazioni', label: 'Amministrazioni', icon: Building },
    { to: '/pubblica', label: 'Pubblica', icon: Plus },
    { to: '/contatti', label: 'Contatti', icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-[#e74c3c] p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">CasaVista</span>
              <span className="text-[10px] text-[#e74c3c] font-medium -mt-0.5">100% Gratuito</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-[#e74c3c]/10 text-[#e74c3c]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Preferiti - sempre visibile */}
            <Link to="/preferiti">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {preferitiCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {preferitiCount > 9 ? '9+' : preferitiCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Confronto - sempre visibile */}
            <Link to="/confronto">
              <Button variant="ghost" size="icon" className="relative">
                <Scale className="h-5 w-5" />
                {confrontoCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {confrontoCount}
                  </span>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Messages */}
                <Link to="/messaggi">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <div className="w-6 h-6 bg-[#e74c3c] rounded-full flex items-center justify-center">
                        <UserIcon className="h-3 w-3 text-white" />
                      </div>
                      <span className="max-w-[100px] truncate">{user?.nome}</span>
                      {isAdmin && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          Admin
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user?.nome} {user?.cognome}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Esci
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Phone className="h-4 w-4" />
                      Contattaci
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contatta CasaVista</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#e74c3c]/10 p-3 rounded-full">
                          <Phone className="h-5 w-5 text-[#e74c3c]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Telefono</p>
                          <p className="font-medium">+39 055 1234567</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link to="/login">
                  <Button variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Accedi
                  </Button>
                </Link>
                <Link to="/registrazione">
                  <Button className="bg-[#e74c3c] hover:bg-[#c0392b] gap-2">
                    <UserIcon className="h-4 w-4" />
                    Registrati
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive(link.to) ? 'bg-[#e74c3c]/10 text-[#e74c3c]' : 'text-gray-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 mt-2 space-y-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Accedi</Button>
                  </Link>
                  <Link to="/registrazione" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#e74c3c]">Registrati gratis</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
