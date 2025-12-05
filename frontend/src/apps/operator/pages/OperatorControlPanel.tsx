import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Shuffle, Users, Radio, Clock, Layers, 
  CheckCircle, AlertCircle, Trophy, Sparkles, UserCheck, Eye, LogOut
} from 'lucide-react';
import { useSocket } from '@/shared/hooks/useSocket';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { useTimer } from '@/shared/hooks/useTimer';
import { operatorApi, eventsApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { EventStage, Team, PersonProfile } from '@/shared/types';

interface OperatorControlPanelProps {
  eventId: string;
  onLogout: () => void;
}

export function OperatorControlPanel({ eventId, onLogout }: OperatorControlPanelProps) {
  const { connectionState } = useSocket({
    eventId: eventId,
    clientType: 'operator',
  });

  const { state } = useLiveStateStore();
  const timer = useTimer(state?.timerState || null);

  const [event, setEvent] = useState<any>(null);
  const [stages, setStages] = useState<EventStage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [jury, setJury] = useState<PersonProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoringStatus, setScoringStatus] = useState<any>(null);

  // Animation states
  const animationState = state?.animationState || { step: 0, totalSteps: 0 };

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  useEffect(() => {
    if (state?.currentTeamId && eventId) {
      loadScoringStatus();
    }
  }, [state?.currentTeamId, eventId]);

  const loadEventData = async () => {
    try {
      const eventData = await eventsApi.get(eventId);
      setEvent(eventData);
      setStages(eventData.stages || []);
      setTeams(eventData.teams || []);
      setJury((eventData.profiles || []).filter((p: PersonProfile) => p.profileType === 'JURY'));
    } catch (error) {
      console.error('Failed to load event data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScoringStatus = async () => {
    try {
      const status = await operatorApi.getScoringStatus(eventId);
      setScoringStatus(status);
    } catch (error) {
      console.error('Failed to load scoring status:', error);
    }
  };

  // Stage Controls
  const handleSetStage = async (stageId: string) => {
    try {
      await operatorApi.setStage(eventId, stageId);
    } catch (error) {
      console.error('Failed to set stage:', error);
    }
  };

  const handleNextStage = async () => {
    const currentIndex = stages.findIndex(s => s.id === state?.currentStageId);
    if (currentIndex < stages.length - 1) {
      await handleSetStage(stages[currentIndex + 1].id);
    }
  };

  const handlePrevStage = async () => {
    const currentIndex = stages.findIndex(s => s.id === state?.currentStageId);
    if (currentIndex > 0) {
      await handleSetStage(stages[currentIndex - 1].id);
    }
  };

  // Team Controls
  const handleSetTeam = async (teamId: string) => {
    try {
      await operatorApi.setTeam(eventId, teamId);
    } catch (error) {
      console.error('Failed to set team:', error);
    }
  };

  // Timer Controls
  const handleStartTimer = async (type: 'presentation' | 'qa' | 'break', duration: number) => {
    try {
      await operatorApi.startTimer(eventId, type, duration);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePauseTimer = async () => {
    try {
      if (timer.status === 'paused') {
        await operatorApi.resumeTimer(eventId);
      } else {
        await operatorApi.pauseTimer(eventId);
      }
    } catch (error) {
      console.error('Failed to pause/resume timer:', error);
    }
  };

  const handleResetTimer = async () => {
    try {
      await operatorApi.resetTimer(eventId);
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  // Round Controls
  const handleRandomizeRound = async (roundNumber: number) => {
    try {
      const result = await operatorApi.randomizeRound(eventId, roundNumber);
      await loadEventData();
    } catch (error) {
      console.error('Failed to randomize round:', error);
    }
  };

  const handleNextTeam = async () => {
    try {
      await operatorApi.nextTeam(eventId);
    } catch (error) {
      console.error('Failed to go to next team:', error);
    }
  };

  // Animation Controls
  const handleTriggerAnimation = async (animation: string, params?: any) => {
    try {
      await operatorApi.triggerAnimation(eventId, animation, params);
    } catch (error) {
      console.error('Failed to trigger animation:', error);
    }
  };

  const handleNextAnimationStep = async () => {
    try {
      await operatorApi.nextAnimationStep(eventId);
    } catch (error) {
      console.error('Failed to advance animation:', error);
    }
  };

  // Awards Controls
  const handleLockAwards = async () => {
    try {
      await operatorApi.lockAwards(eventId);
    } catch (error) {
      console.error('Failed to lock awards:', error);
    }
  };


  const getTeamsByRound = (round: number) => {
    return teams
      .filter(t => t.roundAssignment === round)
      .sort((a, b) => (a.presentationOrder || 999) - (b.presentationOrder || 999));
  };

  const currentStageType = state?.currentStage?.stageType;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground">Could not load event with ID: {eventId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Connection Status Banner */}
      {!connectionState.isConnected && (
        <div className={`px-4 py-2 text-center text-white font-medium ${
          connectionState.isReconnecting ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          {connectionState.isReconnecting
            ? `Reconnecting... (attempt ${connectionState.reconnectAttempt})`
            : 'Disconnected from server'}
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{event?.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Radio className="w-3 h-3" />
              Live Event Control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              connectionState.isConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {connectionState.isConnected ? 'Live' : 'Offline'}
            </div>
            <a href={`http://localhost:5102/event/${eventId}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Audience
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Stage Navigation */}
        <aside className="w-64 bg-card border-r border-border p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Stages
            </h2>
            <div className="flex gap-1">
              <button onClick={handlePrevStage} className="p-1 hover:bg-secondary rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNextStage} className="p-1 hover:bg-secondary rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-0.5">
            {stages.map((stage, index) => {
              const isActive = state?.currentStageId === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleSetStage(stage.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`w-4 h-4 flex items-center justify-center rounded text-[10px] ${
                    isActive ? 'bg-primary-foreground/20' : 'bg-secondary'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate">{stage.title}</span>
                  {isActive && <Radio className="w-2 h-2 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Current Stage Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-gold-500/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Stage</p>
                <h2 className="text-xl font-bold">{state?.currentStage?.title || 'No stage selected'}</h2>
              </div>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                {currentStageType || '-'}
              </span>
            </div>

            {/* Stage-Specific Controls */}
            <AnimatePresence mode="wait">
              {/* JURY REVEAL Controls */}
              {currentStageType === 'JURY_REVEAL' && (
                <motion.div
                  key="jury-reveal"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-5 h-5 text-gold-500" />
                    <h3 className="font-semibold">Jury Reveal Controls</h3>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {animationState.step} / {jury.length} revealed
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {jury.map((j, idx) => {
                      const isRevealed = idx < animationState.step;
                      const isCurrent = idx === animationState.step - 1;
                      return (
                        <div
                          key={j.id}
                          className={`p-3 rounded-lg text-center transition-all ${
                            isCurrent
                              ? 'bg-gold-500/20 border-2 border-gold-500'
                              : isRevealed
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-secondary/50'
                          }`}
                        >
                          <div className={`w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center ${
                            isRevealed ? 'bg-green-500/20' : 'bg-secondary'
                          }`}>
                            {isRevealed ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <span className="text-xl">?</span>
                            )}
                          </div>
                          <p className="text-xs font-medium truncate">
                            {isRevealed ? j.name.split(' ')[0] : `Jury ${idx + 1}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="gold"
                      size="lg"
                      className="flex-1"
                      onClick={handleNextAnimationStep}
                      disabled={animationState.step >= jury.length}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Reveal Next Jury Member
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTriggerAnimation('jury_reveal', { step: 0 })}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ROUND Controls */}
              {currentStageType === 'ROUND' && (
                <motion.div
                  key="round"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Timer */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Timer</h3>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className={`text-5xl font-mono font-bold tabular-nums ${
                          timer.isCritical ? 'text-red-500 animate-pulse' :
                          timer.isWarning ? 'text-yellow-500' : 'text-foreground'
                        }`}>
                          {timer.formatted}
                        </div>
                        {timer.status !== 'idle' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${timer.isCritical ? 'bg-red-500' : timer.isWarning ? 'bg-yellow-500' : 'bg-primary'}`}
                                style={{ width: `${timer.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">{timer.type}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Button variant="gold" size="sm" onClick={() => handleStartTimer('presentation', 360)} disabled={timer.status === 'running'}>
                          <Play className="w-3 h-3 mr-1" /> 6:00
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleStartTimer('qa', 240)} disabled={timer.status === 'running'}>
                          <Play className="w-3 h-3 mr-1" /> 4:00
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={handlePauseTimer} disabled={timer.status === 'idle'}>
                          {timer.status === 'paused' ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                          {timer.status === 'paused' ? 'Resume' : 'Pause'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleResetTimer}>
                          <RotateCcw className="w-3 h-3 mr-1" /> Reset
                        </Button>
                      </div>
                    </div>

                    {/* Current Team */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Current Team</h3>
                      </div>
                      
                      {state?.currentTeam ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl mx-auto mb-2 flex items-center justify-center text-2xl font-bold text-navy-950">
                            {state.currentTeam.name.charAt(0)}
                          </div>
                          <h4 className="font-bold">{state.currentTeam.name}</h4>
                          <p className="text-xs text-muted-foreground">{state.currentTeam.university}</p>
                          
                          {scoringStatus?.status && (
                            <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                              Scores: {scoringStatus.status.submitted}/{scoringStatus.status.total}
                            </div>
                          )}
                          
                          <Button variant="outline" size="sm" className="mt-3" onClick={handleNextTeam}>
                            <ChevronRight className="w-3 h-3 mr-1" /> Next Team
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Select a team below
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Round Team Grid */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Round Teams</h3>
                    </div>
                    {[1, 2, 3].map((round) => {
                      const roundTeams = getTeamsByRound(round);
                      const roundConfig = state?.currentStage?.configuration as any;
                      const isCurrentRound = roundConfig?.roundNumber === round;
                      if (roundTeams.length === 0) return null;
                      
                      return (
                        <div key={round} className={`mb-4 p-3 rounded-lg ${isCurrentRound ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Round {round}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRandomizeRound(round)} className="h-6 text-xs">
                              <Shuffle className="w-3 h-3 mr-1" /> Shuffle
                            </Button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {roundTeams.map((team, idx) => {
                              const isCurrentTeam = state?.currentTeamId === team.id;
                              const isCompleted = team.status === 'COMPLETED';
                              return (
                                <button
                                  key={team.id}
                                  onClick={() => handleSetTeam(team.id)}
                                  className={`px-3 py-1.5 rounded text-xs transition-all ${
                                    isCurrentTeam
                                      ? 'bg-primary text-primary-foreground'
                                      : isCompleted
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-secondary hover:bg-secondary/80'
                                  }`}
                                >
                                  #{team.presentationOrder || idx + 1} {team.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* AWARDS Controls */}
              {currentStageType === 'AWARDS' && (
                <motion.div
                  key="awards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-gold-500" />
                    <h3 className="font-semibold">Awards Ceremony Controls</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 3rd Place */}
                    <div className={`p-4 rounded-xl text-center ${
                      animationState.step >= 1 ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-secondary/50'
                    }`}>
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold text-white">
                        3
                      </div>
                      <p className="font-bold">3rd Place</p>
                      <p className="text-sm text-muted-foreground">
                        {animationState.step >= 1 ? '🎉 Revealed!' : 'Pending'}
                      </p>
                    </div>

                    {/* 2nd Place */}
                    <div className={`p-4 rounded-xl text-center ${
                      animationState.step >= 2 ? 'bg-gray-400/10 border border-gray-400/30' : 'bg-secondary/50'
                    }`}>
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-2xl font-bold text-white">
                        2
                      </div>
                      <p className="font-bold">2nd Place</p>
                      <p className="text-sm text-muted-foreground">
                        {animationState.step >= 2 ? '🎉 Revealed!' : 'Pending'}
                      </p>
                    </div>

                    {/* 1st Place */}
                    <div className={`p-4 rounded-xl text-center ${
                      animationState.step >= 3 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-secondary/50'
                    }`}>
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl font-bold text-white">
                        1
                      </div>
                      <p className="font-bold">1st Place</p>
                      <p className="text-sm text-muted-foreground">
                        {animationState.step >= 3 ? '🏆 WINNER!' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="gold"
                      size="lg"
                      className="flex-1"
                      onClick={handleNextAnimationStep}
                      disabled={animationState.step >= 3}
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      {animationState.step === 0 && 'Reveal 3rd Place'}
                      {animationState.step === 1 && 'Reveal 2nd Place'}
                      {animationState.step === 2 && 'Reveal 1st Place!'}
                      {animationState.step >= 3 && 'All Revealed!'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTriggerAnimation('awards', { step: 0 })}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {animationState.step >= 3 && (
                    <div className="mt-4 p-4 bg-green-500/10 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-bold text-green-500">Ceremony Complete!</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleLockAwards}>
                        Lock Results
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* BREAK Controls */}
              {currentStageType === 'BREAK' && (
                <motion.div
                  key="break"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Break Timer</h3>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className={`text-6xl font-mono font-bold ${
                      timer.isCritical ? 'text-red-500' : 'text-foreground'
                    }`}>
                      {timer.formatted}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <Button variant="outline" onClick={() => handleStartTimer('break', 300)}>5 min</Button>
                    <Button variant="outline" onClick={() => handleStartTimer('break', 600)}>10 min</Button>
                    <Button variant="outline" onClick={() => handleStartTimer('break', 900)}>15 min</Button>
                    <Button variant="outline" onClick={() => handleStartTimer('break', 1200)}>20 min</Button>
                  </div>
                </motion.div>
              )}

              {/* Default Controls for other stages */}
              {!['JURY_REVEAL', 'ROUND', 'AWARDS', 'BREAK'].includes(currentStageType || '') && (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-xl p-6 text-center"
                >
                  <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Use the stage navigation to control the event flow
                  </p>
                  <div className="flex justify-center gap-3 mt-4">
                    <Button variant="outline" onClick={handlePrevStage}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                    <Button variant="gold" onClick={handleNextStage}>
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
