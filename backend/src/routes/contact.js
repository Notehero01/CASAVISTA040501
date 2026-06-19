const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/email');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

router.post('/', async (req, res) => {
  try {
    const { nome, cognome, email, telefono, messaggio, privacyConsent } = req.body;

    if (!nome || !cognome || !email || !messaggio) {
      return res.status(400).json({ message: 'Compila tutti i campi obbligatori.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Inserisci un indirizzo email valido.' });
    }

    if (!privacyConsent) {
      return res.status(400).json({ message: 'Devi autorizzare il trattamento dei dati per ricevere risposta.' });
    }

    const cleanMessage = String(messaggio).trim();
    if (cleanMessage.length < 10) {
      return res.status(400).json({ message: 'Scrivi un messaggio di almeno 10 caratteri.' });
    }

    const contactEmail = process.env.CONTACT_EMAIL || 'info@casavista.it';
    const result = await sendEmail(
      contactEmail,
      'contactRequest',
      [{
        nome: escapeHtml(nome),
        cognome: escapeHtml(cognome),
        email: escapeHtml(email),
        telefono: escapeHtml(telefono),
        messaggio: escapeHtml(cleanMessage)
      }],
      {
        replyTo: String(email).trim().toLowerCase(),
        replyToName: `${nome} ${cognome}`.trim()
      }
    );

    if (!result.success) {
      return res.status(502).json({ message: 'Invio email non riuscito. Riprova tra poco o scrivi a info@casavista.it.' });
    }

    res.json({ message: 'Messaggio inviato. Ti risponderemo presto.' });
  } catch (error) {
    console.error('Contact request error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
