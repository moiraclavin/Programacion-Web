import { studio } from './studio';
import type { Feature, ImageAsset } from './types';

export const home = {
  hero: {
    eyebrow: `Pilates reformer · ${studio.neighborhood}`,
    title: 'Movimiento consciente, a tu ritmo.',
    lead: `Clases de una hora en grupos de hasta ${studio.maxClassSize} personas, con profesoras que te conocen por tu nombre.`,
    image: { src: '/images/home/hero.jpg', alt: 'Alumna haciendo una plancha sobre un reformer en una sala de tonos cálidos' } satisfies ImageAsset,
  },
  intro: {
    eyebrow: 'El estudio',
    title: 'Un espacio chico, a propósito.',
    paragraphs: [
      'Elegimos crecer despacio. Por eso cada clase tiene pocos lugares y cada profesora sigue de cerca la evolución de sus alumnas.',
      'Acá no hay música fuerte ni apuro: hay técnica, respiración y un cuerpo que se va sintiendo mejor semana a semana.',
    ],
    image: { src: '/images/home/intro.jpg', alt: 'Sala con reformers y torres de madera, plantas y luz natural' } satisfies ImageAsset,
  },
  pillars: {
    eyebrow: 'Cómo trabajamos',
    title: 'Tres cosas que no negociamos',
    items: [
      {
        title: 'Grupos reducidos',
        text: `Máximo ${studio.maxClassSize} personas por clase, para que cada corrección llegue a tiempo.`,
      },
      {
        title: 'Profesoras formadas',
        text: 'Todo el equipo tiene formación certificada en pilates y se actualiza cada año.',
      },
      {
        title: 'Tu semana, desde el celular',
        text: `Reservás y cancelás tus clases online, hasta ${studio.cancelWindowHours} horas antes.`,
      },
    ] satisfies Feature[],
  },
  band: {
    caption: 'Luz natural, madera y silencio.',
    image: { src: '/images/home/sala.jpg', alt: 'Alumna estirando sobre un reformer en la sala principal' } satisfies ImageAsset,
  },
};
