import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '@/utils/api';
import type { User } from './useAuth';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  annuncioId?: string;
  annuncioTitle?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useChat(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Carica conversazioni
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      const total = data.reduce((acc, c) => acc + c.unreadCount, 0);
      setUnreadTotal(total);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
    
    // Polling per aggiornamenti (alternativa a WebSocket)
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const getOrCreateConversation = useCallback(async (
    otherUserId: string, 
    otherUserName: string, 
    annuncioInfo?: { id: string; title: string }
  ): Promise<string> => {
    try {
      const data = await chatApi.createConversation({
        otherUserId,
        annuncioId: annuncioInfo?.id,
        annuncioTitle: annuncioInfo?.title
      });
      await fetchConversations();
      return data.id;
    } catch (error) {
      throw error;
    }
  }, [fetchConversations]);

  const getMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(prev => ({ ...prev, [conversationId]: data }));
      return data;
    } catch (error) {
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string): Promise<boolean> => {
    try {
      const newMessage = await chatApi.sendMessage(conversationId, content);
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }));
      await fetchConversations();
      return true;
    } catch (error) {
      return false;
    }
  }, [fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await chatApi.getMessages(conversationId); // Segna come letto sul server
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
      setUnreadTotal(prev => Math.max(0, prev - (conversations.find(c => c.id === conversationId)?.unreadCount || 0)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      await chatApi.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    conversations,
    messages,
    unreadTotal,
    loading,
    getOrCreateConversation,
    sendMessage,
    getMessages,
    markAsRead,
    deleteConversation,
    refreshConversations: fetchConversations
  };
}
