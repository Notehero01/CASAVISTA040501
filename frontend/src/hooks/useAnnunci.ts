import { useState, useEffect, useCallback } from 'react';
import { annunciApi } from '@/utils/api';
import type { Annuncio, FiltriRicerca } from '@/types/annuncio';

export function useAnnunci() {
  const [annunci, setAnnunci] = useState<Annuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });

  const fetchAnnunci = useCallback(async (filtri?: FiltriRicerca & { page?: number; limit?: number }) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtri?.tipo && filtri.tipo !== 'tutti') params.tipo = filtri.tipo;
      if (filtri?.categoria) params.categoria = filtri.categoria;
      if (filtri?.citta) params.citta = filtri.citta;
      if (filtri?.prezzoMin) params.prezzoMin = filtri.prezzoMin.toString();
      if (filtri?.prezzoMax) params.prezzoMax = filtri.prezzoMax.toString();
      if (filtri?.superficieMin) params.superficieMin = filtri.superficieMin.toString();
      if (filtri?.superficieMax) params.superficieMax = filtri.superficieMax.toString();
      if (filtri?.localiMin) params.localiMin = filtri.localiMin.toString();
      if (filtri?.camereMin) params.camereMin = filtri.camereMin.toString();
      if (filtri?.page) params.page = filtri.page.toString();
      if (filtri?.limit) params.limit = filtri.limit.toString();

      const data = await annunciApi.getAll(params);
      setAnnunci(data.annunci);
      setPagination({
        total: data.total,
        page: data.page,
        pages: data.pages
      });
    } catch (error) {
      console.error('Error fetching annunci:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnnuncioById = useCallback(async (id: string): Promise<Annuncio | undefined> => {
    try {
      return await annunciApi.getById(id);
    } catch (error) {
      console.error('Error fetching annuncio:', error);
      return undefined;
    }
  }, []);

  const aggiungiAnnuncio = useCallback(async (annuncio: Omit<Annuncio, 'id' | 'createdAt' | 'updatedAt' | 'visualizzazioni'>): Promise<Annuncio | null> => {
    try {
      const data = await annunciApi.create(annuncio);
      return data.annuncio;
    } catch (error: any) {
      throw new Error(error.message || 'Errore nella creazione dell\'annuncio');
    }
  }, []);

  const eliminaAnnuncio = useCallback(async (id: string): Promise<boolean> => {
    try {
      await annunciApi.delete(id);
      setAnnunci(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const getAnnunciInEvidenza = useCallback(async (limit: number = 6): Promise<Annuncio[]> => {
    try {
      return await annunciApi.getFeatured();
    } catch (error) {
      return [];
    }
  }, []);

  const getAnnunciRecenti = useCallback(async (limit: number = 6): Promise<Annuncio[]> => {
    try {
      return await annunciApi.getRecent();
    } catch (error) {
      return [];
    }
  }, []);

  return {
    annunci,
    loading,
    pagination,
    fetchAnnunci,
    getAnnuncioById,
    aggiungiAnnuncio,
    eliminaAnnuncio,
    getAnnunciInEvidenza,
    getAnnunciRecenti
  };
}
