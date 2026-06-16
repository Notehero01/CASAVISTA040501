import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search, Send, Trash2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/hooks/useAuth';
import type { ChatMessage, Conversation } from '@/hooks/useChat';

interface MessaggiPageProps {
  currentUser: User | null;
  conversations: Conversation[];
  getMessages: (conversationId: string) => Promise<ChatMessage[]>;
  sendMessage: (conversationId: string, content: string) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MessaggiPage({
  currentUser,
  conversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation
}: MessaggiPageProps) {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = useMemo(
    () => conversations.find(conversation => conversation.id === activeConversation),
    [activeConversation, conversations]
  );

  useEffect(() => {
    if (!activeConversation) return;

    getMessages(activeConversation).then(setMessages);
    markAsRead(activeConversation);
  }, [activeConversation, getMessages, markAsRead]);

  const filteredConversations = conversations.filter(conversation => {
    const otherId = conversation.participants.find(participant => participant !== currentUser?.id);
    const otherName = conversation.participantNames[otherId || ''] || '';
    const annuncioTitle = conversation.annuncioTitle || '';
    const needle = `${otherName} ${annuncioTitle}`.toLowerCase();
    return needle.includes(searchQuery.toLowerCase());
  });

  const handleSend = async () => {
    if (!activeConversation || !messageText.trim()) return;

    const success = await sendMessage(activeConversation, messageText);
    if (success) {
      setMessageText('');
      setMessages(await getMessages(activeConversation));
    }
  };

  const handleDelete = async () => {
    if (!activeConversation) return;
    if (!window.confirm('Eliminare questa conversazione?')) return;

    const success = await deleteConversation(activeConversation);
    if (success) {
      setActiveConversation(null);
      setMessages([]);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[#e74c3c]" />
          <h1 className="text-2xl font-bold">Accedi per leggere i messaggi</h1>
          <p className="mt-2 text-gray-600">La chat e disponibile per utenti registrati.</p>
          <Link to="/login">
            <Button className="mt-6 bg-[#e74c3c]">Accedi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Messaggi</h1>
          <p className="text-gray-600">Gestisci le conversazioni sugli annunci.</p>
        </div>

        <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-lg border bg-white lg:grid-cols-[340px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cerca conversazione"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {filteredConversations.length === 0 && (
                <div className="p-6 text-sm text-gray-500">Nessuna conversazione.</div>
              )}
              {filteredConversations.map(conversation => {
                const otherId = conversation.participants.find(participant => participant !== currentUser.id);
                const otherName = conversation.participantNames[otherId || ''] || 'Utente';

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation.id)}
                    className={`w-full border-b p-4 text-left hover:bg-gray-50 ${activeConversation === conversation.id ? 'bg-[#e74c3c]/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium text-gray-900">{otherName}</p>
                          {conversation.unreadCount > 0 && (
                            <span className="rounded-full bg-[#e74c3c] px-2 py-0.5 text-xs text-white">{conversation.unreadCount}</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-gray-500">{conversation.annuncioTitle || 'Conversazione'}</p>
                        <p className="mt-1 truncate text-sm text-gray-600">{conversation.lastMessage?.content || 'Nessun messaggio'}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col">
            {!activeConv ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="mb-4 h-12 w-12 text-gray-300" />
                <h2 className="text-xl font-semibold">Seleziona una conversazione</h2>
                <p className="mt-2 text-gray-500">Qui vedrai i messaggi ricevuti dagli utenti interessati agli annunci.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b p-4">
                  <div>
                    <h2 className="font-semibold">
                      {activeConv.participantNames[activeConv.participants.find(participant => participant !== currentUser.id) || ''] || 'Utente'}
                    </h2>
                    <p className="text-sm text-gray-500">{activeConv.annuncioTitle || 'Conversazione'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Elimina
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {messages.map(message => {
                      const mine = message.senderId === currentUser.id;
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[78%] rounded-lg px-4 py-2 text-sm ${mine ? 'bg-[#e74c3c] text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p>{message.content}</p>
                            <p className="mt-1 text-xs opacity-70">{formatTime(message.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t bg-gray-50 p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Scrivi un messaggio"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} disabled={!messageText.trim()} className="bg-[#e74c3c]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
