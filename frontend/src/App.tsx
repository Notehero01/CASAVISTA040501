import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChatWidget } from '@/components/ChatWidget';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

// Pages
import { HomePage } from '@/pages/HomePage';
import { CercaPage } from '@/pages/CercaPage';
import { AnnuncioPage } from '@/pages/AnnuncioPage';
import { PubblicaPage } from '@/pages/PubblicaPage';
import { ContattiPage } from '@/pages/ContattiPage';
import { ValutazionePage } from '@/pages/ValutazionePage';
import { MutuoPage } from '@/pages/MutuoPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegistrazionePage } from '@/pages/RegistrazionePage';
import { PasswordDimenticataPage } from '@/pages/PasswordDimenticataPage';
import { ReimpostaPasswordPage } from '@/pages/ReimpostaPasswordPage';
import { AmministrazioniPage } from '@/pages/AmministrazioniPage';
import { AgenziaPage } from '@/pages/AgenziaPage';
import { ProfiloAgenziaPage } from '@/pages/ProfiloAgenziaPage';
import { PreferitiPage } from '@/pages/PreferitiPage';
import { ConfrontoPage } from '@/pages/ConfrontoPage';
import { PrivacyPage, TerminiPage, CookiePage } from '@/pages/LegalPages';
import { AdminPage } from '@/pages/AdminPage';
import { MessaggiPage } from '@/pages/MessaggiPage';
import type { Annuncio } from '@/types/annuncio';

function App() {
  const { user, isAuthenticated, isAdmin, loading, login, register, logout } = useAuth();
  const { conversations, unreadTotal, getOrCreateConversation, sendMessage, getMessages, markAsRead, deleteConversation } = useChat(user);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  const handleStartChat = async (annuncio: Annuncio) => {
    const conversationId = await getOrCreateConversation(
      annuncio.userId,
      annuncio.nome_contatto,
      { id: annuncio.id, title: annuncio.titolo }
    );
    setOpenConversationId(conversationId);
    return conversationId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#e74c3c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header 
          user={user}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          unreadMessages={unreadTotal}
          onLogout={logout}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cerca" element={<CercaPage />} />
            <Route
              path="/annuncio/:slug"
              element={<AnnuncioPage currentUser={user} onStartChat={handleStartChat} />}
            />
            <Route path="/pubblica" element={isAuthenticated ? <PubblicaPage /> : <LoginPage onLogin={login} />} />
            <Route path="/contatti" element={<ContattiPage />} />
            <Route path="/valutazione" element={<ValutazionePage />} />
            <Route path="/mutuo" element={<MutuoPage />} />
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/password-dimenticata" element={<PasswordDimenticataPage />} />
            <Route path="/reimposta-password/:token" element={<ReimpostaPasswordPage />} />
            <Route path="/registrazione" element={<RegistrazionePage onRegister={register} />} />
            <Route path="/amministrazioni" element={<AmministrazioniPage />} />
            <Route path="/agenzia/:slug" element={<AgenziaPage />} />
            <Route path="/profilo-agenzia" element={isAuthenticated ? <ProfiloAgenziaPage user={user} /> : <LoginPage onLogin={login} />} />
            <Route path="/preferiti" element={<PreferitiPage />} />
            <Route path="/confronto" element={<ConfrontoPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/termini" element={<TerminiPage />} />
            <Route path="/cookie" element={<CookiePage />} />
            <Route
              path="/messaggi"
              element={
                <MessaggiPage
                  currentUser={user}
                  conversations={conversations}
                  getMessages={getMessages}
                  sendMessage={sendMessage}
                  markAsRead={markAsRead}
                  deleteConversation={deleteConversation}
                />
              }
            />
            <Route path="/admin" element={isAdmin ? <AdminPage /> : <LoginPage onLogin={login} />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget
          currentUser={user}
          conversations={conversations}
          unreadTotal={unreadTotal}
          openConversationId={openConversationId}
          onConversationOpened={() => setOpenConversationId(null)}
          getMessages={getMessages}
          sendMessage={sendMessage}
          markAsRead={markAsRead}
          deleteConversation={deleteConversation}
        />
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
