import { createBrowserRouter, type RouteObject } from 'react-router';
import { PublicLayout } from '../components/layout/PublicLayout';
import { UiShowcase } from '../dev/UiShowcase';
import { LoginPage } from '../pages/auth/LoginPage';
import { AboutPage } from '../pages/public/AboutPage';
import { ContactPage } from '../pages/public/ContactPage';
import { HomePage } from '../pages/public/HomePage';
import { InstructorsPage } from '../pages/public/InstructorsPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { StudioPage } from '../pages/public/StudioPage';

// Solo en desarrollo: catálogo de componentes en /dev/ui
const devRoutes: RouteObject[] = import.meta.env.DEV ? [{ path: '/dev/ui', element: <UiShowcase /> }] : [];

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'nosotros', element: <AboutPage /> },
      { path: 'profesoras', element: <InstructorsPage /> },
      { path: 'estudio', element: <StudioPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'ingresar', element: <LoginPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  ...devRoutes,
]);
