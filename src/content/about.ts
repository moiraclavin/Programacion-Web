import type { Feature, ImageAsset } from './types';

export const about = {
  header: {
    eyebrow: 'Nosotros',
    title: 'Una casa para moverse bien',
    lead: 'Empezamos con dos reformers y una idea simple: que cada persona sepa por qué hace cada ejercicio.',
  },
  story: {
    title: 'Cómo empezó',
    paragraphs: [
      'Casa Pilates nació en 2018 en un living de Palermo. Lucía, kinesióloga y profesora, daba clases a un puñado de alumnas que llegaban por recomendación.',
      'Con los años se sumaron más profesoras, más reformers y una sala propia. Lo que no cambió fue la escala: seguimos siendo un estudio chico, donde la atención es uno a uno aunque la clase sea grupal.',
      'Hoy recibimos a personas de todas las edades y niveles, desde quienes buscan rehabilitar una lesión hasta quienes entrenan para sentirse más fuertes.',
    ],
    image: { src: '/images/nosotros/historia.jpg', alt: 'Alumna en el reformer, entre arcos y estantes con accesorios' } satisfies ImageAsset,
  },
  values: {
    eyebrow: 'Lo que nos guía',
    title: 'Nuestros valores',
    items: [
      {
        title: 'Atención personalizada',
        text: 'Conocemos tu historia, tus lesiones y tus objetivos, y adaptamos cada clase a eso.',
      },
      {
        title: 'Técnica antes que intensidad',
        text: 'Preferimos un movimiento bien hecho a diez repeticiones apuradas.',
      },
      {
        title: 'Un ritmo sostenible',
        text: 'El pilates funciona cuando es parte de tu semana. Te ayudamos a que se vuelva un hábito.',
      },
    ] satisfies Feature[],
  },
};
