import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AudienceScreen } from './pages/AudienceScreen';

// Access code for audience - change this before deployment
const AUDIENCE_ACCESS_CODE = import.meta.env.VITE_AUDIENCE_CODE || 'FINALE2025';

function AudienceGate({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('audience_authorized') === 'true';
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Debug: log what we're comparing
    console.log('Entered code:', code, 'Expected:', AUDIENCE_ACCESS_CODE);
    
    const enteredCode = code.trim().toUpperCase();
    const expectedCode = AUDIENCE_ACCESS_CODE.trim().toUpperCase();
    
    if (enteredCode === expectedCode) {
      sessionStorage.setItem('audience_authorized', 'true');
      setIsAuthorized(true);
    } else {
      setError('Invalid access code');
      setCode('');
    }
    setLoading(false);
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8"
      >
        <div className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-gold-500/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              UK INVESTMENT CHALLENGE
            </h1>
            <p className="text-muted-foreground">Enter access code to view live screen</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm text-center">
                {error}
              </div>
            )}

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center text-2xl tracking-widest px-4 py-4 bg-navy-900 border border-gold-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 uppercase"
              placeholder="ACCESS CODE"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enter Event'}
            </button>
            
            <p className="text-xs text-center text-muted-foreground">
              Contact event organizer for access code
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AudienceGate>
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
      </AudienceGate>
    </BrowserRouter>
  );
}

