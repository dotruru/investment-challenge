import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Team } from '@/shared/types';

// Partner logos - in production these would come from the backend
const PARTNER_LOGOS = [
  { name: 'MCD Edu', color: 'from-blue-400 to-blue-600' },
  { name: 'Umushroom', color: 'from-green-400 to-green-600' },
  { name: 'Bloomberg', color: 'from-orange-400 to-orange-600' },
  { name: 'CFA UK', color: 'from-purple-400 to-purple-600' },
];

const FUNNY_QUOTES = [
  "Buy low, sell high... if only it were that simple! 📈",
  "May your Sharpe ratio be ever in your favor 🎯",
  "Remember: Past performance is not indicative... but it's all we've got! 😅",
  "The trend is your friend, until it isn't 🌊",
  "Diversify they said. It'll be fun they said. 📊",
  "HODL? More like HOLDL (Heart Of Lions, Diamonds, Legends) 💎",
  "Warren Buffett never had to deal with meme stocks 🚀",
];

export function LobbyScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    if (eventId) loadTeams();
  }, [eventId]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % FUNNY_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate teams
  useEffect(() => {
    if (teams.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [teams.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px]"
          animate={{
            x: [0, 80, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"
          animate={{
            x: [0, -60, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px]"
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold-400/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-8xl font-display tracking-wider mb-4">
            <span className="text-gradient">UK INVESTMENT</span>
          </h1>
          <h2 className="text-6xl font-display text-white/90 tracking-wider mb-6">
            CHALLENGE
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            <p className="text-2xl text-gold-400 font-light">2025 Finals</p>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
          </div>
        </motion.div>

        {/* Team Names Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12 h-24"
        >
          {teams.length > 0 && (
            <motion.div
              key={currentTeamIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">Featuring</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center text-xl font-bold text-navy-950">
                  {teams[currentTeamIndex]?.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{teams[currentTeamIndex]?.name}</p>
                  <p className="text-muted-foreground">{teams[currentTeamIndex]?.university}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Funny Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <motion.div
            key={currentQuoteIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-xl text-muted-foreground italic">
              "{FUNNY_QUOTES[currentQuoteIndex]}"
            </p>
          </motion.div>
        </motion.div>

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full max-w-4xl"
        >
          <p className="text-center text-sm text-muted-foreground mb-6">Supported by</p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {PARTNER_LOGOS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`w-32 h-16 bg-gradient-to-br ${partner.color} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <span className="font-bold text-white text-sm">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-muted-foreground">Event starting soon • Please take your seats</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
