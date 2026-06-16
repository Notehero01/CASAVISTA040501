const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

function sanitizeUser(user) {
  const {
    password,
    passwordResetToken,
    passwordResetExpires,
    ...safeUser
  } = user;

  return safeUser;
}

function isVisibleAnnuncio(annuncio) {
  return !annuncio.deletedAt && !['hidden', 'deleted'].includes(annuncio.moderationStatus);
}

router.get('/summary', async (req, res) => {
  try {
    const users = await readData('users');
    const annunci = await readData('annunci');
    const conversations = await readData('conversations');

    const agencies = users.filter(user => user.tipo === 'amministrazione');

    res.json({
      users: users.length,
      agencies: agencies.length,
      verifiedAgencies: agencies.filter(user => user.verified).length,
      blockedUsers: users.filter(user => user.blocked).length,
      annunci: annunci.filter(isVisibleAnnuncio).length,
      hiddenAnnunci: annunci.filter(item => item.moderationStatus === 'hidden').length,
      conversations: conversations.length
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await readData('users');
    const annunci = await readData('annunci');

    const safeUsers = users
      .map(user => ({
        ...sanitizeUser(user),
        annunciCount: annunci.filter(item => item.userId === user.id && !item.deletedAt).length
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(safeUsers);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.put('/users/:id/block', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Non puoi bloccare il tuo account admin.' });
    }

    const users = await readData('users');
    const index = users.findIndex(user => user.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    const blocked = Boolean(req.body.blocked);
    users[index].blocked = blocked;
    users[index].blockedAt = blocked ? new Date().toISOString() : null;
    users[index].updatedAt = new Date().toISOString();

    await writeData('users', users);

    res.json({
      message: blocked ? 'Utente bloccato.' : 'Utente sbloccato.',
      user: sanitizeUser(users[index])
    });
  } catch (error) {
    console.error('Admin block user error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.put('/users/:id/verify', async (req, res) => {
  try {
    const users = await readData('users');
    const index = users.findIndex(user => user.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    const verified = Boolean(req.body.verified);
    users[index].verified = verified;
    users[index].verifiedAt = verified ? new Date().toISOString() : null;
    users[index].updatedAt = new Date().toISOString();

    await writeData('users', users);

    res.json({
      message: verified ? 'Account verificato.' : 'Verifica rimossa.',
      user: sanitizeUser(users[index])
    });
  } catch (error) {
    console.error('Admin verify user error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.get('/annunci', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const users = await readData('users');

    const enriched = annunci
      .filter(item => item.moderationStatus !== 'deleted')
      .map(item => {
        const owner = users.find(user => user.id === item.userId);
        return {
          ...item,
          owner: owner ? sanitizeUser(owner) : null
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(enriched);
  } catch (error) {
    console.error('Admin annunci error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.put('/annunci/:id/status', async (req, res) => {
  try {
    const allowedStatuses = ['published', 'hidden'];
    const moderationStatus = req.body.status;

    if (!allowedStatuses.includes(moderationStatus)) {
      return res.status(400).json({ message: 'Stato annuncio non valido.' });
    }

    const annunci = await readData('annunci');
    const index = annunci.findIndex(item => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    annunci[index].moderationStatus = moderationStatus;
    annunci[index].hiddenAt = moderationStatus === 'hidden' ? new Date().toISOString() : null;
    annunci[index].updatedAt = new Date().toISOString();

    await writeData('annunci', annunci);

    res.json({
      message: moderationStatus === 'hidden' ? 'Annuncio nascosto.' : 'Annuncio pubblicato.',
      annuncio: annunci[index]
    });
  } catch (error) {
    console.error('Admin update annuncio status error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

router.delete('/annunci/:id', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const index = annunci.findIndex(item => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    annunci[index].moderationStatus = 'deleted';
    annunci[index].deletedAt = new Date().toISOString();
    annunci[index].updatedAt = new Date().toISOString();

    await writeData('annunci', annunci);

    res.json({ message: 'Annuncio rimosso.' });
  } catch (error) {
    console.error('Admin delete annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
