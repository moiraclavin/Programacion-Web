import { createBrowserRouter, type RouteObject } from 'react-router';
import { PublicLayout } from '../components/layout/PublicLayout';
import { UiShowcase } from '../dev/UiShowcase';
import { RequireAuth } from '../features/auth/RequireAuth';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SetPasswordPage } from '../pages/auth/SetPasswordPage';
import { StudentHomePage } from '../pages/student/StudentHomePage';
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
      { path: 'recuperar', element: <ForgotPasswordPage /> },
      { path: 'crear-contrasena', element: <SetPasswordPage /> },
      {
        // Área de alumnas: solo con sesión iniciada.
        element: <RequireAuth />,
        children: [{ path: 'app', element: <StudentHomePage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  ...devRoutes,
]);
