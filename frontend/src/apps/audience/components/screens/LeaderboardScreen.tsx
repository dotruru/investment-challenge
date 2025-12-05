import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { operatorApi } from '@/shared/api/client';

interface TeamRanking {
  teamId: string;
  teamName: string;
  university: string;
  roundAssignment: number;
  score: number | null;
  rank?: number;
}

export function LeaderboardScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadRankings();
    }
  }, [eventId]);

  useEffect(() => {
    // Delay showing rankings for dramatic effect
    const timer = setTimeout(() => {
      setShowRankings(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [rankings]);

  const loadRankings = async () => {
    try {
      const scores = await operatorApi.getOperatorScores(eventId!);
      // Sort by score descending and add rank
      const sorted = scores
        .filter((s: TeamRanking) => s.score !== null)
        .sort((a: TeamRanking, b: TeamRanking) => (b.score ?? 0) - (a.score ?? 0))
        .map((team: TeamRanking, index: number) => ({ ...team, rank: index + 1 }));
      setRankings(sorted);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20',
          border: 'border-yellow-500/50',
          icon: <Trophy className="w-8 h-8 text-yellow-500" />,
          badge: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
          text: 'text-yellow-500',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400/20 to-gray-500/20',
          border: 'border-gray-400/50',
          icon: <Medal className="w-8 h-8 text-gray-400" />,
          badge: 'bg-gradient-to-r from-gray-300 to-gray-500',
          text: 'text-gray-400',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20',
          border: 'border-orange-500/50',
          icon: <Award className="w-8 h-8 text-orange-500" />,
          badge: 'bg-gradient-to-r from-orange-400 to-orange-600',
          text: 'text-orange-500',
        };
      default:
        return {
          bg: 'bg-navy-800/50',
          border: 'border-white/10',
          icon: <Star className="w-6 h-6 text-white/50" />,
          badge: 'bg-navy-700',
          text: 'text-white/70',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gold-500/80 text-xl">Loading results...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 py-12 px-8 overflow-y-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 bg-gold-500/10 rounded-full border border-gold-500/30 mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Trophy className="w-6 h-6 text-gold-500" />
            <span className="text-gold-500 font-semibold text-lg">Final Results</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Competition Leaderboard
          </h1>
          <p className="text-xl text-white/60">
            UK Investment Challenge Grand Finale
          </p>
        </motion.div>

        {/* Rankings */}
        <div className="space-y-4">
          {rankings.map((team, index) => {
            const rank = team.rank || index + 1;
            const style = getRankStyle(rank);
            const isTop3 = rank <= 3;

            return (
              <motion.div
                key={team.teamId}
                className={`relative rounded-2xl border ${style.border} ${style.bg} overflow-hidden`}
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                animate={showRankings ? { opacity: 1, x: 0, scale: 1 } : {}}
                transition={{
                  delay: index * 0.15,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              >
                <div className={`flex items-center gap-6 p-6 ${isTop3 ? 'py-8' : ''}`}>
                  {/* Rank badge */}
                  <motion.div
                    className={`w-16 h-16 rounded-2xl ${style.badge} flex items-center justify-center flex-shrink-0 shadow-lg`}
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={showRankings ? { rotate: 0, scale: 1 } : {}}
                    transition={{ delay: index * 0.15 + 0.2, type: 'spring' }}
                  >
                    <span className="text-2xl font-bold text-white">{rank}</span>
                  </motion.div>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {style.icon}
                      <h3 className={`text-2xl font-bold ${isTop3 ? 'text-white' : 'text-white/90'}`}>
                        {team.teamName}
                      </h3>
                    </div>
                    <p className="text-white/60 text-lg">{team.university}</p>
                  </div>

                  {/* Score */}
                  <motion.div
                    className="text-right"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={showRankings ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: index * 0.15 + 0.3 }}
                  >
                    <div className={`text-4xl font-bold font-mono ${style.text}`}>
                      {team.score}
                    </div>
                    <div className="text-white/40 text-sm">points</div>
                  </motion.div>
                </div>

                {/* Shine effect for top 3 */}
                {isTop3 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={showRankings ? { x: '200%' } : {}}
                    transition={{ delay: index * 0.15 + 0.5, duration: 1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {rankings.length === 0 && !isLoading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Trophy className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-xl text-white/50">No scores available yet</p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          className="text-center mt-12 text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rankings.length * 0.15 + 1 }}
        >
          <p>Thank you for attending the UK Investment Challenge</p>
        </motion.div>
      </div>
    </div>
  );
}

