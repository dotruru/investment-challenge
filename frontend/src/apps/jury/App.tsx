import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { JuryLoginPage } from './pages/JuryLoginPage';
import { JuryScoringPage } from './pages/JuryScoringPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userType } = useAuthStore();
  
  if (!isAuthenticated || userType !== 'jury') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<JuryLoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <JuryScoringPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

