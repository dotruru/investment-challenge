import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { Users, TrendingUp, Award, Target, CheckCircle, Clock, Mic } from 'lucide-react';
import type { Team } from '@/shared/types';

interface RoundScreenProps {
  timer: {
    formatted: string;
    progress: number;
    isWarning: boolean;
    isCritical: boolean;
    status: string;
    type?: string;
  };
}

export function RoundScreen({ timer }: RoundScreenProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const team = state?.currentTeam;
  const roundNumber = state?.roundState?.currentRound || (state?.currentStage?.configuration as any)?.roundNumber || 1;
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTimerStatus = useRef<string>('');

  // Animation state for shuffle
  const animationState = state?.animationState;

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch(`/api/v1/events/${eventId}/display`);
        const data = await response.json();
        const roundTeams = (data.teams || [])
          .filter((t: Team) => t.roundAssignment === roundNumber)
          .sort((a: Team, b: Team) => (a.presentationOrder || 999) - (b.presentationOrder || 999));
        setAllTeams(roundTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    if (eventId) loadTeams();
  }, [eventId, roundNumber]);

  // Handle shuffle animation trigger
  useEffect(() => {
    if (animationState?.currentAnimation === 'shuffle') {
      setIsShuffling(true);
      setShowLineup(true);
      setTimeout(() => setIsShuffling(false), 2000);
    }
  }, [animationState]);

  // Play buzzer when timer completes
  useEffect(() => {
    if (timer.status === 'completed' && prevTimerStatus.current === 'running') {
      playBuzzer();
    }
    prevTimerStatus.current = timer.status;
  }, [timer.status]);

  const playBuzzer = () => {
    // Web Audio API buzzer
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  // Calculate progress
  const completedTeams = state?.roundState?.teamsCompleted || [];
  const totalTeamsInRound = allTeams.length || 5;
  const currentTeamIndex = allTeams.findIndex(t => t.id === team?.id);

  // Show lineup view when no team selected or shuffling
  const showingLineup = showLineup && !team;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-8 overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/10 rounded-full blur-[150px]" />
        <motion.div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Round Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl font-display tracking-wider">
            <span className="text-gradient">PITCHING ROUND {roundNumber}</span>
          </h1>
        </motion.div>

        {/* Progress Bar with Team Mini Cards */}
        <div className="max-w-5xl mx-auto w-full mb-8">
          <div className="flex justify-center gap-3">
            {allTeams.map((t, idx) => {
              const isCompleted = completedTeams.includes(t.id);
              const isCurrent = t.id === team?.id;
              const isPending = !isCompleted && !isCurrent;

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: isShuffling ? [0, -20, 0, 20, 0] : 0,
                    x: isShuffling ? [0, Math.random() * 100 - 50, 0] : 0,
                  }}
                  transition={{ 
                    delay: isShuffling ? Math.random() * 0.3 : idx * 0.1,
                    duration: isShuffling ? 0.5 : 0.3,
                    repeat: isShuffling ? 3 : 0,
                  }}
                  className={`relative flex flex-col items-center ${isCurrent ? 'z-10' : ''}`}
                >
                  {/* Team mini card */}
                  <div
                    className={`w-16 h-20 rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'bg-gradient-to-br from-gold-400 to-gold-600 border-gold-400 scale-110 shadow-lg shadow-gold-500/30'
                        : isCompleted
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <span className={`text-lg font-bold ${isCurrent ? 'text-navy-950' : 'text-white/70'}`}>
                        {t.name.charAt(0)}
                      </span>
                    )}
                    <span className={`text-[10px] mt-1 truncate max-w-[56px] px-1 ${isCurrent ? 'text-navy-950/70' : 'text-muted-foreground'}`}>
                      {t.name.split(' ')[0]}
                    </span>
                  </div>
                  
                  {/* Position number */}
                  <span className={`text-xs mt-1 ${isCurrent ? 'text-gold-400 font-bold' : 'text-muted-foreground'}`}>
                    #{idx + 1}
                  </span>

                  {/* Current indicator */}
                  {isCurrent && (
                    <motion.div
                      layoutId="current-indicator"
                      className="absolute -bottom-3 w-2 h-2 rounded-full bg-gold-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Progress text */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            {completedTeams.length} of {totalTeamsInRound} presentations completed
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* Lineup View (shown during shuffle or before team selection) */}
            {showingLineup && (
              <motion.div
                key="lineup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold mb-8">
                  {isShuffling ? '🎲 Randomizing Order...' : 'Round Lineup'}
                </h2>
                <div className="flex justify-center gap-6">
                  {allTeams.map((t, idx) => (
                    <motion.div
                      key={t.id}
                      animate={{
                        rotate: isShuffling ? [0, 10, -10, 0] : 0,
                        scale: isShuffling ? [1, 1.05, 0.95, 1] : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: isShuffling ? Infinity : 0,
                        delay: idx * 0.05,
                      }}
                      className="w-32 bg-card/50 border border-white/10 rounded-xl p-4 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center text-2xl font-bold text-navy-950">
                        {t.name.charAt(0)}
                      </div>
                      <p className="font-bold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.university}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Team Presentation View */}
            {team && (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="w-full max-w-6xl"
              >
                <div className="grid grid-cols-3 gap-8 items-start">
                  {/* Team Card - Full Details */}
                  <div className="col-span-2">
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-8 relative overflow-hidden"
                    >
                      {/* Glow effect */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-500/20 rounded-full blur-[80px]" />
                      
                      <div className="relative">
                        {/* Header Row */}
                        <div className="flex gap-6 mb-6">
                          {/* Team Avatar */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-28 h-28 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center text-5xl font-bold text-navy-950 shadow-2xl shadow-gold-500/30">
                              {team.avatarCardImageUrl ? (
                                <img src={team.avatarCardImageUrl} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                              ) : (
                                team.name.charAt(0)
                              )}
                            </div>
                          </motion.div>

                          {/* Team Info */}
                          <div className="flex-1">
                            <motion.h2
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-4xl font-bold mb-1"
                            >
                              {team.name}
                            </motion.h2>
                            <motion.p
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="text-xl text-gold-400 mb-3"
                            >
                              {team.university}
                            </motion.p>
                            
                            {team.strategyTagline && (
                              <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-lg text-muted-foreground italic border-l-2 border-gold-500/50 pl-4"
                              >
                                "{team.strategyTagline}"
                              </motion.p>
                            )}
                          </div>
                        </div>

                        {/* Team Members */}
                        {team.members && team.members.length > 0 && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mb-6"
                          >
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Team Members
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                              {team.members.map((member, idx) => (
                                <motion.div
                                  key={member.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.8 + idx * 0.1 }}
                                  className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                                >
                                  <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-sm font-bold text-navy-950">
                                    {member.photoUrl ? (
                                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      member.name.charAt(0)
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{member.name}</p>
                                    {member.role && (
                                      <p className="text-xs text-muted-foreground">{member.role}</p>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Key Stats */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          className="pt-6 border-t border-white/10"
                        >
                          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Portfolio Performance
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
                              <p className="text-2xl font-bold text-green-400">
                                {team.stats?.performance ? `+${team.stats.performance}%` : '+15.2%'}
                              </p>
                              <p className="text-xs text-muted-foreground">Return</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                              <Target className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                              <p className="text-2xl font-bold text-blue-400">
                                {team.stats?.sharpe || '1.85'}
                              </p>
                              <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                              <Award className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                              <p className="text-2xl font-bold text-purple-400">
                                {team.stats?.sortino || '2.12'}
                              </p>
                              <p className="text-xs text-muted-foreground">Sortino Ratio</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Timer Panel */}
                  <div className="space-y-6">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className={`bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl border rounded-2xl p-6 text-center ${
                        timer.isCritical ? 'border-red-500/50' : timer.isWarning ? 'border-yellow-500/50' : 'border-gold-500/20'
                      }`}
                    >
                      {/* Timer Type Label */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                        timer.type === 'qa' ? 'bg-blue-500/20 text-blue-400' : 'bg-gold-500/20 text-gold-400'
                      }`}>
                        {timer.type === 'qa' ? (
                          <>
                            <Mic className="w-4 h-4" />
                            <span className="font-medium">Q&A Session</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Presentation</span>
                          </>
                        )}
                      </div>

                      {/* Main Timer Display */}
                      <div
                        className={`text-7xl font-mono font-bold tabular-nums mb-4 ${
                          timer.isCritical
                            ? 'text-red-500 animate-pulse'
                            : timer.isWarning
                            ? 'text-yellow-500'
                            : 'text-white'
                        }`}
                      >
                        {timer.formatted}
                      </div>

                      {/* Status */}
                      {timer.status === 'paused' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-full mb-4"
                        >
                          ⏸ PAUSED
                        </motion.div>
                      )}

                      {timer.status === 'completed' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 rounded-full mb-4"
                        >
                          ⏱ TIME'S UP!
                        </motion.div>
                      )}
                      
                      {/* Timer progress ring */}
                      <div className="relative w-36 h-36 mx-auto">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="66"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-white/10"
                          />
                          <motion.circle
                            cx="72"
                            cy="72"
                            r="66"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={415}
                            strokeDashoffset={415 - (415 * timer.progress) / 100}
                            className={
                              timer.isCritical
                                ? 'text-red-500'
                                : timer.isWarning
                                ? 'text-yellow-500'
                                : 'text-gold-500'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">{Math.round(timer.progress)}%</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Timer Legend */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/5 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Presentation</span>
                        <span className="font-mono">6:00</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Q&A</span>
                        <span className="font-mono">4:00</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Waiting State */}
            {!team && !showingLineup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Users className="w-24 h-24 mx-auto mb-4 text-muted-foreground/30" />
                <h2 className="text-2xl font-bold text-muted-foreground">Waiting for next presenter...</h2>
                <p className="text-muted-foreground mt-2">The next team will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
