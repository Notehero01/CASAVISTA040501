import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

const updatedAt = '16 giugno 2026';

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-sm font-medium text-[#e74c3c]">Torna alla home</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">Ultimo aggiornamento: {updatedAt}</p>
        </div>
        <div className="space-y-6 rounded-lg border bg-white p-6 text-gray-700 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 leading-7">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <Section title="Titolare e contatti">
        <p>
          Il titolare del trattamento e CasaVista. Per richieste relative ai dati personali puoi scrivere a
          {' '}<a href="mailto:info@casavista.it" className="text-[#e74c3c] font-medium">info@casavista.it</a>.
        </p>
      </Section>

      <Section title="Dati trattati">
        <p>
          CasaVista tratta i dati inseriti dagli utenti durante registrazione, login, pubblicazione annunci,
          caricamento immagini, richieste di contatto, chat e recupero password. I dati possono includere nome,
          cognome, email, telefono, contenuti degli annunci, immagini, messaggi, indirizzi degli immobili e dati
          tecnici necessari alla sicurezza del servizio.
        </p>
      </Section>

      <Section title="Finalita">
        <p>
          I dati sono usati per creare e gestire l'account, pubblicare annunci immobiliari, mostrare gli annunci
          agli utenti, abilitare la chat, inviare email operative, prevenire abusi e mantenere sicuro il portale.
        </p>
      </Section>

      <Section title="Servizi tecnici usati">
        <p>
          Il servizio puo utilizzare provider tecnici come Render per hosting e database, Cloudflare R2 per le
          immagini, Brevo per email transazionali e provider cartografici OpenStreetMap/CARTO per la mappa.
        </p>
      </Section>

      <Section title="Conservazione">
        <p>
          I dati dell'account e degli annunci sono conservati finche l'account resta attivo o finche serve per
          gestire obblighi tecnici, sicurezza, richieste dell'utente o contestazioni. Le immagini eliminate e gli
          annunci rimossi possono restare nei backup tecnici per un periodo limitato.
        </p>
      </Section>

      <Section title="Diritti dell'utente">
        <p>
          L'utente puo chiedere accesso, rettifica, cancellazione, limitazione, opposizione o portabilita dei dati
          scrivendo a info@casavista.it. L'utente puo inoltre presentare reclamo all'autorita competente per la
          protezione dei dati personali.
        </p>
      </Section>
    </LegalShell>
  );
}

export function TerminiPage() {
  return (
    <LegalShell title="Termini di servizio">
      <Section title="Uso del portale">
        <p>
          CasaVista consente agli utenti registrati di pubblicare e consultare annunci immobiliari e di contattare
          altri utenti tramite chat. L'utente si impegna a fornire informazioni corrette, aggiornate e lecite.
        </p>
      </Section>

      <Section title="Responsabilita degli annunci">
        <p>
          Chi pubblica un annuncio e responsabile dei contenuti inseriti, incluse descrizioni, immagini, prezzo,
          indirizzo e dati di contatto. Non sono ammessi contenuti falsi, offensivi, discriminatori, copiati senza
          autorizzazione o contrari alla legge.
        </p>
      </Section>

      <Section title="Moderazione">
        <p>
          CasaVista puo rimuovere o nascondere annunci e bloccare account in caso di abuso, segnalazioni, contenuti
          non conformi o uso improprio del servizio. Le agenzie e gli account professionali possono essere marcati
          come verificati dopo controllo manuale.
        </p>
      </Section>

      <Section title="Servizio gratuito">
        <p>
          Il portale e pensato come servizio gratuito per la pubblicazione iniziale degli annunci. Eventuali funzioni
          premium, piani commerciali o servizi aggiuntivi saranno comunicati in modo chiaro prima dell'attivazione.
        </p>
      </Section>

      <Section title="Disponibilita">
        <p>
          CasaVista lavora per mantenere il servizio disponibile e sicuro, ma non garantisce assenza totale di errori,
          interruzioni, manutenzioni o indisponibilita dei provider tecnici.
        </p>
      </Section>

      <Section title="Contatti">
        <p>
          Per assistenza o segnalazioni scrivi a
          {' '}<a href="mailto:info@casavista.it" className="text-[#e74c3c] font-medium">info@casavista.it</a>.
        </p>
      </Section>
    </LegalShell>
  );
}

export function CookiePage() {
  return (
    <LegalShell title="Cookie Policy">
      <Section title="Cookie tecnici">
        <p>
          CasaVista usa tecnologie tecniche necessarie al funzionamento del sito, come la conservazione locale del
          token di accesso per mantenere l'utente autenticato e preferenze tecniche utili alla navigazione.
        </p>
      </Section>

      <Section title="Cookie e strumenti di terze parti">
        <p>
          La mappa puo caricare risorse da provider cartografici come OpenStreetMap e CARTO. Le immagini degli annunci
          possono essere distribuite tramite Cloudflare R2. Le email operative sono inviate tramite Brevo.
        </p>
      </Section>

      <Section title="Cookie marketing">
        <p>
          Al momento CasaVista non usa cookie pubblicitari o strumenti di profilazione marketing propri. Se verranno
          aggiunti strumenti di analytics o marketing, questa pagina sara aggiornata e, quando richiesto, sara chiesto
          il consenso prima dell'attivazione.
        </p>
      </Section>

      <Section title="Gestione dal browser">
        <p>
          L'utente puo cancellare cookie e dati locali dalle impostazioni del browser. La cancellazione dei dati tecnici
          puo comportare la disconnessione dall'account o la perdita di alcune preferenze locali.
        </p>
      </Section>
    </LegalShell>
  );
}
