import { studio } from './studio';
import type { ImageAsset } from './types';

export interface Space {
  id: string;
  name: string;
  description: string;
  photo: ImageAsset;
}

export const facilities = {
  header: {
    eyebrow: 'El estudio',
    title: 'Instalaciones',
    lead: 'Un espacio luminoso y tranquilo, pensado para que te concentres solo en moverte.',
  },
  spaces: [
    {
      id: 'reformers',
      name: 'Sala de reformers',
      description: `${studio.maxClassSize} reformers de madera, con luz natural y ventilación cruzada. Es donde se dan la mayoría de las clases.`,
      photo: { src: '/images/estudio/reformers.jpg', alt: 'Reformers en tonos crema en la sala principal' },
    },
    {
      id: 'mat',
      name: 'Sala de mat y accesorios',
      description: 'Un espacio más íntimo para clases de mat, trabajo con aros, pelotas y bandas, y sesiones individuales.',
      photo: { src: '/images/estudio/mat.jpg', alt: 'Sala amplia con colchonetas y ventanales' },
    },
    {
      id: 'vestuarios',
      name: 'Vestuarios',
      description: 'Amplios, con duchas y todo lo necesario para que puedas venir antes o después del trabajo.',
      photo: { src: '/images/estudio/vestuarios.jpg', alt: 'Vestuario con paredes de madera, bacha de piedra y toallas' },
    },
  ] satisfies Space[],
  amenities: [
    'Duchas con agua caliente',
    'Lockers con llave',
    'Toallas limpias en cada clase',
    'Agua filtrada y té',
    'Medias antideslizantes a la venta',
    'Bicicletero en la entrada',
  ],
};
