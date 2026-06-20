const express = require('express');
const router = express.Router();
const { readData } = require('../utils/db');
const { buildAgencyProfile } = require('../utils/agency');

function getSiteUrl() {
  const origin = (process.env.CLIENT_ORIGIN || 'https://casavista.it')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
  return origin || 'https://casavista.it';
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isPublicAnnuncio(annuncio) {
  const status = annuncio.moderationStatus || 'published';
  return !annuncio.deletedAt && status === 'published';
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function createUrlEntry({ loc, lastmod, changefreq = 'weekly', priority = '0.7' }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${formatDate(lastmod)}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n');
}

router.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl();

  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /miei-annunci',
    'Disallow: /messaggi',
    'Disallow: /profilo-agenzia',
    'Disallow: /login',
    'Disallow: /registrazione',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n'));
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const siteUrl = getSiteUrl();
    const now = new Date().toISOString();
    const [annunci, users, amministrazioni] = await Promise.all([
      readData('annunci'),
      readData('users'),
      readData('amministrazioni')
    ]);

    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/cerca', priority: '0.9', changefreq: 'daily' },
      { path: '/agenzie', priority: '0.8', changefreq: 'weekly' },
      { path: '/amministrazioni', priority: '0.7', changefreq: 'weekly' },
      { path: '/valutazione', priority: '0.7', changefreq: 'monthly' },
      { path: '/mutuo', priority: '0.6', changefreq: 'monthly' },
      { path: '/contatti', priority: '0.5', changefreq: 'monthly' },
      { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
      { path: '/termini', priority: '0.2', changefreq: 'yearly' },
      { path: '/cookie', priority: '0.2', changefreq: 'yearly' }
    ];

    const entries = staticPages.map(page => createUrlEntry({
      loc: `${siteUrl}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority
    }));

    annunci
      .filter(isPublicAnnuncio)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .forEach(annuncio => {
        entries.push(createUrlEntry({
          loc: `${siteUrl}/annuncio/${annuncio.slug || annuncio.id}`,
          lastmod: annuncio.updatedAt || annuncio.createdAt,
          changefreq: 'weekly',
          priority: '0.8'
        }));
      });

    users
      .filter(user => user.tipo === 'amministrazione' && !user.blocked && !user.deletedAt)
      .forEach(user => {
        const details = amministrazioni.find(profile => profile.userId === user.id);
        const agency = buildAgencyProfile(user, details, annunci);
        entries.push(createUrlEntry({
          loc: `${siteUrl}/agenzia/${agency.slug}`,
          lastmod: agency.updatedAt || user.updatedAt || user.createdAt,
          changefreq: 'weekly',
          priority: '0.7'
        }));
      });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>',
      ''
    ].join('\n');

    res.type('application/xml').send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).type('text/plain').send('Sitemap non disponibile.');
  }
});

module.exports = router;
