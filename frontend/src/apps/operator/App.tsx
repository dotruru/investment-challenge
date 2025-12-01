import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { OperatorControlPanel } from './pages/OperatorControlPanel';
import { LoginPage } from '../admin/pages/LoginPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userType } = useAuthStore();
  
  if (!isAuthenticated || (userType !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/event/:eventId"
          element={
            <ProtectedRoute>
              <OperatorControlPanel />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

