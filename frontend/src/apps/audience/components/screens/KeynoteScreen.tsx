import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Quote } from 'lucide-react';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { useAssets } from '@/shared/hooks/useAssets';
import type { PersonProfile } from '@/shared/types';

export function KeynoteScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const { speakers: assetSpeakers } = useAssets();
  const [dbSpeakers, setDbSpeakers] = useState<PersonProfile[]>([]);

  const keynoteConfig = state?.currentStage?.configuration as any;
  const stageTitle = state?.currentStage?.title || '';
  const stageId = state?.currentStage?.id;
  
  // Determine speaker index from config, stage title, or default - recalculate when stage changes
  const speakerIndex = useMemo(() => {
    // 1. Explicit speakerIndex in config (check it's a valid number, not empty object)
    if (typeof keynoteConfig?.speakerIndex === 'number') {
      console.log('Using config speakerIndex:', keynoteConfig.speakerIndex);
      return keynoteConfig.speakerIndex;
    }
    
    // 2. Explicit speakerId in config - find matching index
    if (keynoteConfig?.speakerId && assetSpeakers.length > 0) {
      const idx = assetSpeakers.findIndex(s => s.id === keynoteConfig.speakerId);
      if (idx >= 0) {
        console.log('Using config speakerId:', keynoteConfig.speakerId, '-> index', idx);
        return idx;
      }
    }
    
    // 3. Parse from stage title (e.g., "Keynote 1", "Keynote 2", "Keynote1", "keynote 2")
    const match = stageTitle.match(/keynote\s*(\d+)/i);
    if (match) {
      const idx = parseInt(match[1], 10) - 1; // Convert to 0-based index
      console.log('Parsed from title:', stageTitle, '-> speaker index', idx);
      return idx;
    }
    
    // 4. Try to extract number from anywhere in title
    const numMatch = stageTitle.match(/(\d+)/);
    if (numMatch && stageTitle.toLowerCase().includes('keynote')) {
      const idx = parseInt(numMatch[1], 10) - 1;
      console.log('Extracted number from title:', stageTitle, '-> speaker index', idx);
      return idx;
    }
    
    // 5. Default to first speaker
    console.log('Defaulting to speaker 0 for title:', stageTitle);
    return 0;
  }, [keynoteConfig, stageTitle, stageId, assetSpeakers]);

  // Get current speaker based on index
  const currentSpeaker = useMemo(() => {
    if (assetSpeakers.length > 0 && assetSpeakers[speakerIndex]) {
      console.log('Showing speaker:', assetSpeakers[speakerIndex].name, 'at index', speakerIndex);
      return assetSpeakers[speakerIndex];
    }
    if (dbSpeakers[speakerIndex]) {
      return dbSpeakers[speakerIndex];
    }
    return null;
  }, [assetSpeakers, dbSpeakers, speakerIndex]);

  useEffect(() => {
    const loadSpeakers = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        const speakerProfiles = (data.profiles || []).filter(
          (p: PersonProfile) => p.profileType === 'SPEAKER'
        );
        setDbSpeakers(speakerProfiles);
      } catch (error) {
        console.error('Failed to load speakers:', error);
      }
    };
    if (eventId) loadSpeakers();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Blue gradient sweep */}
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.15) 50%, rgba(0, 217, 255, 0.1) 100%)',
          }}
        />
        
        {/* Spotlight effect */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(0, 85, 254, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-mcd-500/5 blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]"
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
                  className="absolute -inset-4 rounded-full border-2 border-mcd-500/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-mcd-500/10"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                />
                
                {/* Photo container */}
                <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-mcd-500/50 shadow-2xl shadow-mcd-500/20">
                  {(currentSpeaker.photo || currentSpeaker.photoUrl) ? (
                    <img
                      src={currentSpeaker.photo || currentSpeaker.photoUrl}
                      alt={currentSpeaker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-mcd-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-7xl font-bold text-white">
                        {currentSpeaker.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                </div>

                {/* Microphone badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-mcd-500 to-cyan-500 flex items-center justify-center shadow-lg"
                >
                  <Mic className="w-8 h-8 text-white" />
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-mcd-500/10 border border-mcd-500/30 rounded-full mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-mcd-500 animate-pulse" />
                  <span className="text-sm font-medium text-mcd-400 uppercase tracking-wider">
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
                  <p className="text-2xl text-mcd-400 font-medium">{currentSpeaker.role}</p>
                  {currentSpeaker.company && (
                    <p className="text-xl text-muted-foreground">{currentSpeaker.company}</p>
                  )}
                </motion.div>

                {/* Bio */}
                {(currentSpeaker.bio || currentSpeaker.bioShort) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="relative"
                  >
                    <Quote className="absolute -left-8 -top-2 w-6 h-6 text-mcd-500/30" />
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl italic">
                      {currentSpeaker.bio || currentSpeaker.bioShort}
                    </p>
                  </motion.div>
                )}

                {/* Decorative line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="mt-8 h-1 bg-gradient-to-r from-mcd-500 via-cyan-500 to-transparent origin-left max-w-xs"
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-mcd-500/30 border-t-mcd-500"
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
