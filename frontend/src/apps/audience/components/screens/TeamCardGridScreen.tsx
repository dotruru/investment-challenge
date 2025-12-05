import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import type { Team } from '@/shared/types';

export function TeamCardGridScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  useLiveStateStore(); // Keep connection active
  const [teams, setTeams] = useState<Team[]>([]);

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

  return (
    <div className="min-h-screen bg-navy-950 p-8 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.1) 50%, rgba(0, 217, 255, 0.05) 100%)',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-mcd-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-display text-center mb-4"
        >
          <span className="text-gradient">COMPETING TEAMS</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground text-xl mb-12"
        >
          {teams.length} Teams • 3 Rounds
        </motion.p>

        <motion.div
          className="grid grid-cols-5 gap-5 max-w-7xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {teams.map((team) => (
            <motion.div
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.8, rotateY: -15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotateY: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 100,
                    damping: 12,
                  },
                },
              }}
              whileHover={{ 
                scale: 1.08, 
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-mcd-500/20 to-cyan-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Card */}
              <div className="relative bg-navy-800/80 backdrop-blur-sm border border-mcd-500/20 group-hover:border-mcd-500/50 rounded-xl p-4 text-center transition-all duration-300 overflow-hidden">
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>

                {/* Round badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    team.roundAssignment === 1 ? 'bg-mcd-500/20 text-mcd-400' :
                    team.roundAssignment === 2 ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    R{team.roundAssignment}
                  </span>
                </div>

                {/* Team Avatar */}
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-mcd-500/20 group-hover:shadow-mcd-500/40 transition-shadow">
                  {team.avatarCardImageUrl ? (
                    <img src={team.avatarCardImageUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    team.name.charAt(0)
                  )}
                </div>

                {/* Team Info */}
                <h3 className="font-bold text-white mb-1 truncate">{team.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{team.university}</p>
                
                {/* Rank Badge */}
                {team.rankBadge && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-mcd-500/20 rounded text-xs text-mcd-400 font-medium">
                    {team.rankBadge}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {teams.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl"
            >
              Loading teams...
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
