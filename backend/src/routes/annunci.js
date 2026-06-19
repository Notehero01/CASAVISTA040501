const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { auth } = require('../middleware/auth');

const MAX_IMAGES_PER_ANNUNCIO = 30;

// Funzione per generare slug
function generateSlug(titolo, id) {
  const slugified = titolo
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${slugified}-${id}`;
}

// Funzione per calcolare distanza (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raggio Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isPublicAnnuncio(annuncio) {
  return !annuncio.deletedAt && !['hidden', 'deleted'].includes(annuncio.moderationStatus);
}

// Get featured annunci
router.get('/featured/list', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const featured = annunci
      .filter(isPublicAnnuncio)
      .sort((a, b) => (b.visualizzazioni || 0) - (a.visualizzazioni || 0))
      .slice(0, 6);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get recent annunci
router.get('/recent/list', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const recent = annunci
      .filter(isPublicAnnuncio)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get annunci owned by current user
router.get('/me/list', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const owned = annunci
      .filter(annuncio => annuncio.userId === req.user.id && annuncio.moderationStatus !== 'deleted' && !annuncio.deletedAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(owned);
  } catch (error) {
    console.error('Get own annunci error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get all annunci (con filtri avanzati)
router.get('/', async (req, res) => {
  try {
    const { 
      tipo, 
      categoria, 
      citta, 
      prezzoMin, 
      prezzoMax, 
      superficieMin, 
      superficieMax,
      localiMin,
      camereMin,
      bagniMin,
      stato,
      classeEnergetica,
      riscaldamento,
      annoCostruzioneMin,
      annoCostruzioneMax,
      caratteristiche,
      lat,
      lng,
      raggioKm,
      page = 1,
      limit = 20
    } = req.query;

    let annunci = (await readData('annunci')).filter(isPublicAnnuncio);

    // Applica filtri base
    if (tipo) annunci = annunci.filter(a => a.tipo === tipo);
    if (categoria) annunci = annunci.filter(a => a.categoria === categoria);
    if (citta) annunci = annunci.filter(a => (a.citta || '').toLowerCase().includes(citta.toLowerCase()));
    if (prezzoMin) annunci = annunci.filter(a => a.prezzo >= parseInt(prezzoMin));
    if (prezzoMax) annunci = annunci.filter(a => a.prezzo <= parseInt(prezzoMax));
    if (superficieMin) annunci = annunci.filter(a => a.superficie >= parseInt(superficieMin));
    if (superficieMax) annunci = annunci.filter(a => a.superficie <= parseInt(superficieMax));
    if (localiMin) annunci = annunci.filter(a => a.locali >= parseInt(localiMin));
    if (camereMin) annunci = annunci.filter(a => a.camere >= parseInt(camereMin));
    if (bagniMin) annunci = annunci.filter(a => a.bagni >= parseInt(bagniMin));
    
    // Filtri avanzati
    if (stato) annunci = annunci.filter(a => a.stato === stato);
    if (classeEnergetica) annunci = annunci.filter(a => a.classe_energetica === classeEnergetica);
    if (riscaldamento) annunci = annunci.filter(a => a.riscaldamento === riscaldamento);
    if (annoCostruzioneMin) annunci = annunci.filter(a => a.anno_costruzione >= parseInt(annoCostruzioneMin));
    if (annoCostruzioneMax) annunci = annunci.filter(a => a.anno_costruzione <= parseInt(annoCostruzioneMax));
    
    // Filtro caratteristiche
    if (caratteristiche) {
      const carArray = caratteristiche.split(',');
      annunci = annunci.filter(a => 
        carArray.every(car => a.caratteristiche && a.caratteristiche.includes(car))
      );
    }
    
    // Ricerca per raggio
    if (lat && lng && raggioKm) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radius = parseFloat(raggioKm);
      
      annunci = annunci.filter(a => {
        if (!a.coordinate || !a.coordinate.lat || !a.coordinate.lng) return false;
        const dist = calculateDistance(userLat, userLng, a.coordinate.lat, a.coordinate.lng);
        return dist <= radius;
      });
    }

    // Ordina per data (più recenti prima)
    annunci.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedAnnunci = annunci.slice(startIndex, endIndex);

    res.json({
      annunci: paginatedAnnunci,
      total: annunci.length,
      page: parseInt(page),
      pages: Math.ceil(annunci.length / limit)
    });
  } catch (error) {
    console.error('Get annunci error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get single annuncio (supporta sia ID che slug)
router.get('/:id', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const { id } = req.params;
    
    // Cerca per ID o slug
    const annuncio = annunci.find(a => (a.id === id || a.slug === id) && isPublicAnnuncio(a));

    if (!annuncio) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    res.json(annuncio);
  } catch (error) {
    console.error('Get annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Incrementa visualizzazioni (endpoint separato)
router.post('/:id/views', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const { id } = req.params;
    
    const annuncio = annunci.find(a => (a.id === id || a.slug === id) && isPublicAnnuncio(a));
    if (!annuncio) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    annuncio.visualizzazioni = (annuncio.visualizzazioni || 0) + 1;
    await writeData('annunci', annunci);

    res.json({ visualizzazioni: annuncio.visualizzazioni });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Create annuncio (richiede auth)
router.post('/', auth, async (req, res) => {
  try {
    const {
      titolo,
      descrizione,
      prezzo,
      tipo,
      categoria,
      superficie,
      locali,
      camere,
      bagni,
      piano,
      indirizzo,
      citta,
      cap,
      provincia,
      immagini = [],
      caratteristiche = [],
      classe_energetica,
      stato,
      riscaldamento,
      anno_costruzione,
      nome_contatto,
      telefono_contatto,
      email_contatto
    } = req.body;
    const immaginiPulite = Array.isArray(immagini) ? immagini.slice(0, MAX_IMAGES_PER_ANNUNCIO) : [];
    const caratteristichePulite = Array.isArray(caratteristiche)
      ? caratteristiche.map(item => String(item).trim()).filter(Boolean).slice(0, 60)
      : [];

    // Validazione
    if (!titolo || !descrizione || !prezzo || !tipo || !categoria || !superficie) {
      return res.status(400).json({ message: 'Campi obbligatori mancanti.' });
    }

    const annunci = await readData('annunci');
    const newId = generateId();
    
    const newAnnuncio = {
      id: newId,
      slug: generateSlug(titolo, newId),
      titolo,
      descrizione,
      prezzo: parseFloat(prezzo),
      tipo,
      categoria,
      superficie: parseFloat(superficie),
      locali: parseInt(locali) || 0,
      camere: parseInt(camere) || 0,
      bagni: parseInt(bagni) || 0,
      piano: piano !== undefined ? parseInt(piano) : null,
      indirizzo: indirizzo || '',
      citta: citta || '',
      cap: cap || '',
      provincia: provincia || '',
      coordinate: req.body.coordinate || null,
      immagini: immaginiPulite,
      caratteristiche: caratteristichePulite,
      classe_energetica: classe_energetica || null,
      stato: stato || null,
      riscaldamento: riscaldamento || null,
      anno_costruzione: anno_costruzione ? parseInt(anno_costruzione) : null,
      nome_contatto: nome_contatto || req.user.nome,
      telefono_contatto: telefono_contatto || req.user.telefono,
      email_contatto: email_contatto || req.user.email,
      userId: req.user.id,
      moderationStatus: 'published',
      visualizzazioni: 0,
      contattiRicevuti: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    annunci.push(newAnnuncio);
    await writeData('annunci', annunci);

    res.status(201).json({
      message: 'Annuncio creato con successo.',
      annuncio: newAnnuncio
    });
  } catch (error) {
    console.error('Create annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Update annuncio
router.put('/:id', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const index = annunci.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    // Verifica proprietario o admin
    if (annunci[index].userId !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    const updateBody = { ...req.body };
    if (Array.isArray(updateBody.immagini)) {
      updateBody.immagini = updateBody.immagini.slice(0, MAX_IMAGES_PER_ANNUNCIO);
    }
    if (Array.isArray(updateBody.caratteristiche)) {
      updateBody.caratteristiche = updateBody.caratteristiche.map(item => String(item).trim()).filter(Boolean).slice(0, 60);
    }

    annunci[index] = {
      ...annunci[index],
      ...updateBody,
      updatedAt: new Date().toISOString()
    };

    await writeData('annunci', annunci);

    res.json({
      message: 'Annuncio aggiornato.',
      annuncio: annunci[index]
    });
  } catch (error) {
    console.error('Update annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Delete annuncio
router.delete('/:id', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const index = annunci.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    // Verifica proprietario o admin
    if (annunci[index].userId !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    annunci.splice(index, 1);
    await writeData('annunci', annunci);

    res.json({ message: 'Annuncio eliminato.' });
  } catch (error) {
    console.error('Delete annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
