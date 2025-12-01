import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, LogOut, User, AlertCircle, Star, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useSocket } from '@/shared/hooks/useSocket';
import { useLiveStateStore } from '@/shared/stores/liveStateStore';
import { juryApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { Team, ScoringCriteria } from '@/shared/types';

interface ScoreRecord {
  teamId: string;
  criteriaScores: Record<string, number>;
  submittedAt?: string;
}

export function JuryScoringPage() {
  const { user, logout } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
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
      const [teamsData, criteriaData, scoresData] = await Promise.all([
        juryApi.getTeams(),
        juryApi.getCriteria(),
        juryApi.getScores(),
      ]);
      setTeams(teamsData);
      setCriteria(criteriaData);
      setExistingScores(scoresData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get score status for a team
  const getTeamScoreStatus = (teamId: string) => {
    const score = existingScores.find(s => s.teamId === teamId);
    return {
      hasScored: !!score,
      score: score,
    };
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    
    // Load existing scores or initialize with defaults
    const existingScore = existingScores.find(s => s.teamId === team.id);
    if (existingScore?.criteriaScores) {
      setScores(existingScore.criteriaScores);
    } else {
      const initialScores: Record<string, number> = {};
      criteria.forEach((c) => {
        initialScores[c.id] = Math.ceil(c.maxScore / 2); // Default to middle value
      });
      setScores(initialScores);
    }
  };

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: score,
    }));
  };

  const handleResetScores = () => {
    const initialScores: Record<string, number> = {};
    criteria.forEach((c) => {
      initialScores[c.id] = Math.ceil(c.maxScore / 2);
    });
    setScores(initialScores);
  };

  const handleSubmit = async () => {
    if (!selectedTeam) return;
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const criteriaScores = Object.entries(scores).map(([criteriaId, score]) => ({
        criteriaId,
        score,
      }));

      await juryApi.submitScore(selectedTeam.id, criteriaScores);
      
      // Update existing scores
      setExistingScores(prev => {
        const filtered = prev.filter(s => s.teamId !== selectedTeam.id);
        return [...filtered, {
          teamId: selectedTeam.id,
          criteriaScores: scores,
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

  // Calculate total weighted score
  const totalScore = useMemo(() => {
    if (!criteria.length) return 0;
    let total = 0;
    let maxPossible = 0;
    criteria.forEach((c) => {
      total += (scores[c.id] || 0) * c.weight;
      maxPossible += c.maxScore * c.weight;
    });
    return { total: total.toFixed(1), max: maxPossible.toFixed(1), percentage: ((total / maxPossible) * 100).toFixed(0) };
  }, [scores, criteria]);

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
            className="bg-gradient-to-r from-primary/20 to-gold-500/20 border-b border-primary/30 overflow-hidden"
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
            // Scoring Form
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
                    <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center text-2xl font-bold text-navy-950">
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

              {/* Score Preview */}
              <div className="bg-gradient-to-br from-primary/10 to-gold-500/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Weighted Score</p>
                    <p className="text-4xl font-bold">
                      <span className="text-primary">{totalScore.total}</span>
                      <span className="text-xl text-muted-foreground">/{totalScore.max}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-primary">{totalScore.percentage}%</div>
                    <button
                      onClick={handleResetScores}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Criteria Sliders */}
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {criteria.map((criterion, index) => (
                  <motion.div
                    key={criterion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-lg">{criterion.name}</label>
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                            Weight: {criterion.weight}x
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold text-primary tabular-nums">
                          {scores[criterion.id] || Math.ceil(criterion.maxScore / 2)}
                        </span>
                        <span className="text-lg text-muted-foreground">/{criterion.maxScore}</span>
                      </div>
                    </div>
                    
                    <div className="relative mt-4">
                      <input
                        type="range"
                        min="1"
                        max={criterion.maxScore}
                        value={scores[criterion.id] || Math.ceil(criterion.maxScore / 2)}
                        onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                        className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((scores[criterion.id] || Math.ceil(criterion.maxScore / 2)) / criterion.maxScore) * 100}%, hsl(var(--secondary)) ${((scores[criterion.id] || Math.ceil(criterion.maxScore / 2)) / criterion.maxScore) * 100}%, hsl(var(--secondary)) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        {Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            onClick={() => handleScoreChange(criterion.id, n)}
                            className={`w-6 h-6 rounded-full transition-all ${
                              scores[criterion.id] === n
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'hover:bg-secondary'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                  {isSubmitting ? 'Submitting...' : 'Submit Scores'}
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
                            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center text-xl font-bold text-navy-950">
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
                    {scoredTeams.map((team) => (
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
                              <Check className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {team.university} • Round {team.roundAssignment}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-green-500 font-medium">Edit Score</span>
                        </div>
                      </motion.div>
                    ))}
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
              <h3 className="text-xl font-bold mb-2">Confirm Submission</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to submit your scores for <strong>{selectedTeam?.name}</strong>?
                You can still edit your scores later if needed.
              </p>
              <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-3xl font-bold text-primary">{totalScore.total}</p>
                </div>
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
          width: 24px;
          height: 24px;
          background: hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
      `}</style>
    </div>
  );
}
