import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { useAssets } from '@/shared/hooks/useAssets';
import { Users, TrendingUp, Award, Target, CheckCircle, Clock, Mic, FileText, RotateCcw } from 'lucide-react';
import type { Team } from '@/shared/types';

interface RoundScreenProps {
  timer: {
    formatted: string;
    progress: number;
    isWarning: boolean;
    isCritical: boolean;
    status: string;
    type?: string;
    remainingSeconds?: number;
  };
}

// Presentation phase: intro card, then presentation mode
type PresentationPhase = 'intro' | 'presenting';

const INTRO_DURATION = 12000; // 12 seconds for intro card

export function RoundScreen({ timer }: RoundScreenProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { state } = useLiveStateStore();
  const { getTeamAssets } = useAssets();
  const team = state?.currentTeam;
  const roundNumber = state?.roundState?.currentRound || (state?.currentStage?.configuration as any)?.roundNumber || 1;
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const [presentationPhase, setPresentationPhase] = useState<PresentationPhase>('intro');
  const prevTeamId = useRef<string | null>(null);

  const animationState = state?.animationState;
  const isTransitioning = animationState?.currentAnimation === 'team_transition';

  // Get team presentation assets - try multiple matching strategies
  const teamAssets = team 
    ? (getTeamAssets(team.name) || getTeamAssets(team.name.toLowerCase().replace(/\s+/g, '-')))
    : null;
  
  // Get next team info for transition
  const nextTeamId = animationState?.params?.nextTeamId;
  const nextTeam = allTeams.find(t => t.id === nextTeamId);
  const nextTeamAssets = nextTeam 
    ? (getTeamAssets(nextTeam.name) || getTeamAssets(nextTeam.name.toLowerCase().replace(/\s+/g, '-')))
    : null;

  // Check if currently in active Q&A
  const isActiveQA = timer.type === 'qa' && timer.status === 'running';

  // Reset to intro phase when team changes
  useEffect(() => {
    if (team?.id !== prevTeamId.current) {
      setPresentationPhase('intro');
      prevTeamId.current = team?.id || null;
    }
  }, [team?.id]);

  // Auto-switch to presenting phase after intro (unless Q&A is active)
  useEffect(() => {
    if (team && presentationPhase === 'intro' && !isActiveQA) {
      const timeout = setTimeout(() => {
        setPresentationPhase('presenting');
      }, INTRO_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [team?.id, presentationPhase, isActiveQA]);

  // When Q&A starts, go back to intro/profile phase
  useEffect(() => {
    if (isActiveQA) {
      setPresentationPhase('intro');
    }
  }, [isActiveQA]);

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

  useEffect(() => {
    if (animationState?.currentAnimation === 'shuffle') {
      setIsShuffling(true);
      setShowLineup(true);
      setTimeout(() => setIsShuffling(false), 2000);
    }
  }, [animationState]);


  const completedTeams = state?.roundState?.teamsCompleted || [];
  const showingLineup = showLineup && !team;

  return (
    <div className="min-h-screen bg-navy-950 p-8 overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[60%] h-full"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(0, 85, 254, 0.1) 50%, rgba(0, 217, 255, 0.08) 100%)',
          }}
        />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-mcd-500/10 rounded-full blur-[150px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Round Header - Only show in intro phase or when no team */}
        <AnimatePresence>
          {(presentationPhase === 'intro' || !team) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl font-display tracking-wider">
            <span className="text-gradient">PITCHING ROUND {roundNumber}</span>
          </h1>
        </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar with Team Mini Cards - Always visible but compact in presenting mode */}
        <motion.div 
          className="max-w-5xl mx-auto w-full mb-4"
          animate={presentationPhase === 'presenting' && team ? { scale: 0.8, y: -10 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center gap-3">
            {allTeams.map((t, idx) => {
              const isCompleted = completedTeams.includes(t.id);
              const isCurrent = t.id === team?.id;

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
                  <div
                    className={`w-14 h-18 rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'bg-gradient-to-br from-mcd-500 to-cyan-500 border-mcd-400 scale-110 shadow-lg shadow-mcd-500/30'
                        : isCompleted
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className={`text-base font-bold ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                        {t.name.charAt(0)}
                      </span>
                    )}
                    <span className={`text-[9px] truncate max-w-[48px] px-1 ${isCurrent ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {t.name.split(' ')[0]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* Transition View - Between teams */}
            {isTransitioning && nextTeam && (
              <motion.div
                key="transition"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-navy-950 flex items-center justify-center"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0, 85, 254, 0.2) 0%, transparent 70%)',
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-px bg-gradient-to-r from-transparent via-mcd-500/30 to-transparent w-full"
                      style={{ top: `${20 + i * 15}%` }}
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>

                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-mcd-500/20 border border-mcd-500/40 rounded-full">
                      <motion.div
                        className="w-3 h-3 bg-mcd-500 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-lg font-medium text-mcd-400 uppercase tracking-widest">
                        Next Up
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-8"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-mcd-500/30 to-cyan-500/30 blur-2xl"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative w-32 h-32 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl">
                        <span className="text-6xl font-bold text-white">
                          {nextTeamAssets?.logoPlaceholder || nextTeam.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-5xl md:text-6xl font-display tracking-wider mb-4"
                  >
                    <span className="text-gradient">{nextTeam.name}</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl text-muted-foreground"
                  >
                    {nextTeam.university}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Lineup View */}
            {showingLineup && !isTransitioning && (
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
                      className="w-32 bg-navy-800/50 border border-mcd-500/20 rounded-xl p-4 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                        {t.name.charAt(0)}
                      </div>
                      <p className="font-bold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.university}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* INTRO PHASE - Full Team Card */}
            {team && presentationPhase === 'intro' && !isTransitioning && (
              <motion.div
                key={`${team.id}-intro`}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="w-full max-w-6xl"
              >
                <div className="grid grid-cols-3 gap-8 items-start">
                  {/* Full Team Card */}
                  <div className="col-span-2">
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-navy-800/50 backdrop-blur-xl border border-mcd-500/20 rounded-2xl p-8 relative overflow-hidden"
                    >
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-mcd-500/20 rounded-full blur-[80px]" />
                      
                      <div className="relative">
                        {/* Header */}
                        <div className="flex gap-6 mb-6">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-28 h-28 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-mcd-500/30">
                              {team.avatarCardImageUrl ? (
                                <img src={team.avatarCardImageUrl} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                              ) : teamAssets?.logo ? (
                                <img src={teamAssets.logo} alt={team.name} className="w-full h-full object-contain p-2" />
                              ) : (
                                teamAssets?.logoPlaceholder || team.name.charAt(0)
                              )}
                            </div>
                          </motion.div>

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
                              className="text-xl text-mcd-400 mb-3"
                            >
                              {team.university}
                            </motion.p>
                            
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
                                  <div className="w-10 h-10 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
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
                                {teamAssets?.metrics?.return ? `${teamAssets.metrics.return > 0 ? '+' : ''}${teamAssets.metrics.return}%` : team.stats?.performance ? `+${team.stats.performance}%` : '+15.2%'}
                              </p>
                              <p className="text-xs text-muted-foreground">Return</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                              <Target className="w-6 h-6 mx-auto mb-2 text-mcd-400" />
                              <p className="text-2xl font-bold text-mcd-400">
                                {teamAssets?.metrics?.sharpe || team.stats?.sharpe || '1.85'}
                              </p>
                              <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                              <Award className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                              <p className="text-2xl font-bold text-cyan-400">
                                {teamAssets?.metrics?.volatility || team.stats?.sortino || '2.12'}
                              </p>
                              <p className="text-xs text-muted-foreground">{teamAssets?.metrics?.volatility ? 'Volatility' : 'Sortino'}</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Timer Panel */}
                  <TimerPanel timer={timer} />
                </div>

                {/* Intro countdown indicator - only show before presentation, not during Q&A */}
                {timer.type !== 'qa' && (
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <p className="text-sm text-muted-foreground">Presentation starts shortly...</p>
                    <motion.div 
                      className="h-1 bg-mcd-500/30 rounded-full mt-2 max-w-xs mx-auto overflow-hidden"
                    >
                      <motion.div 
                        className="h-full bg-mcd-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: INTRO_DURATION / 1000, ease: 'linear' }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PRESENTING PHASE - Presentation View with Mini Team Card */}
            {team && presentationPhase === 'presenting' && !isTransitioning && (
              <motion.div
                key={`${team.id}-presenting`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-20 bg-navy-950 flex flex-col"
              >
                {/* Top Bar - Team Card + Timer */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                >
                  {/* Team Card - Left side */}
                  <div className="bg-navy-800/80 backdrop-blur-xl border border-mcd-500/30 rounded-xl p-3 flex items-center gap-4 shadow-xl">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                      {team.avatarCardImageUrl ? (
                        <img src={team.avatarCardImageUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                      ) : teamAssets?.logoPlaceholder || team.name.charAt(0)}
                    </div>
                    
                    {/* Team Info */}
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-sm text-mcd-400">{team.university}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 ml-4 pl-4 border-l border-white/10">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${(teamAssets?.metrics?.return ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {teamAssets?.metrics?.return ? `${teamAssets.metrics.return > 0 ? '+' : ''}${teamAssets.metrics.return}%` : '+15%'}
                        </p>
                        <p className="text-xs text-muted-foreground">Return</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg text-mcd-400 font-bold">
                          {teamAssets?.metrics?.sharpe || '1.85'}
                        </p>
                        <p className="text-xs text-muted-foreground">Sharpe</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg text-cyan-400 font-bold">
                          {teamAssets?.metrics?.volatility || '12.5'}%
                        </p>
                        <p className="text-xs text-muted-foreground">Volatility</p>
                      </div>
                    </div>
                  </div>

                  {/* Timer - Right side */}
                  <div className={`px-6 py-3 rounded-xl backdrop-blur-md ${
                    timer.isCritical 
                      ? 'bg-red-500/20 border border-red-500/50' 
                      : timer.isWarning 
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-navy-800/80 border border-mcd-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        timer.type === 'qa' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-mcd-500/20 text-mcd-400'
                      }`}>
                        {timer.type === 'qa' ? 'Q&A' : 'Presentation'}
                      </div>
                      <span className={`text-4xl font-mono font-bold tabular-nums ${
                        timer.isCritical ? 'text-red-500 animate-pulse' : timer.isWarning ? 'text-yellow-500' : 'text-white'
                      }`}>
                        {timer.formatted}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Presentation Area - Takes all remaining space */}
                <div className="flex-1 px-6 pb-6 min-h-0">
                  <div className="w-full h-full bg-navy-800/30 border border-white/10 rounded-2xl overflow-hidden relative">
                    {/* If we have a presentation PDF, embed it */}
                    {teamAssets?.presentation ? (
                      <>
                        <iframe
                          src={`${teamAssets.presentation}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                          className="w-full h-full"
                          title={`${team.name} Presentation`}
                          style={{ border: 'none', minHeight: '100%' }}
                          onError={() => console.error('PDF failed to load:', teamAssets.presentation)}
                        />
                        {/* Manual controls overlay - bottom left */}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          <a
                            href={teamAssets.presentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-navy-800/90 backdrop-blur-md border border-white/20 rounded-lg text-sm text-white/70 hover:text-white hover:border-mcd-500/50 transition-colors flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Open PDF
                          </a>
                          <button
                            onClick={() => {
                              // Force reload iframe
                              const iframe = document.querySelector('iframe');
                              if (iframe) {
                                iframe.src = iframe.src;
                              }
                            }}
                            className="px-3 py-2 bg-navy-800/90 backdrop-blur-md border border-white/20 rounded-lg text-sm text-white/70 hover:text-white hover:border-mcd-500/50 transition-colors flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reload
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-mcd-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                            <FileText className="w-10 h-10 text-mcd-400" />
                          </div>
                          <p className="text-lg text-muted-foreground mb-1">Live Presentation</p>
                          <p className="text-sm text-muted-foreground/70 mb-4">Team is presenting on the main screen</p>
                          
                          {/* Manual presentation trigger */}
                          <p className="text-xs text-muted-foreground/50 mb-3">
                            PDF not found for "{team.name}"
                          </p>
                          <button
                            onClick={() => setPresentationPhase('intro')}
                            className="px-4 py-2 bg-mcd-500/20 border border-mcd-500/50 rounded-lg text-sm text-mcd-400 hover:bg-mcd-500/30 transition-colors"
                          >
                            Back to Team Card
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Waiting State */}
            {!team && !showingLineup && !isTransitioning && (
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

// Extracted Timer Panel component for reuse
function TimerPanel({ timer }: { timer: RoundScreenProps['timer'] }) {
  return (
                  <div className="space-y-6">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className={`bg-navy-800/50 backdrop-blur-xl border rounded-2xl p-6 text-center ${
                        timer.isCritical ? 'border-red-500/50' : timer.isWarning ? 'border-yellow-500/50' : 'border-mcd-500/20'
                      }`}
                    >
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                        timer.type === 'qa' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-mcd-500/20 text-mcd-400'
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
                                : 'text-mcd-500'
                            }
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">{Math.round(timer.progress)}%</span>
                        </div>
                      </div>
                    </motion.div>

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
  );
}
