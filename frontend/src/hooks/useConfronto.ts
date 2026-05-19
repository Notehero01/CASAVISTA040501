import { useState, useEffect, useCallback } from 'react';
import type { Annuncio } from '@/types/annuncio';

const STORAGE_KEY = 'casavista_confronto';
const MAX_CONFRONTO = 4; // Massimo 4 annunci da confrontare

export function useConfronto() {
  const [confrontoIds, setConfrontoIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica dal localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfrontoIds(JSON.parse(stored));
      } catch (e) {
        console.error('Errore caricamento confronto:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva nel localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(confrontoIds));
    }
  }, [confrontoIds, isLoaded]);

  const aggiungiAlConfronto = useCallback((annuncioId: string): boolean => {
    let success = false;
    setConfrontoIds(prev => {
      if (prev.includes(annuncioId)) {
        success = true;
        return prev;
      }
      if (prev.length >= MAX_CONFRONTO) {
        success = false;
        return prev;
      }
      success = true;
      return [...prev, annuncioId];
    });
    return success;
  }, []);

  const rimuoviDalConfronto = useCallback((annuncioId: string) => {
    setConfrontoIds(prev => prev.filter(id => id !== annuncioId));
  }, []);

  const toggleConfronto = useCallback((annuncioId: string): { added: boolean; message?: string } => {
    let result = { added: false, message: '' };
    
    setConfrontoIds(prev => {
      if (prev.includes(annuncioId)) {
        result = { added: false, message: 'Rimosso dal confronto' };
        return prev.filter(id => id !== annuncioId);
      }
      if (prev.length >= MAX_CONFRONTO) {
        result = { added: false, message: `Puoi confrontare massimo ${MAX_CONFRONTO} annunci` };
        return prev;
      }
      result = { added: true, message: 'Aggiunto al confronto' };
      return [...prev, annuncioId];
    });
    
    return result;
  }, []);

  const isNelConfronto = useCallback((annuncioId: string) => {
    return confrontoIds.includes(annuncioId);
  }, [confrontoIds]);

  const clearConfronto = useCallback(() => {
    setConfrontoIds([]);
  }, []);

  const canAddMore = confrontoIds.length < MAX_CONFRONTO;

  return {
    confrontoIds,
    confrontoCount: confrontoIds.length,
    maxConfronto: MAX_CONFRONTO,
    aggiungiAlConfronto,
    rimuoviDalConfronto,
    toggleConfronto,
    isNelConfronto,
    clearConfronto,
    canAddMore,
    isLoaded,
  };
}
