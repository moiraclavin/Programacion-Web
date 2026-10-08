import { createBrowserRouter, type RouteObject } from 'react-router';
import { AdminLayout } from '../components/layout/AdminLayout';
import { PublicLayout } from '../components/layout/PublicLayout';
import { UiShowcase } from '../dev/UiShowcase';
import { RequireAuth } from '../features/auth/RequireAuth';
import { RequireStaff } from '../features/auth/RequireStaff';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SetPasswordPage } from '../pages/auth/SetPasswordPage';
import { AdminAgendaPage } from '../pages/admin/AdminAgendaPage';
import { AdminSchedulePage } from '../pages/admin/AdminSchedulePage';
import { AdminSessionPage } from '../pages/admin/AdminSessionPage';
import { AdminStudentPage } from '../pages/admin/AdminStudentPage';
import { AdminStudentsPage } from '../pages/admin/AdminStudentsPage';
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
      {
        // Panel: solo admin y profesoras.
        element: <RequireStaff />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminAgendaPage /> },
              { path: 'clases/:id', element: <AdminSessionPage /> },
              { path: 'horarios', element: <AdminSchedulePage /> },
              { path: 'alumnas', element: <AdminStudentsPage /> },
              { path: 'alumnas/:id', element: <AdminStudentPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  ...devRoutes,
]);
