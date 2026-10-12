import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
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
import { AccountPage } from '../pages/student/AccountPage';
import { MyClassesPage } from '../pages/student/MyClassesPage';
import { PaymentsPage } from '../pages/student/PaymentsPage';
import { ReservePage } from '../pages/student/ReservePage';
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
        children: [
          {
            path: 'app',
            element: <StudentLayout />,
            children: [
              { index: true, element: <Navigate to="reservar" replace /> },
              { path: 'reservar', element: <ReservePage /> },
              { path: 'mis-clases', element: <MyClassesPage /> },
              { path: 'pagos', element: <PaymentsPage /> },
              { path: 'cuenta', element: <AccountPage /> },
            ],
          },
        ],
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
