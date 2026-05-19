// Utility per SEO

export function generateSlug(titolo: string, id: string): string {
  const slugified = titolo
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Rimuovi caratteri speciali
    .replace(/\s+/g, '-') // Sostituisci spazi con -
    .replace(/-+/g, '-') // Rimuovi - multipli
    .substring(0, 60); // Max 60 caratteri
  
  return `${slugified}-${id}`;
}

export function extractIdFromSlug(slug: string): string {
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

export function generateMetaDescription(annuncio: {
  titolo: string;
  categoria: string;
  citta: string;
  superficie: number;
  camere: number;
  prezzo: number;
  tipo: string;
}): string {
  const tipoText = annuncio.tipo === 'vendita' ? 'In vendita' : 'In affitto';
  return `${tipoText}: ${annuncio.titolo} a ${annuncio.citta}. ${annuncio.superficie}m², ${annuncio.camere} camere. Prezzo: €${annuncio.prezzo.toLocaleString()}. Scopri di più su CasaVista!`;
}

export function generateMetaTitle(annuncio: {
  titolo: string;
  citta: string;
  tipo: string;
}): string {
  const tipoText = annuncio.tipo === 'vendita' ? 'Vendita' : 'Affitto';
  return `${annuncio.titolo} - ${tipoText} a ${annuncio.citta} | CasaVista`;
}

// Componente SEO dinamico
import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({ 
  title = 'CasaVista - Annunci Immobiliari Gratuiti', 
  description = 'Trova la casa dei tuoi sogni su CasaVista. Migliaia di annunci immobiliari gratuiti di case e appartamenti in vendita e in affitto.',
  image = 'https://casavista.it/og-image.jpg',
  url = 'https://casavista.it',
  type = 'website'
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;
    
    // Meta tags
    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    metaTags.forEach(({ name, property, content }) => {
      let meta = document.querySelector(`meta[${name ? 'name' : 'property'}="${name || property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    return () => {
      // Cleanup opzionale
    };
  }, [title, description, image, url, type]);

  return null;
}
