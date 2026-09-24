import { studio } from '../content/studio';

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${studio.contact.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const instagramUrl = `https://instagram.com/${studio.contact.instagram}`;

export const emailUrl = `mailto:${studio.contact.email}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.contact.mapQuery)}`;

/** Embed de Google Maps que no requiere API key. */
export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(studio.contact.mapQuery)}&output=embed`;

export const FIRST_CLASS_MESSAGE = '¡Hola! Quiero coordinar una primera clase en el estudio.';
