const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/db');
const { auth, adminOnly } = require('../middleware/auth');
const {
  buildAgencyProfile,
  matchesAgencyIdentifier
} = require('../utils/agency');

// Get all amministrazioni
router.get('/', async (req, res) => {
  try {
    const { citta, servizi } = req.query;
    const users = await readData('users');
    const amministrazioniData = await readData('amministrazioni');
    const annunci = await readData('annunci');

    let amministrazioni = users
      .filter(u => u.tipo === 'amministrazione')
      .map(u => {
        const details = amministrazioniData.find(a => a.userId === u.id);
        return buildAgencyProfile(u, details, annunci);
      });

    // Filtra per città
    if (citta) {
      amministrazioni = amministrazioni.filter(a => 
        a.citta?.toLowerCase().includes(citta.toLowerCase())
      );
    }

    // Filtra per servizi
    if (servizi) {
      const serviziArray = servizi.split(',');
      amministrazioni = amministrazioni.filter(a => 
        serviziArray.every(s => a.servizi?.includes(s))
      );
    }

    res.json(amministrazioni);
  } catch (error) {
    console.error('Get amministrazioni error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get single amministrazione
router.get('/:id', async (req, res) => {
  try {
    const users = await readData('users');
    const amministrazioniData = await readData('amministrazioni');
    const annunci = await readData('annunci');
    
    const user = users.find(u => {
      if (u.tipo !== 'amministrazione') return false;
      const details = amministrazioniData.find(a => a.userId === u.id);
      return matchesAgencyIdentifier(u, details, req.params.id);
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Amministrazione non trovata.' });
    }

    const details = amministrazioniData.find(a => a.userId === user.id);

    res.json(buildAgencyProfile(user, details, annunci, { includeAnnunci: true }));
  } catch (error) {
    console.error('Get amministrazione error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Create/Update amministrazione profile
router.post('/profile', auth, async (req, res) => {
  try {
    if (req.user.tipo !== 'amministrazione') {
      return res.status(403).json({ message: 'Solo per amministrazioni.' });
    }

    const {
      ragioneSociale,
      descrizione,
      citta,
      provincia,
      indirizzo,
      sitoWeb,
      telefono,
      whatsapp,
      logo,
      coverImage,
      servizi,
      annoFondazione,
      condominiGestiti
    } = req.body;

    const amministrazioni = await readData('amministrazioni');
    const users = await readData('users');
    const index = amministrazioni.findIndex(a => a.userId === req.user.id);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    const existingProfile = index === -1 ? {} : amministrazioni[index];

    if (userIndex !== -1 && telefono !== undefined) {
      users[userIndex].telefono = telefono || null;
      users[userIndex].updatedAt = new Date().toISOString();
      await writeData('users', users);
    }

    const profileData = {
      userId: req.user.id,
      ragioneSociale: ragioneSociale !== undefined ? ragioneSociale : (existingProfile.ragioneSociale || `${req.user.nome} ${req.user.cognome}`),
      descrizione: descrizione !== undefined ? descrizione : (existingProfile.descrizione || ''),
      citta: citta !== undefined ? citta : (existingProfile.citta || ''),
      provincia: provincia !== undefined ? provincia : (existingProfile.provincia || ''),
      indirizzo: indirizzo !== undefined ? indirizzo : (existingProfile.indirizzo || ''),
      sitoWeb: sitoWeb !== undefined ? sitoWeb : (existingProfile.sitoWeb || ''),
      telefono: telefono !== undefined ? telefono : (existingProfile.telefono || req.user.telefono || ''),
      whatsapp: whatsapp !== undefined ? whatsapp : (existingProfile.whatsapp || ''),
      logo: logo !== undefined ? logo : (existingProfile.logo || ''),
      coverImage: coverImage !== undefined ? coverImage : (existingProfile.coverImage || ''),
      servizi: Array.isArray(servizi) ? servizi : (Array.isArray(existingProfile.servizi) ? existingProfile.servizi : []),
      annoFondazione: annoFondazione !== undefined && annoFondazione !== '' ? parseInt(annoFondazione) : (existingProfile.annoFondazione || null),
      condominiGestiti: condominiGestiti !== undefined && condominiGestiti !== '' ? parseInt(condominiGestiti) : (existingProfile.condominiGestiti || 0),
      rating: existingProfile.rating || 0,
      recensioni: existingProfile.recensioni || 0,
      updatedAt: new Date().toISOString()
    };

    if (index === -1) {
      profileData.createdAt = new Date().toISOString();
      amministrazioni.push(profileData);
    } else {
      amministrazioni[index] = { ...amministrazioni[index], ...profileData };
    }

    await writeData('amministrazioni', amministrazioni);

    res.json({
      message: 'Profilo aggiornato.',
      profile: index === -1 ? profileData : amministrazioni[index]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Admin: verify amministrazione
router.put('/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const amministrazioni = await readData('amministrazioni');
    const index = amministrazioni.findIndex(a => a.userId === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Amministrazione non trovata.' });
    }

    amministrazioni[index].verified = true;
    amministrazioni[index].verifiedAt = new Date().toISOString();
    await writeData('amministrazioni', amministrazioni);

    res.json({ message: 'Amministrazione verificata.' });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
