import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { useAssets } from '@/shared/hooks/useAssets';
import { ChevronRight } from 'lucide-react';

export function TransitionScreen() {
  const { state } = useLiveStateStore();
  const { teams } = useAssets();
  const [countdown, setCountdown] = useState(5);

  const nextTeam = state?.currentTeam;
  const roundNumber = state?.roundState?.currentRound || 1;

  // Get team assets from manifest
  const teamAssets = teams.find(t => 
    t.name.toLowerCase() === nextTeam?.name?.toLowerCase() ||
    t.university.toLowerCase() === nextTeam?.university?.toLowerCase()
  );

  // Auto countdown (visual only - operator controls actual transition)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient sweep */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 85, 254, 0.2) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Moving lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-mcd-500/30 to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              width: '100%',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
        {/* "Next Up" Label */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 bg-mcd-500/20 border border-mcd-500/40 rounded-full"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-3 h-3 bg-mcd-500 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-lg font-medium text-mcd-400 uppercase tracking-widest">
              Next Up
            </span>
            <ChevronRight className="w-5 h-5 text-mcd-400" />
          </motion.div>
        </motion.div>

        {/* Team Logo/Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
          className="mb-8"
        >
          <div className="relative inline-block">
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-mcd-500/30 to-cyan-500/30 blur-2xl"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Logo container */}
            <div className="relative w-40 h-40 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-mcd-500/30">
              {teamAssets?.logo ? (
                <img 
                  src={teamAssets.logo} 
                  alt={nextTeam?.name} 
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <span className="text-7xl font-bold text-white">
                  {nextTeam?.name?.charAt(0) || teamAssets?.logoPlaceholder || '?'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Team Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-6xl md:text-7xl font-display tracking-wider mb-4"
        >
          <span className="text-gradient">{nextTeam?.name || 'Team'}</span>
        </motion.h1>

        {/* University */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-2xl text-muted-foreground mb-8"
        >
          {nextTeam?.university || teamAssets?.university || 'University'}
        </motion.p>

        {/* Round Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
        >
          <span className="text-sm text-muted-foreground">Round {roundNumber}</span>
        </motion.div>

        {/* Countdown indicator (subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <div className="flex justify-center gap-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <motion.div
                key={n}
                className={`w-2 h-2 rounded-full ${
                  countdown >= n ? 'bg-mcd-500' : 'bg-white/20'
                }`}
                animate={countdown === n ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-sm text-muted-foreground">UK Investment Competition • Grand Finale</p>
      </motion.div>
    </div>
  );
}

