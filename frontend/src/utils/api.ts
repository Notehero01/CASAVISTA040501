const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (auth) {
    const token = localStorage.getItem('casavista_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Errore del server' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api<{ token: string; user: any }>('/auth/login', { 
      method: 'POST', 
      body: { email, password },
      auth: false 
    }),
  
  register: (data: any) => 
    api<{ token: string; user: any }>('/auth/register', { 
      method: 'POST', 
      body: data,
      auth: false 
    }),

  forgotPassword: (email: string) =>
    api<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false
    }),

  resetPassword: (token: string, password: string) =>
    api<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      auth: false
    }),
  
  me: () => api<{ user: any }>('/auth/me'),
  
  updateProfile: (data: any) => 
    api<{ user: any }>('/auth/profile', { method: 'PUT', body: data })
};

// Annunci API
export const annunciApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ annunci: any[]; total: number; page: number; pages: number }>(`/annunci${query}`);
  },
  
  getById: (id: string) => api<any>(`/annunci/${id}`),
  
  create: (data: any) => api<any>('/annunci', { method: 'POST', body: data }),
  
  update: (id: string, data: any) => api<any>(`/annunci/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) => api(`/annunci/${id}`, { method: 'DELETE' }),
  
  getFeatured: () => api<any[]>('/annunci/featured/list'),
  
  getRecent: () => api<any[]>('/annunci/recent/list'),
  
  incrementViews: (id: string) => api(`/annunci/${id}/views`, { method: 'POST', auth: false })
};

// Chat API
export const chatApi = {
  getConversations: () => api<any[]>('/chat/conversations'),
  
  createConversation: (data: { otherUserId: string; annuncioId?: string; annuncioTitle?: string }) => 
    api<any>('/chat/conversations', { method: 'POST', body: data }),
  
  getMessages: (conversationId: string) => api<any[]>(`/chat/conversations/${conversationId}/messages`),
  
  sendMessage: (conversationId: string, content: string) => 
    api<any>(`/chat/conversations/${conversationId}/messages`, { method: 'POST', body: { content } }),
  
  deleteConversation: (id: string) => api(`/chat/conversations/${id}`, { method: 'DELETE' }),
  
  getUnreadCount: () => api<{ unreadCount: number }>('/chat/unread')
};

// Amministrazioni API
export const amministrazioniApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any[]>(`/amministrazioni${query}`);
  },
  
  getById: (id: string) => api<any>(`/amministrazioni/${id}`),
  
  updateProfile: (data: any) => api('/amministrazioni/profile', { method: 'POST', body: data })
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('casavista_token');
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const token = localStorage.getItem('casavista_token');
    const response = await fetch(`${API_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
};

// Admin API
export const adminApi = {
  getSummary: () => api<any>('/admin/summary'),

  getUsers: () => api<any[]>('/admin/users'),

  setUserBlocked: (id: string, blocked: boolean) =>
    api<any>(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: { blocked }
    }),

  setUserVerified: (id: string, verified: boolean) =>
    api<any>(`/admin/users/${id}/verify`, {
      method: 'PUT',
      body: { verified }
    }),

  getAnnunci: () => api<any[]>('/admin/annunci'),

  setAnnuncioStatus: (id: string, status: 'published' | 'hidden') =>
    api<any>(`/admin/annunci/${id}/status`, {
      method: 'PUT',
      body: { status }
    }),

  deleteAnnuncio: (id: string) => api<any>(`/admin/annunci/${id}`, { method: 'DELETE' })
};
