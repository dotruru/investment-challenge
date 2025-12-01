import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AudienceScreen } from './pages/AudienceScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/event/:eventId" element={<AudienceScreen />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-navy-950">
            <div className="text-center">
              <h1 className="text-4xl font-display text-gradient mb-4">UK INVESTMENT CHALLENGE</h1>
              <p className="text-muted-foreground">Navigate to /event/:eventId to view the live screen</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

