import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChatWidget } from '@/components/ChatWidget';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import type { Annuncio } from '@/types/annuncio';

const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
const CercaPage = lazy(() => import('@/pages/CercaPage').then(module => ({ default: module.CercaPage })));
const AnnuncioPage = lazy(() => import('@/pages/AnnuncioPage').then(module => ({ default: module.AnnuncioPage })));
const PubblicaPage = lazy(() => import('@/pages/PubblicaPage').then(module => ({ default: module.PubblicaPage })));
const ContattiPage = lazy(() => import('@/pages/ContattiPage').then(module => ({ default: module.ContattiPage })));
const ValutazionePage = lazy(() => import('@/pages/ValutazionePage').then(module => ({ default: module.ValutazionePage })));
const MutuoPage = lazy(() => import('@/pages/MutuoPage').then(module => ({ default: module.MutuoPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegistrazionePage = lazy(() => import('@/pages/RegistrazionePage').then(module => ({ default: module.RegistrazionePage })));
const PasswordDimenticataPage = lazy(() => import('@/pages/PasswordDimenticataPage').then(module => ({ default: module.PasswordDimenticataPage })));
const ReimpostaPasswordPage = lazy(() => import('@/pages/ReimpostaPasswordPage').then(module => ({ default: module.ReimpostaPasswordPage })));
const AgenziePage = lazy(() => import('@/pages/AgenziePage').then(module => ({ default: module.AgenziePage })));
const AmministrazioniPage = lazy(() => import('@/pages/AmministrazioniPage').then(module => ({ default: module.AmministrazioniPage })));
const AgenziaPage = lazy(() => import('@/pages/AgenziaPage').then(module => ({ default: module.AgenziaPage })));
const ProfiloAgenziaPage = lazy(() => import('@/pages/ProfiloAgenziaPage').then(module => ({ default: module.ProfiloAgenziaPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then(module => ({ default: module.AccountPage })));
const MieiAnnunciPage = lazy(() => import('@/pages/MieiAnnunciPage').then(module => ({ default: module.MieiAnnunciPage })));
const PreferitiPage = lazy(() => import('@/pages/PreferitiPage').then(module => ({ default: module.PreferitiPage })));
const ConfrontoPage = lazy(() => import('@/pages/ConfrontoPage').then(module => ({ default: module.ConfrontoPage })));
const PrivacyPage = lazy(() => import('@/pages/LegalPages').then(module => ({ default: module.PrivacyPage })));
const TerminiPage = lazy(() => import('@/pages/LegalPages').then(module => ({ default: module.TerminiPage })));
const CookiePage = lazy(() => import('@/pages/LegalPages').then(module => ({ default: module.CookiePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(module => ({ default: module.AdminPage })));
const MessaggiPage = lazy(() => import('@/pages/MessaggiPage').then(module => ({ default: module.MessaggiPage })));

function PageFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e74c3c] border-t-transparent" />
    </div>
  );
}

function App() {
  const { user, isAuthenticated, isAdmin, loading, login, register, logout, deleteProfile } = useAuth();
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
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cerca" element={<CercaPage />} />
              <Route
                path="/annuncio/:slug"
                element={<AnnuncioPage currentUser={user} onStartChat={handleStartChat} />}
              />
              <Route path="/pubblica" element={isAuthenticated ? <PubblicaPage /> : <LoginPage onLogin={login} />} />
              <Route path="/modifica-annuncio/:id" element={isAuthenticated ? <PubblicaPage /> : <LoginPage onLogin={login} />} />
              <Route path="/contatti" element={<ContattiPage />} />
              <Route path="/valutazione" element={<ValutazionePage />} />
              <Route path="/mutuo" element={<MutuoPage />} />
              <Route path="/login" element={<LoginPage onLogin={login} />} />
              <Route path="/password-dimenticata" element={<PasswordDimenticataPage />} />
              <Route path="/reimposta-password/:token" element={<ReimpostaPasswordPage />} />
              <Route path="/registrazione" element={<RegistrazionePage onRegister={register} />} />
              <Route path="/agenzie" element={<AgenziePage />} />
              <Route path="/amministrazioni" element={<AmministrazioniPage />} />
              <Route path="/agenzia/:slug" element={<AgenziaPage />} />
              <Route path="/profilo-agenzia" element={isAuthenticated ? <ProfiloAgenziaPage user={user} /> : <LoginPage onLogin={login} />} />
              <Route path="/account" element={isAuthenticated ? <AccountPage user={user} onDeleteProfile={deleteProfile} /> : <LoginPage onLogin={login} />} />
              <Route path="/miei-annunci" element={isAuthenticated ? <MieiAnnunciPage /> : <LoginPage onLogin={login} />} />
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
          </Suspense>
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
