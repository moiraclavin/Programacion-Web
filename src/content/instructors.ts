import type { ImageAsset } from './types';

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  credentials: string;
  photo: ImageAsset;
}

// TODO: reemplazar por el equipo real.
export const instructors: Instructor[] = [
  {
    id: 'lucia',
    name: 'Lucía Fernández',
    specialty: 'Reformer y rehabilitación',
    bio: 'Fundadora del estudio. Combina su formación en kinesiología con el pilates para acompañar procesos de recuperación de lesiones.',
    credentials: 'Lic. en Kinesiología · 12 años de experiencia',
    photo: { src: '/images/profesoras/lucia.jpg', alt: 'Ejercicio de rodillas en el reformer con correas' },
  },
  {
    id: 'martina',
    name: 'Martina Sosa',
    specialty: 'Pilates prenatal y posparto',
    bio: 'Acompaña a mujeres durante el embarazo y después del parto, con foco en suelo pélvico, respiración y fuerza del centro.',
    credentials: 'Formación en pilates perinatal · 8 años de experiencia',
    photo: { src: '/images/profesoras/martina.jpg', alt: 'Ejercicio de piernas con correas, recostada en el reformer' },
  },
  {
    id: 'carolina',
    name: 'Carolina Ruiz',
    specialty: 'Reformer intermedio y avanzado',
    bio: 'Exbailarina. Sus clases son dinámicas y exigentes, con mucho trabajo de control, equilibrio y movilidad.',
    credentials: 'Profesora de danza contemporánea · 6 años de experiencia',
    photo: { src: '/images/profesoras/carolina.jpg', alt: 'Alumna con una pierna extendida hacia arriba sobre el reformer' },
  },
];
