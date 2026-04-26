import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { MySchedulePage } from '@/pages/MySchedulePage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { ClockPage } from '@/pages/ClockPage';
import { StatsPage } from '@/pages/StatsPage';
import { ExportPage } from '@/pages/ExportPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminPage } from '@/pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="schedule" element={
              <RequireRole roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <SchedulePage />
              </RequireRole>
            } />
            <Route path="my-schedule" element={<MySchedulePage />} />
            <Route path="employees" element={
              <RequireRole roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <EmployeesPage />
              </RequireRole>
            } />
            <Route path="attendance" element={
              <RequireRole roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <AttendancePage />
              </RequireRole>
            } />
            <Route path="clock" element={<ClockPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="export" element={
              <RequireRole roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <ExportPage />
              </RequireRole>
            } />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={
              <RequireRole roles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminPage />
              </RequireRole>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', background: '#1e293b', color: '#f1f5f9' },
          success: { style: { background: '#16a34a', color: '#fff' } },
          error: { style: { background: '#dc2626', color: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
