import { useState, useEffect, useCallback } from 'react';
import type { Annuncio } from '@/types/annuncio';

const STORAGE_KEY = 'casavista_preferiti';

export function usePreferiti() {
  const [preferiti, setPreferiti] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica preferiti dal localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferiti(JSON.parse(stored));
      } catch (e) {
        console.error('Errore caricamento preferiti:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva preferiti nel localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
    }
  }, [preferiti, isLoaded]);

  const aggiungiPreferito = useCallback((annuncioId: string) => {
    setPreferiti(prev => {
      if (prev.includes(annuncioId)) return prev;
      return [...prev, annuncioId];
    });
  }, []);

  const rimuoviPreferito = useCallback((annuncioId: string) => {
    setPreferiti(prev => prev.filter(id => id !== annuncioId));
  }, []);

  const togglePreferito = useCallback((annuncioId: string) => {
    setPreferiti(prev => {
      if (prev.includes(annuncioId)) {
        return prev.filter(id => id !== annuncioId);
      }
      return [...prev, annuncioId];
    });
  }, []);

  const isPreferito = useCallback((annuncioId: string) => {
    return preferiti.includes(annuncioId);
  }, [preferiti]);

  const clearPreferiti = useCallback(() => {
    setPreferiti([]);
  }, []);

  return {
    preferiti,
    preferitiCount: preferiti.length,
    aggiungiPreferito,
    rimuoviPreferito,
    togglePreferito,
    isPreferito,
    clearPreferiti,
    isLoaded,
  };
}
