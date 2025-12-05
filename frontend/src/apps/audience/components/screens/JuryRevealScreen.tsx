import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { CardRevealAnimation } from '@/shared/components/animations/CardRevealAnimation';
import type { PersonProfile } from '@/shared/types';

export function JuryRevealScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const [juryMembers, setJuryMembers] = useState<PersonProfile[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const animationStep = state?.animationState?.step || 0;

  useEffect(() => {
    const loadJury = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        const jury = (data.profiles || []).filter(
          (p: PersonProfile) => p.profileType === 'JURY'
        );
        setJuryMembers(jury);
      } catch (error) {
        console.error('Failed to load jury:', error);
      }
    };
    if (eventId) loadJury();
  }, [eventId]);

  useEffect(() => {
    if (animationStep > 0 && animationStep <= juryMembers.length) {
      const juryToReveal = juryMembers[animationStep - 1];
      if (juryToReveal && !revealedIds.has(juryToReveal.id)) {
        setCurrentRevealIndex(animationStep - 1);
        setRevealedIds((prev) => new Set([...prev, juryToReveal.id]));
      }
    }
  }, [animationStep, juryMembers]);

  const currentJury = currentRevealIndex >= 0 ? juryMembers[currentRevealIndex] : null;

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.12) 50%, rgba(0, 217, 255, 0.08) 100%)',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mcd-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 h-screen flex flex-col p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-display tracking-wider mb-2">
            <span className="text-gradient">MEET THE JURY</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            {revealedIds.size} of {juryMembers.length} revealed
          </p>
        </motion.div>

        {/* Main reveal area */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentJury ? (
              <motion.div
                key={currentJury.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <CardRevealAnimation
                  isRevealed={revealedIds.has(currentJury.id)}
                  className="mb-8"
                >
                  {/* Jury Card */}
                  <div className="w-80 bg-navy-800/80 backdrop-blur-xl border border-mcd-500/30 rounded-2xl p-6 shadow-2xl">
                    {/* Photo */}
                    <div className="w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-mcd-500 to-cyan-500 shadow-lg shadow-mcd-500/30">
                      {currentJury.photoUrl ? (
                        <img
                          src={currentJury.photoUrl}
                          alt={currentJury.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
                          {currentJury.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-2xl font-bold mb-2"
                    >
                      {currentJury.name}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="text-mcd-400 font-medium mb-1"
                    >
                      {currentJury.role}
                    </motion.p>
                    {currentJury.company && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-muted-foreground"
                      >
                        {currentJury.company}
                      </motion.p>
                    )}
                    {currentJury.bioShort && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-sm text-muted-foreground mt-4 italic"
                      >
                        "{currentJury.bioShort}"
                      </motion.p>
                    )}
                  </div>
                </CardRevealAnimation>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="w-80 aspect-[3/4] bg-gradient-to-br from-mcd-500/20 to-cyan-500/20 rounded-2xl border-2 border-dashed border-mcd-500/30 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🎭</span>
                    <p className="text-xl text-muted-foreground">
                      Waiting for reveal...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Revealed jury summary */}
        {revealedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex justify-center gap-4 flex-wrap">
              {juryMembers.map((jury) => {
                const isRevealed = revealedIds.has(jury.id);
                const isCurrent = jury.id === currentJury?.id;
                
                return (
                  <motion.div
                    key={jury.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: isRevealed ? 1 : 0.3, 
                      scale: isCurrent ? 1.1 : 1 
                    }}
                    transition={{ delay: isRevealed ? 0.5 : 0 }}
                    className={`relative ${isCurrent ? 'ring-2 ring-mcd-500 ring-offset-2 ring-offset-navy-950' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-full overflow-hidden ${
                      isRevealed 
                        ? 'bg-gradient-to-br from-mcd-500 to-cyan-500' 
                        : 'bg-secondary'
                    }`}>
                      {isRevealed && jury.photoUrl ? (
                        <img
                          src={jury.photoUrl}
                          alt={jury.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isRevealed ? (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                          {jury.name.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          ?
                        </div>
                      )}
                    </div>
                    {isRevealed && (
                      <p className="text-xs text-center mt-1 text-muted-foreground truncate max-w-[80px]">
                        {jury.name.split(' ')[0]}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
