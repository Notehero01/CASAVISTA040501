function slugifyText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 70) || 'agenzia';
}

function getAgencyName(user, details = {}) {
  const fullName = `${user?.nome || ''} ${user?.cognome || ''}`.trim();
  return details?.ragioneSociale || fullName || 'Agenzia CasaVista';
}

function buildAgencySlug(user, details = {}) {
  const idPart = String(user?.id || '').slice(0, 8);
  return `${slugifyText(getAgencyName(user, details))}-${idPart}`;
}

function isPublicAnnuncio(annuncio) {
  const status = annuncio.moderationStatus || 'published';
  return !annuncio.deletedAt && status === 'published';
}

function matchesAgencyIdentifier(user, details, identifier) {
  let normalized = String(identifier || '');
  try {
    normalized = decodeURIComponent(normalized);
  } catch (error) {
    // Keep the raw value if the browser sends a malformed encoded slug.
  }
  normalized = normalized.toLowerCase();
  return user.id === identifier || buildAgencySlug(user, details).toLowerCase() === normalized;
}

function buildAgencyProfile(user, details = {}, annunci = [], options = {}) {
  const publicAnnunci = annunci
    .filter(annuncio => annuncio.userId === user.id && isPublicAnnuncio(annuncio))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const coverFromListing = publicAnnunci.find(a => Array.isArray(a.immagini) && a.immagini.length > 0)?.immagini?.[0];
  const displayName = getAgencyName(user, details);

  const profile = {
    id: user.id,
    slug: buildAgencySlug(user, details),
    nome: user.nome,
    cognome: user.cognome,
    categoriaProfilo: details.categoriaProfilo || '',
    displayName,
    ragioneSociale: details.ragioneSociale || displayName,
    descrizione: details.descrizione || '',
    email: details.email || user.email,
    telefono: details.telefono || user.telefono || '',
    whatsapp: details.whatsapp || '',
    citta: details.citta || '',
    provincia: details.provincia || '',
    indirizzo: details.indirizzo || '',
    sitoWeb: details.sitoWeb || '',
    logo: details.logo || '',
    coverImage: details.coverImage || coverFromListing || details.logo || '',
    servizi: Array.isArray(details.servizi) ? details.servizi : [],
    annoFondazione: details.annoFondazione || null,
    condominiGestiti: details.condominiGestiti || 0,
    rating: details.rating || 0,
    recensioni: details.recensioni || 0,
    verified: Boolean(user.verified || details.verified),
    verifiedAt: user.verifiedAt || details.verifiedAt || null,
    createdAt: user.createdAt,
    updatedAt: details.updatedAt || user.updatedAt,
    annunciCount: publicAnnunci.length,
    venditaCount: publicAnnunci.filter(a => a.tipo === 'vendita').length,
    affittoCount: publicAnnunci.filter(a => a.tipo === 'affitto').length,
    lastAnnuncioAt: publicAnnunci[0]?.createdAt || null
  };

  if (options.includeAnnunci) {
    profile.annunci = publicAnnunci;
  }

  return profile;
}

module.exports = {
  buildAgencyProfile,
  buildAgencySlug,
  getAgencyName,
  isPublicAnnuncio,
  matchesAgencyIdentifier,
  slugifyText
};
