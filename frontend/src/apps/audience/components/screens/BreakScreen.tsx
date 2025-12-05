import { motion } from 'framer-motion';
import { Coffee, Cookie, Clock, ArrowRight } from 'lucide-react';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';

interface BreakScreenProps {
  timer: {
    formatted: string;
    progress: number;
    status: string;
  };
}

const PARTNER_LOGOS = [
  { name: 'MCD Edu', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/MCD - White.png' },
  { name: 'UMushroom', logo: '/assets/DATAROOM/SPONSOR LOGOS/1. ORGANISERS  (EVERYWHERE!)/umushroom_white.png' },
];

export function BreakScreen({ timer }: BreakScreenProps) {
  const { state } = useLiveStateStore();
  const stageTitle = state?.currentStage?.title || 'Break Time';
  
  const isRefreshments = stageTitle.toLowerCase().includes('refreshment');
  const isComfort = stageTitle.toLowerCase().includes('comfort');

  const getResumeTime = () => {
    const timerParts = timer.formatted.split(':');
    const minutes = parseInt(timerParts[0] || '0');
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[50%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.08) 50%, rgba(0, 217, 255, 0.05) 100%)',
          }}
        />
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-mcd-500/5 rounded-full blur-[100px]"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Break Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-32 h-32 bg-gradient-to-br from-mcd-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-mcd-500/30"
          >
            {isRefreshments ? (
              <Cookie className="w-16 h-16 text-mcd-400" />
            ) : (
              <Coffee className="w-16 h-16 text-mcd-400" />
            )}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-display text-white mb-3">
            {isRefreshments ? 'REFRESHMENTS BREAK' : isComfort ? 'COMFORT BREAK' : 'BREAK TIME'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isRefreshments 
              ? 'Grab a drink and some snacks' 
              : 'Take a moment to refresh'
            }
          </p>
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-mcd-500/10 border border-mcd-500/30 rounded-2xl mb-4">
            <Clock className="w-6 h-6 text-mcd-400" />
            <span className="text-6xl font-mono font-bold text-mcd-400">
              {timer.formatted}
            </span>
          </div>
          
          <div className="w-80 mx-auto">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-mcd-500 to-cyan-500"
                style={{ width: `${timer.progress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Resume info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 text-muted-foreground mb-16"
        >
          <span>We'll resume at approximately</span>
          <span className="px-3 py-1 bg-mcd-500/20 text-mcd-400 rounded-full font-mono font-bold">
            {getResumeTime()}
          </span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
            Organised by
          </p>
          <div className="flex justify-center items-center gap-8">
            {PARTNER_LOGOS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
                whileHover={{ opacity: 1 }}
                className="h-10 flex items-center justify-center"
              >
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="h-full w-auto object-contain max-w-[120px]"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
