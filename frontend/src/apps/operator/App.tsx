import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OperatorControlPanel } from './pages/OperatorControlPanel';
import { motion } from 'framer-motion';
import { authApi, api } from '@/shared/api/client';

function OperatorLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.loginOperator(pin);
      api.setToken(response.accessToken);
      localStorage.setItem('operator_authenticated', 'true');
      localStorage.setItem('refreshToken', response.refreshToken);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mcd-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="bg-navy-800/80 backdrop-blur-xl rounded-2xl border border-mcd-500/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              OPERATOR PANEL
            </h1>
            <p className="text-muted-foreground">Enter PIN to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm text-center">
                {error}
              </div>
            )}

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={10}
              className="w-full text-center text-4xl tracking-[0.5em] px-4 py-6 bg-navy-900 border border-mcd-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-mcd-500/50 focus:border-mcd-500"
              placeholder="••••••"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-mcd-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function EventSelector({ onSelect, storedEventId }: { onSelect: (eventId: string) => void; storedEventId?: string | null }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidStoredEvent, setInvalidStoredEvent] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
    fetch(`${apiUrl}/events`)
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
        
        // Check if stored event ID is still valid
        if (storedEventId) {
          const eventExists = data.some((e: any) => e.id === storedEventId);
          if (eventExists) {
            onSelect(storedEventId);
            return;
          } else {
            // Clear invalid stored event
            localStorage.removeItem('operator_event_id');
            setInvalidStoredEvent(true);
          }
        }
        
        // Auto-select if only one event
        if (data.length === 1) {
          onSelect(data[0].id);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-xl text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gradient">Select Event</h1>
        {invalidStoredEvent && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-center">
            Previous event session expired. Please select an event.
          </div>
        )}
        <div className="grid gap-4">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => onSelect(event.id)}
              className="p-6 bg-navy-800/80 border border-mcd-500/20 rounded-xl hover:border-mcd-500/50 transition-all text-left"
            >
              <h2 className="text-xl font-bold mb-2">{event.name}</h2>
              <p className="text-muted-foreground">{event.venue}</p>
            </button>
          ))}
          {events.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No events found. Please create an event first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('operator_authenticated') === 'true';
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventValidated, setEventValidated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleSelectEvent = (eventId: string) => {
    localStorage.setItem('operator_event_id', eventId);
    setSelectedEventId(eventId);
    setEventValidated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('operator_authenticated');
    localStorage.removeItem('operator_event_id');
    localStorage.removeItem('refreshToken');
    api.setToken(null);
    setIsAuthenticated(false);
    setSelectedEventId(null);
    setEventValidated(false);
  };

  if (!isAuthenticated) {
    return <OperatorLogin onLogin={handleLogin} />;
  }

  // Always validate through EventSelector - will check stored ID automatically
  if (!selectedEventId || !eventValidated) {
    const storedId = localStorage.getItem('operator_event_id');
    return <EventSelector onSelect={handleSelectEvent} storedEventId={storedId} />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route 
          path="*" 
          element={<OperatorControlPanel eventId={selectedEventId} onLogout={handleLogout} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
