// Servizio Email - Configurazione base
// Per produzione, integra con SendGrid, AWS SES, o altro provider

const nodemailer = require('nodemailer');

// Configurazione transporter (usa variabili d'ambiente in produzione)
let transporter = null;

function getEmailTemplate(template, data) {
  return templates[template](...data);
}

function getDefaultSenderAddress() {
  return process.env.EMAIL_FROM
    || (process.env.SMTP_USER ? `CasaVista <${process.env.SMTP_USER}>` : 'CasaVista <noreply@casavista.it>');
}

function parseSender(senderValue) {
  const fallback = { name: 'CasaVista', email: 'noreply@casavista.it' };
  if (!senderValue) return fallback;

  const match = senderValue.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim() || fallback.name,
      email: match[2].trim()
    };
  }

  return {
    name: process.env.EMAIL_FROM_NAME || fallback.name,
    email: senderValue.trim()
  };
}

async function sendWithBrevo(to, subject, html, options = {}) {
  const sender = parseSender(process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL);
  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html
  };

  if (options.replyTo) {
    payload.replyTo = {
      email: options.replyTo,
      name: options.replyToName || options.replyTo
    };
  }

  const response = await fetch(process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message || `Brevo API error ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function getSmtpOptions(overrides = {}) {
  const smtpPort = Number(overrides.port || process.env.SMTP_PORT || 587);
  const smtpSecure = overrides.secure !== undefined
    ? overrides.secure
    : process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465;

  return {
    host: overrides.host || process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  };
}

function getSmtpFallbackOptions(primaryOptions) {
  const fallbackHost = process.env.SMTP_FALLBACK_HOST;
  const fallbackPort = process.env.SMTP_FALLBACK_PORT;

  if (fallbackHost || fallbackPort) {
    return [getSmtpOptions({
      host: fallbackHost || primaryOptions.host,
      port: Number(fallbackPort || primaryOptions.port),
      secure: process.env.SMTP_FALLBACK_SECURE === 'true'
    })];
  }

  if (primaryOptions.port === 465) {
    return [getSmtpOptions({
      host: primaryOptions.host,
      port: 587,
      secure: false
    })];
  }

  return [];
}

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
    transporter = nodemailer.createTransport(getSmtpOptions());
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
        <p>Grazie per esserti registrato su CasaVista, il portale immobiliare per cercare e pubblicare annunci.</p>
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
  }),

  contactRequest: ({ nome, cognome, email, telefono, messaggio }) => ({
    subject: `Nuovo contatto dal sito - ${nome} ${cognome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">Nuovo messaggio da CasaVista</h1>
        <p><strong>Nome:</strong> ${nome} ${cognome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${telefono || 'Non indicato'}</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; white-space: pre-line;">${messaggio}</p>
        </div>
      </div>
    `
  })
};

// Funzione per inviare email
async function sendEmail(to, template, data, options = {}) {
  const { subject, html } = getEmailTemplate(template, data);

  if (process.env.BREVO_API_KEY) {
    try {
      const info = await sendWithBrevo(to, subject, html, options);
      console.log('Email sent with Brevo:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Brevo email send error:', error);
      return { success: false, error: error.message };
    }
  }

  const transport = getTransporter();
  
  if (!transport) {
    console.log('Email service not configured. Would send:', { to, template, data });
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const mailOptions = {
      from: getDefaultSenderAddress(),
      to,
      subject,
      html,
      replyTo: options.replyTo
    };
    
    const info = await transport.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (process.env.SMTP_HOST) {
      const fallbackOptions = getSmtpFallbackOptions(getSmtpOptions());

      for (const options of fallbackOptions) {
        try {
          console.log(`Retrying email with SMTP fallback ${options.host}:${options.port}`);
          const fallbackTransport = nodemailer.createTransport(options);
          const info = await fallbackTransport.sendMail({
            from: getDefaultSenderAddress(),
            to,
            subject,
            html,
            replyTo: options.replyTo
          });

          console.log('Email sent with fallback:', info.messageId);
          return { success: true, messageId: info.messageId };
        } catch (fallbackError) {
          console.error(`SMTP fallback ${options.host}:${options.port} failed:`, fallbackError);
        }
      }
    }

    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  templates
};
