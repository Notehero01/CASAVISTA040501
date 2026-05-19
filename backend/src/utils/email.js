// Servizio Email - Configurazione base
// Per produzione, integra con SendGrid, AWS SES, o altro provider

const nodemailer = require('nodemailer');

// Configurazione transporter (usa variabili d'ambiente in produzione)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // Configurazione per SendGrid (consigliato)
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } 
  // Configurazione per Gmail (per test)
  else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  }
  // Configurazione SMTP generica
  else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  return transporter;
}

// Template email
const templates = {
  welcome: (nome) => ({
    subject: 'Benvenuto su CasaVista!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Benvenuto su CasaVista!</h1>
        <p>Ciao ${nome},</p>
        <p>Grazie per esserti registrato su CasaVista, il portale immobiliare 100% gratuito!</p>
        <p>Con il tuo account puoi:</p>
        <ul>
          <li>Pubblicare annunci illimitati</li>
          <li>Cercare tra migliaia di immobili</li>
          <li>Contattare inserzionisti via chat</li>
          <li>Salvare i tuoi annunci preferiti</li>
        </ul>
        <p>Inizia subito a cercare la casa dei tuoi sogni!</p>
        <a href="https://casavista.it/cerca" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Cerca Annunci</a>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">© 2024 CasaVista - Tutti i diritti riservati</p>
      </div>
    `
  }),
  
  newMessage: (mittenteNome, annuncioTitolo, messagePreview) => ({
    subject: `Nuovo messaggio da ${mittenteNome} - CasaVista`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Hai ricevuto un nuovo messaggio!</h1>
        <p><strong>${mittenteNome}</strong> ti ha scritto riguardo all'annuncio <strong>"${annuncioTitolo}"</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">${messagePreview}</p>
        </div>
        <a href="https://casavista.it/messaggi" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Leggi il messaggio</a>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">© 2024 CasaVista - Tutti i diritti riservati</p>
      </div>
    `
  }),
  
  newAnnuncio: (titolo, citta) => ({
    subject: 'Annuncio pubblicato con successo! - CasaVista',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Annuncio pubblicato!</h1>
        <p>Il tuo annuncio <strong>"${titolo}"</strong> a <strong>${citta}</strong> è stato pubblicato con successo!</p>
        <p>Riceverai una notifica quando qualcuno ti contatterà.</p>
        <a href="https://casavista.it/annunci-miei" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Gestisci i tuoi annunci</a>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">© 2024 CasaVista - Tutti i diritti riservati</p>
      </div>
    `
  }),
  
  passwordReset: (resetLink) => ({
    subject: 'Reset password - CasaVista',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Reset password</h1>
        <p>Hai richiesto il reset della password per il tuo account CasaVista.</p>
        <p>Clicca il pulsante qui sotto per impostare una nuova password:</p>
        <a href="${resetLink}" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p style="color: #666;">Se non hai richiesto tu questo reset, ignora questa email.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">© 2024 CasaVista - Tutti i diritti riservati</p>
      </div>
    `
  })
};

// Funzione per inviare email
async function sendEmail(to, template, data) {
  const transport = getTransporter();
  
  if (!transport) {
    console.log('Email service not configured. Would send:', { to, template, data });
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const { subject, html } = templates[template](...data);
    
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@casavista.it',
      to,
      subject,
      html
    });
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  templates
};
