import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardRevealAnimationProps {
  isRevealed: boolean;
  onRevealComplete?: () => void;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

// FIFA Pack Opening style card reveal
export function CardRevealAnimation({
  isRevealed,
  onRevealComplete,
  children,
  delay = 0,
  className = '',
}: CardRevealAnimationProps) {
  const [showGlow, setShowGlow] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isRevealed) {
      const glowTimer = setTimeout(() => setShowGlow(true), delay);
      const particleTimer = setTimeout(() => setShowParticles(true), delay + 200);
      const completeTimer = setTimeout(() => {
        onRevealComplete?.();
      }, delay + 1500);

      return () => {
        clearTimeout(glowTimer);
        clearTimeout(particleTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isRevealed, delay, onRevealComplete]);

  return (
    <div className={`relative perspective-1000 ${className}`}>
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          // Mystery Card (Face Down)
          <motion.div
            key="hidden"
            className="relative"
            initial={{ rotateY: 0, scale: 0.9 }}
            animate={{
              rotateY: [0, 3, -3, 0],
              scale: [0.9, 1.02, 0.98, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            exit={{
              rotateY: 90,
              scale: 1.1,
              transition: { duration: 0.3 },
            }}
          >
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 rounded-2xl shadow-2xl overflow-hidden">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              
              {/* Question mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl font-bold text-navy-950/30">?</span>
              </div>
              
              {/* Border glow */}
              <div className="absolute inset-0 border-4 border-white/20 rounded-2xl" />
            </div>
          </motion.div>
        ) : (
          // Revealed Card (Face Up)
          <motion.div
            key="revealed"
            className="relative"
            initial={{ rotateY: -90, scale: 1.1 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: delay / 1000,
            }}
          >
            {/* Background glow */}
            <AnimatePresence>
              {showGlow && (
                <motion.div
                  className="absolute -inset-8 bg-gradient-radial from-gold-400/50 via-gold-500/20 to-transparent rounded-full blur-2xl"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>

            {/* Particle effects */}
            <AnimatePresence>
              {showParticles && (
                <>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gold-400 rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: (Math.random() - 0.5) * 300,
                        y: (Math.random() - 0.5) * 300,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: Math.random() * 0.2,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* The actual card content */}
            <motion.div
              initial={{ filter: 'brightness(2)' }}
              animate={{ filter: 'brightness(1)' }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Team Shuffle Animation (for round randomization)
interface ShuffleAnimationProps {
  items: Array<{ id: string; content: React.ReactNode }>;
  isShuffling: boolean;
  finalOrder?: string[];
  onShuffleComplete?: () => void;
}

export function ShuffleAnimation({
  items,
  isShuffling,
  finalOrder,
  onShuffleComplete,
}: ShuffleAnimationProps) {
  const [displayOrder, setDisplayOrder] = useState<string[]>(items.map((i) => i.id));
  const [shuffleStep, setShuffleStep] = useState(0);

  useEffect(() => {
    if (isShuffling) {
      // Perform several random shuffles for effect
      const shuffleCount = 8;
      let step = 0;

      const interval = setInterval(() => {
        if (step < shuffleCount) {
          // Random shuffle
          const shuffled = [...displayOrder].sort(() => Math.random() - 0.5);
          setDisplayOrder(shuffled);
          setShuffleStep(step);
          step++;
        } else {
          // Final order
          if (finalOrder) {
            setDisplayOrder(finalOrder);
          }
          clearInterval(interval);
          setTimeout(() => {
            onShuffleComplete?.();
          }, 500);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isShuffling, finalOrder]);

  return (
    <div className="grid grid-cols-5 gap-4">
      {displayOrder.map((id, index) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;

        return (
          <motion.div
            key={id}
            layout
            layoutId={id}
            initial={false}
            animate={{
              scale: isShuffling ? [1, 0.95, 1] : 1,
              rotate: isShuffling ? [0, (index % 2 === 0 ? 3 : -3), 0] : 0,
            }}
            transition={{
              layout: {
                type: 'spring',
                stiffness: 350,
                damping: 25,
              },
              scale: { duration: 0.15 },
              rotate: { duration: 0.15 },
            }}
          >
            {item.content}
          </motion.div>
        );
      })}
    </div>
  );
}

// Podium Reveal Animation (for awards)
interface PodiumRevealProps {
  first?: React.ReactNode;
  second?: React.ReactNode;
  third?: React.ReactNode;
  revealStep: number; // 0: none, 1: 3rd, 2: 2nd, 3: 1st
  onStepComplete?: (step: number) => void;
}

export function PodiumRevealAnimation({
  first,
  second,
  third,
  revealStep,
  onStepComplete,
}: PodiumRevealProps) {
  return (
    <div className="flex items-end justify-center gap-8 h-[500px]">
      {/* 2nd Place - Left */}
      <div className="flex flex-col items-center">
        <AnimatePresence>
          {revealStep >= 2 && second && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              onAnimationComplete={() => onStepComplete?.(2)}
              className="mb-4"
            >
              {second}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: revealStep >= 2 ? 150 : 0 }}
          className="w-40 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-start justify-center pt-4"
        >
          <span className="text-4xl font-bold text-gray-700">2</span>
        </motion.div>
      </div>

      {/* 1st Place - Center */}
      <div className="flex flex-col items-center -mb-0">
        <AnimatePresence>
          {revealStep >= 3 && first && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
              onAnimationComplete={() => onStepComplete?.(3)}
              className="mb-4"
            >
              {/* Confetti burst effect */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: ['#FFD700', '#FFA500', '#FF4500', '#00FF00', '#1E90FF'][i % 5],
                    }}
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400 - 200,
                      rotate: Math.random() * 720,
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                ))}
              </motion.div>
              {first}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: revealStep >= 3 ? 200 : 0 }}
          className="w-48 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-start justify-center pt-4"
        >
          <span className="text-5xl font-bold text-yellow-800">1</span>
        </motion.div>
      </div>

      {/* 3rd Place - Right */}
      <div className="flex flex-col items-center">
        <AnimatePresence>
          {revealStep >= 1 && third && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              onAnimationComplete={() => onStepComplete?.(1)}
              className="mb-4"
            >
              {third}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: revealStep >= 1 ? 100 : 0 }}
          className="w-40 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg flex items-start justify-center pt-4"
        >
          <span className="text-3xl font-bold text-orange-900">3</span>
        </motion.div>
      </div>
    </div>
  );
}

