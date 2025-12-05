import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { Trophy, Medal, Star, Sparkles, Crown } from 'lucide-react';
import type { Team } from '@/shared/types';

interface TeamWithScore extends Team {
  totalScore?: number;
  rank?: number;
}

export function AwardsScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const [teams, setTeams] = useState<TeamWithScore[]>([]);
  
  const animationState = state?.animationState || { step: 0 };
  const revealedStep = animationState.step;

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
        const response = await fetch(`${apiUrl}/events/${eventId}/display`);
        const data = await response.json();
        const sortedTeams = (data.teams || []).sort(
          (a: TeamWithScore, b: TeamWithScore) => (b.totalScore || 0) - (a.totalScore || 0)
        );
        sortedTeams.forEach((team: TeamWithScore, idx: number) => {
          team.rank = idx + 1;
        });
        setTeams(sortedTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    if (eventId) loadTeams();
  }, [eventId]);

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: <Trophy className="w-20 h-20" />,
          color: 'from-gold-300 via-gold-400 to-gold-600',
          textColor: 'text-gold-400',
          label: 'CHAMPION',
          shadowColor: 'shadow-gold-500/50',
          bgGlow: 'bg-gold-500/20',
        };
      case 2:
        return {
          icon: <Medal className="w-16 h-16" />,
          color: 'from-gray-200 via-gray-300 to-gray-500',
          textColor: 'text-gray-300',
          label: '2ND PLACE',
          shadowColor: 'shadow-gray-500/30',
          bgGlow: 'bg-gray-400/10',
        };
      case 3:
        return {
          icon: <Medal className="w-14 h-14" />,
          color: 'from-orange-300 via-orange-400 to-orange-600',
          textColor: 'text-orange-400',
          label: '3RD PLACE',
          shadowColor: 'shadow-orange-500/30',
          bgGlow: 'bg-orange-500/10',
        };
      default:
        return {
          icon: <Star className="w-10 h-10" />,
          color: 'from-mcd-400 to-mcd-600',
          textColor: 'text-mcd-400',
          label: `#${rank}`,
          shadowColor: 'shadow-mcd-500/20',
          bgGlow: 'bg-mcd-500/5',
        };
    }
  };

  const firstPlace = teams.find((t) => t.rank === 1);
  const secondPlace = teams.find((t) => t.rank === 2);
  const thirdPlace = teams.find((t) => t.rank === 3);

  const isRevealed = (rank: number) => {
    if (rank === 3) return revealedStep >= 1;
    if (rank === 2) return revealedStep >= 2;
    if (rank === 1) return revealedStep >= 3;
    return false;
  };

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.1) 50%, rgba(234, 179, 8, 0.08) 100%)',
          }}
        />
        
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px]"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(234, 179, 8, 0.15) 0%, transparent 60%)',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Confetti when winner revealed */}
        <AnimatePresence>
          {revealedStep >= 3 && (
            <>
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute"
                  initial={{
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 3,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 800,
                    y: window.innerHeight + 50,
                    scale: 1,
                    rotate: Math.random() * 720 - 360,
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut',
                  }}
                  style={{
                    width: Math.random() * 10 + 5,
                    height: Math.random() * 10 + 5,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                    backgroundColor: ['#FFD700', '#0055FE', '#00D9FF', '#FFA500', '#A855F7', '#FFFFFF'][
                      Math.floor(Math.random() * 6)
                    ],
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 p-8 flex flex-col h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-4 mb-4"
          >
            <Crown className="w-10 h-10 text-gold-400" />
            <h1 className="text-5xl md:text-6xl font-display tracking-wider">
              <span className="text-gradient-blue">AWARDS</span>{' '}
              <span className="text-gold-400">CEREMONY</span>
            </h1>
            <Crown className="w-10 h-10 text-gold-400" />
          </motion.div>
          <p className="text-xl text-muted-foreground">
            UK Investment Competition {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* Podium Area */}
        <div className="flex-1 flex items-end justify-center pb-16">
          <div className="flex items-end justify-center gap-6 md:gap-12">
            {/* 2nd Place - Left */}
            <AnimatePresence>
              {isRevealed(2) && secondPlace && (
                <motion.div
                  key="2nd"
                  initial={{ opacity: 0, y: 200, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <PodiumCard
                    team={secondPlace}
                    display={getRankDisplay(2)}
                    podiumHeight="h-40"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1st Place - Center */}
            <AnimatePresence>
              {isRevealed(1) && firstPlace && (
                <motion.div
                  key="1st"
                  initial={{ opacity: 0, y: 200, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', duration: 1 }}
                  className="flex flex-col items-center z-10"
                >
                  <PodiumCard
                    team={firstPlace}
                    display={getRankDisplay(1)}
                    podiumHeight="h-56"
                    isChampion
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3rd Place - Right */}
            <AnimatePresence>
              {isRevealed(3) && thirdPlace && (
                <motion.div
                  key="3rd"
                  initial={{ opacity: 0, y: 200, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <PodiumCard
                    team={thirdPlace}
                    display={getRankDisplay(3)}
                    podiumHeight="h-32"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder podiums */}
            {!isRevealed(2) && (
              <div className="flex flex-col items-center opacity-30">
                <PlaceholderPodium place={2} height="h-40" />
              </div>
            )}
            {!isRevealed(1) && (
              <div className="flex flex-col items-center opacity-30 z-10">
                <PlaceholderPodium place={1} height="h-56" />
              </div>
            )}
            {!isRevealed(3) && (
              <div className="flex flex-col items-center opacity-30">
                <PlaceholderPodium place={3} height="h-32" />
              </div>
            )}
          </div>
        </div>

        {/* Full Rankings */}
        <AnimatePresence>
          {revealedStep >= 3 && teams.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="max-w-3xl mx-auto w-full"
            >
              <h2 className="text-xl font-bold text-center mb-4">Full Rankings</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {teams.slice(3).map((team, idx) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5 + idx * 0.1 }}
                    className="bg-navy-800/50 backdrop-blur border border-white/10 rounded-lg p-3 text-center"
                  >
                    <span className="text-sm text-muted-foreground">#{team.rank}</span>
                    <p className="font-bold text-sm truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{team.university}</p>
                    <p className="text-mcd-400 font-bold">{team.totalScore?.toFixed(1)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface PodiumCardProps {
  team: TeamWithScore;
  display: ReturnType<typeof getRankDisplay>;
  podiumHeight: string;
  isChampion?: boolean;
}

function getRankDisplay(rank: number) {
  switch (rank) {
    case 1:
      return {
        icon: <Trophy className="w-20 h-20" />,
        color: 'from-gold-300 via-gold-400 to-gold-600',
        textColor: 'text-gold-400',
        label: 'CHAMPION',
        shadowColor: 'shadow-gold-500/50',
        bgGlow: 'bg-gold-500/20',
      };
    case 2:
      return {
        icon: <Medal className="w-16 h-16" />,
        color: 'from-gray-200 via-gray-300 to-gray-500',
        textColor: 'text-gray-300',
        label: '2ND PLACE',
        shadowColor: 'shadow-gray-500/30',
        bgGlow: 'bg-gray-400/10',
      };
    case 3:
      return {
        icon: <Medal className="w-14 h-14" />,
        color: 'from-orange-300 via-orange-400 to-orange-600',
        textColor: 'text-orange-400',
        label: '3RD PLACE',
        shadowColor: 'shadow-orange-500/30',
        bgGlow: 'bg-orange-500/10',
      };
    default:
      return {
        icon: <Star className="w-10 h-10" />,
        color: 'from-mcd-400 to-mcd-600',
        textColor: 'text-mcd-400',
        label: `#${rank}`,
        shadowColor: 'shadow-mcd-500/20',
        bgGlow: 'bg-mcd-500/5',
      };
  }
}

function PodiumCard({ team, display, podiumHeight, isChampion }: PodiumCardProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={isChampion ? { 
          y: [0, -8, 0],
          rotate: [0, 2, -2, 0],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`mb-4 ${display.textColor}`}
      >
        {display.icon}
        {isChampion && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-full h-full text-gold-300" />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative bg-navy-800/80 backdrop-blur-md border border-gold-500/30 rounded-2xl p-6 text-center shadow-2xl ${display.shadowColor} ${isChampion ? 'w-72' : 'w-56'}`}
      >
        <div className={`absolute inset-0 ${display.bgGlow} rounded-2xl`} />
        
        <motion.p
          animate={isChampion ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`relative text-sm font-bold tracking-wider mb-3 ${display.textColor}`}
        >
          {display.label}
        </motion.p>

        <div
          className={`relative w-24 h-24 mx-auto mb-4 bg-gradient-to-br ${display.color} rounded-xl flex items-center justify-center text-4xl font-bold text-navy-950 shadow-lg ${display.shadowColor}`}
        >
          {team.avatarCardImageUrl ? (
            <img src={team.avatarCardImageUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            team.name.charAt(0)
          )}
        </div>

        <h3 className={`relative font-bold mb-1 ${isChampion ? 'text-xl' : 'text-lg'}`}>
          {team.name}
        </h3>
        <p className="relative text-sm text-muted-foreground mb-3">{team.university}</p>
        
        <div className="relative pt-3 border-t border-white/10">
          <motion.p
            animate={isChampion ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-4xl font-bold ${display.textColor}`}
          >
            {team.totalScore?.toFixed(1) || '0.0'}
          </motion.p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </div>
      </motion.div>

      <div
        className={`${podiumHeight} ${isChampion ? 'w-40' : 'w-32'} bg-gradient-to-t ${display.color} rounded-t-xl mt-4 flex items-start justify-center pt-6 shadow-lg`}
      >
        <span className={`${isChampion ? 'text-6xl' : 'text-4xl'} font-bold text-navy-950/60`}>
          {team.rank}
        </span>
      </div>
    </div>
  );
}

function PlaceholderPodium({ place, height }: { place: number; height: string }) {
  const colors = {
    1: 'from-gold-400/30 to-gold-600/30',
    2: 'from-gray-300/30 to-gray-500/30',
    3: 'from-orange-400/30 to-orange-600/30',
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${place === 1 ? 'w-72' : 'w-56'} h-48 bg-navy-800/30 backdrop-blur border border-white/10 rounded-2xl flex items-center justify-center mb-4`}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          ?
        </motion.div>
      </div>
      
      <div className={`${height} ${place === 1 ? 'w-40' : 'w-32'} bg-gradient-to-t ${colors[place as keyof typeof colors]} rounded-t-xl flex items-start justify-center pt-6`}>
        <span className={`${place === 1 ? 'text-6xl' : 'text-4xl'} font-bold text-white/20`}>
          {place}
        </span>
      </div>
    </div>
  );
}
