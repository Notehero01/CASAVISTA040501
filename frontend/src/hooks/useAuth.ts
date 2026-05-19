import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/utils/api';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  telefono?: string;
  tipo: 'utente' | 'admin' | 'amministrazione';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true
  });

  // Verifica sessione all'avvio
  useEffect(() => {
    const token = localStorage.getItem('casavista_token');
    if (token) {
      authApi.me()
        .then(data => {
          setState({
            user: data.user,
            isAuthenticated: true,
            isAdmin: data.user.tipo === 'admin',
            loading: false
          });
        })
        .catch(() => {
          localStorage.removeItem('casavista_token');
          setState({ user: null, isAuthenticated: false, isAdmin: false, loading: false });
        });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('casavista_token', data.token);
      setState({
        user: data.user,
        isAuthenticated: true,
        isAdmin: data.user.tipo === 'admin',
        loading: false
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Login fallito');
    }
  }, []);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    telefono?: string;
    tipo?: 'utente' | 'amministrazione';
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('casavista_token', data.token);
      setState({
        user: data.user,
        isAuthenticated: true,
        isAdmin: false,
        loading: false
      });
      return { success: true, message: 'Registrazione completata!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Registrazione fallita' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('casavista_token');
    setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false
    });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const result = await authApi.updateProfile(data);
      setState(prev => ({
        ...prev,
        user: result.user
      }));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    loading: state.loading,
    login,
    register,
    logout,
    updateProfile
  };
}
