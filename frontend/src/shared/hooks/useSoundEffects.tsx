import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'reveal' | 'shuffle' | 'victory' | 'buzzer' | 'tick' | 'start' | 'complete';

interface SoundConfig {
  url: string;
  volume?: number;
}

// Sound URLs - Using Web Audio API to generate sounds programmatically
// In production, replace with actual MP3/WAV files
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  reveal: { url: '', volume: 0.7 },     // Dramatic reveal
  shuffle: { url: '', volume: 0.5 },    // Card shuffling
  victory: { url: '', volume: 0.8 },    // Winner celebration
  buzzer: { url: '', volume: 0.9 },     // Timer end
  tick: { url: '', volume: 0.3 },       // Timer tick
  start: { url: '', volume: 0.5 },      // Timer start
  complete: { url: '', volume: 0.6 },   // Action complete
};

export function useSoundEffects(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && enabled) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled]);

  // Generate a synthesized sound
  const generateSound = useCallback((type: SoundType, options?: { duration?: number; frequency?: number }) => {
    if (!enabled || !audioContextRef.current || !gainNodeRef.current) return;

    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();

    oscillator.connect(envelope);
    envelope.connect(gainNode);

    const volume = SOUND_CONFIGS[type]?.volume || 0.5;
    gainNode.gain.setValueAtTime(volume, now);

    switch (type) {
      case 'reveal':
        // Dramatic ascending tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        
        // Add shimmer
        setTimeout(() => {
          if (!audioContextRef.current) return;
          const shimmer = audioContextRef.current.createOscillator();
          const shimmerEnv = audioContextRef.current.createGain();
          shimmer.connect(shimmerEnv);
          shimmerEnv.connect(gainNode);
          shimmer.type = 'triangle';
          shimmer.frequency.setValueAtTime(1200, audioContextRef.current.currentTime);
          shimmerEnv.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          shimmerEnv.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
          shimmer.start(audioContextRef.current.currentTime);
          shimmer.stop(audioContextRef.current.currentTime + 0.3);
        }, 100);
        break;

      case 'shuffle':
        // Quick shuffling sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        envelope.gain.setValueAtTime(0.2, now);
        for (let i = 0; i < 6; i++) {
          envelope.gain.setValueAtTime(0.2, now + i * 0.08);
          envelope.gain.setValueAtTime(0.05, now + i * 0.08 + 0.04);
        }
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'victory':
        // Triumphant fanfare
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523, now); // C5
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.8, now + 0.1);
        envelope.gain.setValueAtTime(0.8, now + 0.2);
        oscillator.frequency.setValueAtTime(659, now + 0.2); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.4); // G5
        oscillator.frequency.setValueAtTime(1047, now + 0.6); // C6
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        oscillator.start(now);
        oscillator.stop(now + 1.2);
        break;

      case 'buzzer':
        // End buzzer
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, now);
        envelope.gain.setValueAtTime(0.6, now);
        envelope.gain.setValueAtTime(0.6, now + 0.3);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;

      case 'tick':
        // Subtle tick
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        envelope.gain.setValueAtTime(0.1, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'start':
        // Start beep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        envelope.gain.setValueAtTime(0.4, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'complete':
        // Completion chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        envelope.gain.setValueAtTime(0.3, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
    }
  }, [enabled]);

  const play = useCallback((type: SoundType) => {
    // Resume audio context if suspended (required for autoplay policies)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    generateSound(type);
  }, [generateSound]);

  return { play, enabled };
}

// Audio Manager Component for global sound control
import { createContext, useContext, useState, ReactNode } from 'react';

interface SoundContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  play: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const { play } = useSoundEffects(enabled);

  return (
    <SoundContext.Provider value={{ enabled, setEnabled, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a no-op if used outside provider
    return {
      enabled: false,
      setEnabled: () => {},
      play: () => {},
    };
  }
  return context;
}

