import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/shared/stores/authStore';
import { Button } from '@/shared/components/ui/button';

export function JuryLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { loginJury } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginJury(accessCode.toUpperCase());
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid access code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-8">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display text-gradient tracking-wider">
              UK INVESTMENT CHALLENGE
            </h1>
            <p className="text-muted-foreground mt-2">Jury Scoring Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full px-4 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="XXXXXXXX"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the access code provided to you
              </p>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isLoading || accessCode.length < 6}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Enter Scoring Portal'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

