const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await readData('conversations');
    const messages = await readData('messages');
    
    const userConversations = conversations
      .filter(c => c.participants.includes(req.user.id))
      .map(c => {
        const lastMessage = messages
          .filter(m => m.conversationId === c.id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        const unreadCount = messages.filter(
          m => m.conversationId === c.id && m.receiverId === req.user.id && !m.read
        ).length;

        return {
          ...c,
          lastMessage,
          unreadCount
        };
      })
      .sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    res.json(userConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get or create conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { otherUserId, annuncioId, annuncioTitle } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ message: 'ID utente richiesto.' });
    }

    const conversations = await readData('conversations');
    const users = await readData('users');
    
    const otherUser = users.find(u => u.id === otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    // Cerca conversazione esistente
    let conversation = conversations.find(c => 
      c.participants.includes(req.user.id) && 
      c.participants.includes(otherUserId) &&
      (!annuncioId || c.annuncioId === annuncioId)
    );

    if (!conversation) {
      conversation = {
        id: generateId(),
        participants: [req.user.id, otherUserId],
        participantNames: {
          [req.user.id]: `${req.user.nome} ${req.user.cognome}`,
          [otherUserId]: `${otherUser.nome} ${otherUser.cognome}`
        },
        annuncioId: annuncioId || null,
        annuncioTitle: annuncioTitle || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      conversations.push(conversation);
      await writeData('conversations', conversations);
    }

    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conversations = await readData('conversations');
    const conversation = conversations.find(c => c.id === req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata.' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    const messages = await readData('messages');
    const conversationMessages = messages
      .filter(m => m.conversationId === req.params.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Segna come letti
    let updated = false;
    messages.forEach(m => {
      if (m.conversationId === req.params.id && m.receiverId === req.user.id && !m.read) {
        m.read = true;
        updated = true;
      }
    });

    if (updated) {
      await writeData('messages', messages);
    }

    res.json(conversationMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Send message
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Contenuto richiesto.' });
    }

    const conversations = await readData('conversations');
    const conversation = conversations.find(c => c.id === req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata.' });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    const receiverId = conversation.participants.find(p => p !== req.user.id);

    const messages = await readData('messages');
    const newMessage = {
      id: generateId(),
      conversationId: req.params.id,
      senderId: req.user.id,
      senderName: `${req.user.nome} ${req.user.cognome}`,
      receiverId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    messages.push(newMessage);
    await writeData('messages', messages);

    // Aggiorna timestamp conversazione
    conversation.updatedAt = newMessage.timestamp;
    await writeData('conversations', conversations);

    // Invia notifica email al destinatario (non bloccante)
    const users = await readData('users');
    const receiver = users.find(u => u.id === receiverId);
    if (receiver && receiver.email) {
      const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      sendEmail(
        receiver.email, 
        'newMessage', 
        [`${req.user.nome} ${req.user.cognome}`, conversation.annuncioTitle || 'Annuncio', preview]
      ).catch(err => {
        console.log('Notification email failed:', err.message);
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Delete conversation
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversations = await readData('conversations');
    const index = conversations.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Conversazione non trovata.' });
    }

    if (!conversations[index].participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    // Elimina conversazione
    conversations.splice(index, 1);
    await writeData('conversations', conversations);

    // Elimina messaggi
    const messages = await readData('messages');
    const filteredMessages = messages.filter(m => m.conversationId !== req.params.id);
    await writeData('messages', filteredMessages);

    res.json({ message: 'Conversazione eliminata.' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get unread count
router.get('/unread', auth, async (req, res) => {
  try {
    const messages = await readData('messages');
    const unreadCount = messages.filter(
      m => m.receiverId === req.user.id && !m.read
    ).length;

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
