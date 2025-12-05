import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, LogOut, User, AlertCircle, Star, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useSocket } from '@/shared/hooks/useSocket';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { juryApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { Team } from '@/shared/types';

interface ScoreRecord {
  teamId: string;
  score: number;
  submittedAt?: string;
}

export function JuryScoringPage() {
  const { user, logout } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [score, setScore] = useState<number>(50);
  const [existingScores, setExistingScores] = useState<ScoreRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const eventId = localStorage.getItem('juryEventId') || '';
  const { connectionState } = useSocket({
    eventId,
    clientType: 'jury',
    juryId: (user as any)?.id,
  });

  const { state } = useLiveStateStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsData, scoresData] = await Promise.all([
        juryApi.getTeams(),
        juryApi.getScores(),
      ]);
      setTeams(teamsData);
      // Transform old format to simple score
      const simplifiedScores = (scoresData || []).map((s: any) => ({
        teamId: s.teamId,
        score: s.totalScore || Object.values(s.criteriaScores || {})[0] || 50,
        submittedAt: s.submittedAt,
      }));
      setExistingScores(simplifiedScores);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get score status for a team
  const getTeamScoreStatus = (teamId: string) => {
    const scoreRecord = existingScores.find(s => s.teamId === teamId);
    return {
      hasScored: !!scoreRecord,
      score: scoreRecord?.score,
    };
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    const existingScore = existingScores.find(s => s.teamId === team.id);
    setScore(existingScore?.score || 50);
  };

  const handleSubmit = async () => {
    if (!selectedTeam) return;
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      // Submit as simple score (backend will handle)
      await juryApi.submitSimpleScore(selectedTeam.id, score);
      
      // Update existing scores
      setExistingScores(prev => {
        const filtered = prev.filter(s => s.teamId !== selectedTeam.id);
        return [...filtered, {
          teamId: selectedTeam.id,
          score: score,
          submittedAt: new Date().toISOString(),
        }];
      });
      
      setSelectedTeam(null);
    } catch (error) {
      console.error('Failed to submit score:', error);
      alert('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get score color based on value
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-cyan-400';
    if (value >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (value: number) => {
    if (value >= 80) return 'from-green-500 to-emerald-400';
    if (value >= 60) return 'from-cyan-500 to-blue-400';
    if (value >= 40) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-rose-400';
  };

  // Separate scored and unscored teams
  const { scoredTeams, unscoredTeams } = useMemo(() => {
    const scored: Team[] = [];
    const unscored: Team[] = [];
    teams.forEach(team => {
      if (getTeamScoreStatus(team.id).hasScored) {
        scored.push(team);
      } else {
        unscored.push(team);
      }
    });
    return { scoredTeams: scored, unscoredTeams: unscored };
  }, [teams, existingScores]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading scoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Jury Scoring</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{(user as any)?.name || 'Jury Member'}</span>
              <span
                className={`ml-2 flex items-center gap-1 ${
                  connectionState.isConnected ? 'text-green-500' : 'text-red-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                {connectionState.isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <span className="text-muted-foreground">Scored: </span>
              <span className="font-bold text-green-500">{scoredTeams.length}</span>
              <span className="text-muted-foreground">/{teams.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Current Team Banner */}
      <AnimatePresence>
        {state?.currentTeam && !selectedTeam && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-mcd-500/20 to-cyan-500/20 border-b border-mcd-500/30 overflow-hidden"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Now presenting</p>
                  <p className="font-bold text-lg">{state.currentTeam.name}</p>
                </div>
              </div>
              <Button
                variant="gold"
                onClick={() => handleSelectTeam(state.currentTeam!)}
                disabled={getTeamScoreStatus(state.currentTeam.id).hasScored}
              >
                {getTeamScoreStatus(state.currentTeam.id).hasScored ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Already Scored
                  </>
                ) : (
                  <>
                    Score Now
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {selectedTeam ? (
            // Scoring Form - SIMPLIFIED to single 0-100 score
            <motion.div
              key="scoring-form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* Team Header */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                      {selectedTeam.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                      <p className="text-muted-foreground">{selectedTeam.university}</p>
                      <p className="text-sm text-muted-foreground mt-1">Round {selectedTeam.roundAssignment}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
                    ← Back to List
                  </Button>
                </div>
              </div>

              {/* Score Display - Large & Centered */}
              <div className={`bg-gradient-to-br ${getScoreGradient(score)}/10 border border-${getScoreColor(score).replace('text-', '')}/30 rounded-2xl p-8`}>
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground mb-2">Your Score</p>
                  <motion.div
                    key={score}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`text-9xl font-bold ${getScoreColor(score)} tabular-nums`}
                  >
                    {score}
                  </motion.div>
                  <p className="text-2xl text-muted-foreground mt-2">out of 100</p>
                </div>

                {/* Score Slider */}
                <div className="max-w-2xl mx-auto">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className="w-full h-4 bg-secondary rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${score}%, hsl(var(--secondary)) ${score}%, hsl(var(--secondary)) 100%)`,
                    }}
                  />
                  
                  {/* Score markers */}
                  <div className="flex justify-between mt-4 px-1">
                    {[0, 25, 50, 75, 100].map((marker) => (
                      <button
                        key={marker}
                        onClick={() => setScore(marker)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          score === marker
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {marker}
                      </button>
                    ))}
                  </div>

                  {/* Quick score buttons */}
                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      onClick={() => setScore(Math.max(0, score - 10))}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => setScore(Math.max(0, score - 5))}
                      className="px-4 py-2 bg-orange-500/20 text-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => setScore(50)}
                      className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={() => setScore(Math.min(100, score + 5))}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-500 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => setScore(Math.min(100, score + 10))}
                      className="px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Score Guidelines */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Scoring Guide</h3>
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="font-bold text-red-500">0-39</p>
                    <p className="text-muted-foreground">Needs Work</p>
                        </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <p className="font-bold text-yellow-500">40-59</p>
                    <p className="text-muted-foreground">Fair</p>
                      </div>
                  <div className="p-3 bg-cyan-500/10 rounded-lg">
                    <p className="font-bold text-cyan-500">60-79</p>
                    <p className="text-muted-foreground">Good</p>
                      </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="font-bold text-green-500">80-100</p>
                    <p className="text-muted-foreground">Excellent</p>
                      </div>
                    </div>
              </div>

              {/* Submit Button */}
              <div className="sticky bottom-6">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full py-6 text-lg shadow-lg"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : `Submit Score: ${score}/100`}
                </Button>
              </div>
            </motion.div>
          ) : (
            // Teams List
            <motion.div
              key="teams-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Your Progress</h2>
                  <span className="text-sm text-muted-foreground">
                    {scoredTeams.length} of {teams.length} teams scored
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(scoredTeams.length / teams.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  />
                </div>
                {scoredTeams.length === teams.length && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center gap-2 text-green-500">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">All teams scored! Great job!</span>
                  </div>
                )}
              </div>

              {/* Teams to Score */}
              {unscoredTeams.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Teams to Score ({unscoredTeams.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unscoredTeams.map((team) => (
                      <motion.div
                        key={team.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-card border border-border hover:border-primary/50 rounded-xl p-4 cursor-pointer transition-colors"
                        onClick={() => handleSelectTeam(team)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-mcd-500 to-cyan-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">
                              {team.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {team.university} • Round {team.roundAssignment}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scored Teams */}
              {scoredTeams.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Scored Teams ({scoredTeams.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoredTeams.map((team) => {
                      const teamScore = getTeamScoreStatus(team.id).score || 0;
                      return (
                      <motion.div
                        key={team.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-green-500/5 border border-green-500/30 rounded-xl p-4 cursor-pointer"
                        onClick={() => handleSelectTeam(team)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <span className={`text-xl font-bold ${getScoreColor(teamScore)}`}>
                                  {teamScore}
                                </span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {team.university} • Round {team.roundAssignment}
                              </p>
                            </div>
                          </div>
                            <span className="text-sm text-green-500 font-medium">Edit</span>
                        </div>
                      </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {teams.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Available</h3>
                  <p className="text-muted-foreground">
                    Teams will appear here once the event begins.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirmDialog(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-2">Confirm Score</h3>
              <p className="text-muted-foreground mb-6">
                Submit score for <strong>{selectedTeam?.name}</strong>?
              </p>
              <div className="bg-secondary/50 rounded-lg p-6 mb-6 text-center">
                <p className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</p>
                <p className="text-muted-foreground mt-1">out of 100</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 32px;
          height: 32px;
          background: hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 4px solid white;
        }
        input[type="range"]::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 4px solid white;
        }
      `}</style>
    </div>
  );
}
