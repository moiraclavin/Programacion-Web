// Datos generales del estudio. TODO: reemplazar los valores de ejemplo por los reales.

export const studio = {
  name: 'Casa Pilates',
  tagline: 'Pilates reformer en grupos reducidos',
  neighborhood: 'Palermo',
  maxClassSize: 8,
  maxClassesPerWeek: 3,
  cancelWindowHours: 12,
  contact: {
    address: 'Gorriti 4800, Palermo, CABA',
    mapQuery: 'Gorriti 4800, Palermo, Buenos Aires',
    /** Formato internacional sin "+" ni espacios, para wa.me */
    whatsapp: '5491100000000',
    whatsappDisplay: '+54 9 11 0000-0000',
    email: 'hola@casapilates.com.ar',
    instagram: 'casapilates',
  },
  hours: [
    { days: 'Lunes a viernes', time: '7:00 – 21:00' },
    { days: 'Sábados', time: '9:00 – 13:00' },
  ],
};

export const publicNav = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/profesoras', label: 'Profesoras' },
  { to: '/estudio', label: 'Estudio' },
  { to: '/contacto', label: 'Contacto' },
];
