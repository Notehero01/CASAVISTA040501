import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChevronLeft, Trash2, User as UserIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/hooks/useAuth';
import type { Conversation, ChatMessage } from '@/hooks/useChat';

interface ChatWidgetProps {
  currentUser: User | null;
  conversations: Conversation[];
  unreadTotal: number;
  openConversationId?: string | null;
  onConversationOpened?: () => void;
  getMessages: (conversationId: string) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: string, content: string) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
}

export function ChatWidget({ 
  currentUser,
  conversations,
  unreadTotal,
  openConversationId,
  onConversationOpened,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openConversationId) {
      setIsOpen(true);
      setActiveConversation(openConversationId);
      onConversationOpened?.();
    }
  }, [openConversationId, onConversationOpened]);

  useEffect(() => {
    if (activeConversation) {
      getMessages(activeConversation).then(setMessages);
      markAsRead(activeConversation);
    }
  }, [activeConversation]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation) return;
    const success = await sendMessage(activeConversation, messageText);
    if (success) {
      setMessageText('');
      getMessages(activeConversation).then(setMessages);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const activeConv = conversations.find(c => c.id === activeConversation);

  const filteredConversations = conversations.filter(c => {
    const otherId = c.participants.find(p => p !== currentUser?.id);
    const otherName = c.participantNames[otherId || ''];
    return otherName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="w-14 h-14 rounded-full bg-[#e74c3c] hover:bg-[#c0392b] shadow-lg relative">
          <MessageCircle className="h-6 w-6" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadTotal}
            </span>
          )}
        </Button>
      )}

      {isOpen && (
        <div className="flex h-[min(520px,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="bg-[#e74c3c] text-white p-4 flex items-center justify-between">
            {!activeConversation ? (
              <>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-semibold">Messaggi</span>
                  {unreadTotal > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{unreadTotal}</span>}
                </div>
                <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveConversation(null)}><ChevronLeft className="h-5 w-5" /></button>
                  <span className="truncate font-medium">
                    {activeConv?.participantNames[activeConv.participants.find(p => p !== currentUser.id) || '']}
                  </span>
                </div>
                <button onClick={() => { deleteConversation(activeConversation); setActiveConversation(null); }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {!activeConversation ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Cerca..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conv) => {
                  const otherId = conv.participants.find(p => p !== currentUser.id);
                  const otherName = conv.participantNames[otherId || ''];
                  return (
                    <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-medium text-sm">{otherName}</p>
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content || 'Nessun messaggio'}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-[#e74c3c] text-white text-xs rounded-full flex items-center justify-center">{conv.unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#e74c3c] text-white' : 'bg-gray-100'}`}>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Input placeholder="Scrivi..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                  <Button onClick={handleSend} disabled={!messageText.trim()} className="bg-[#e74c3c]"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
