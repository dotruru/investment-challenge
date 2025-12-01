import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Quote } from 'lucide-react';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import type { PersonProfile } from '@/shared/types';

export function KeynoteScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const [speakers, setSpeakers] = useState<PersonProfile[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<PersonProfile | null>(null);

  // Get keynote configuration from current stage
  const keynoteConfig = state?.currentStage?.configuration as any;
  const speakerIndex = keynoteConfig?.speakerIndex || 0;

  useEffect(() => {
    const loadSpeakers = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        const speakerProfiles = (data.profiles || []).filter(
          (p: PersonProfile) => p.profileType === 'SPEAKER'
        );
        setSpeakers(speakerProfiles);
        if (speakerProfiles[speakerIndex]) {
          setCurrentSpeaker(speakerProfiles[speakerIndex]);
        }
      } catch (error) {
        console.error('Failed to load speakers:', error);
      }
    };
    if (eventId) loadSpeakers();
  }, [eventId, speakerIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Spotlight effect */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gold-500/5 blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {currentSpeaker ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-5xl w-full"
          >
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Speaker Photo */}
              <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative"
              >
                {/* Decorative ring */}
                <motion.div
                  className="absolute -inset-4 rounded-full border-2 border-gold-500/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-gold-500/10"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                />
                
                {/* Photo container */}
                <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-gold-500/50 shadow-2xl shadow-gold-500/20">
                  {currentSpeaker.photoUrl ? (
                    <img
                      src={currentSpeaker.photoUrl}
                      alt={currentSpeaker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                      <span className="text-7xl font-bold text-navy-950">
                        {currentSpeaker.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Shine overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%', y: '-100%' }}
                    animate={{ x: '100%', y: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                </div>

                {/* Microphone badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg"
                >
                  <Mic className="w-8 h-8 text-navy-950" />
                </motion.div>
              </motion.div>

              {/* Speaker Info */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex-1 text-center md:text-left"
              >
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 rounded-full mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                  <span className="text-sm font-medium text-gold-400 uppercase tracking-wider">
                    Keynote Speaker
                  </span>
                </motion.div>

                {/* Name */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-5xl md:text-6xl font-bold mb-4"
                >
                  {currentSpeaker.name}
                </motion.h1>

                {/* Title & Company */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-6"
                >
                  <p className="text-2xl text-gold-400 font-medium">{currentSpeaker.role}</p>
                  {currentSpeaker.company && (
                    <p className="text-xl text-muted-foreground">{currentSpeaker.company}</p>
                  )}
                </motion.div>

                {/* Bio */}
                {currentSpeaker.bioShort && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="relative"
                  >
                    <Quote className="absolute -left-8 -top-2 w-6 h-6 text-gold-500/30" />
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl italic">
                      {currentSpeaker.bioShort}
                    </p>
                  </motion.div>
                )}

                {/* Decorative line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="mt-8 h-1 bg-gradient-to-r from-gold-500 via-gold-400 to-transparent origin-left max-w-xs"
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Loading/empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-gold-500/30 border-t-gold-500"
            />
            <h2 className="text-2xl font-bold text-muted-foreground">
              Keynote Starting Soon...
            </h2>
          </motion.div>
        )}
      </div>

      {/* Stage title at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-lg text-muted-foreground">
          {state?.currentStage?.title || 'Keynote Session'}
        </p>
      </motion.div>
    </div>
  );
}

