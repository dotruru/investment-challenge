import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Settings, Award, Layers, UserCheck, BarChart, Plus, X, Trash2, Copy, Check, Upload } from 'lucide-react';
import { eventsApi, teamsApi, profilesApi, criteriaApi } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import { CSVImport } from '@/shared/components/ui/CSVImport';
import type { Event, Team, PersonProfile, ScoringCriteria } from '@/shared/types';

type TabType = 'overview' | 'teams' | 'jury' | 'stages' | 'criteria' | 'settings';

// Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showJuryModal, setShowJuryModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingJury, setEditingJury] = useState<PersonProfile | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<ScoringCriteria | null>(null);
  
  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', university: '', roundAssignment: 1, strategyTagline: '' });
  const [juryForm, setJuryForm] = useState({ name: '', role: '', company: '' });
  const [criteriaForm, setCriteriaForm] = useState({ name: '', description: '', maxScore: 10, weight: 1 });
  const [settingsForm, setSettingsForm] = useState({ name: '', status: 'DRAFT' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventsApi.get(eventId!);
      setEvent(data);
      setSettingsForm({ name: data.name, status: data.status });
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Team CRUD
  const handleSaveTeam = async () => {
    setIsSaving(true);
    try {
      if (editingTeam) {
        await teamsApi.update(eventId!, editingTeam.id, teamForm);
      } else {
        await teamsApi.create(eventId!, teamForm);
      }
      await loadEvent();
      setShowTeamModal(false);
      setEditingTeam(null);
      setTeamForm({ name: '', university: '', roundAssignment: 1, strategyTagline: '' });
    } catch (error) {
      console.error('Failed to save team:', error);
      alert('Failed to save team');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      university: team.university,
      roundAssignment: team.roundAssignment,
      strategyTagline: team.strategyTagline || '',
    });
    setShowTeamModal(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsApi.delete(eventId!, teamId);
      await loadEvent();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  // Jury CRUD
  const handleSaveJury = async () => {
    setIsSaving(true);
    try {
      if (editingJury) {
        await profilesApi.update(eventId!, editingJury.id, juryForm);
      } else {
        await profilesApi.create(eventId!, { ...juryForm, profileType: 'JURY' });
      }
      await loadEvent();
      setShowJuryModal(false);
      setEditingJury(null);
      setJuryForm({ name: '', role: '', company: '' });
    } catch (error) {
      console.error('Failed to save jury:', error);
      alert('Failed to save jury member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditJury = (jury: PersonProfile) => {
    setEditingJury(jury);
    setJuryForm({
      name: jury.name,
      role: jury.role,
      company: jury.company || '',
    });
    setShowJuryModal(true);
  };

  const handleDeleteJury = async (juryId: string) => {
    if (!confirm('Are you sure you want to delete this jury member?')) return;
    try {
      await profilesApi.delete(eventId!, juryId);
      await loadEvent();
    } catch (error) {
      console.error('Failed to delete jury:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Criteria CRUD
  const handleSaveCriteria = async () => {
    setIsSaving(true);
    try {
      if (editingCriteria) {
        await criteriaApi.update(eventId!, editingCriteria.id, criteriaForm);
      } else {
        await criteriaApi.create(eventId!, criteriaForm);
      }
      await loadEvent();
      setShowCriteriaModal(false);
      setEditingCriteria(null);
      setCriteriaForm({ name: '', description: '', maxScore: 10, weight: 1 });
    } catch (error) {
      console.error('Failed to save criteria:', error);
      alert('Failed to save criteria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCriteria = (criteria: ScoringCriteria) => {
    setEditingCriteria(criteria);
    setCriteriaForm({
      name: criteria.name,
      description: criteria.description || '',
      maxScore: criteria.maxScore,
      weight: criteria.weight,
    });
    setShowCriteriaModal(true);
  };

  const handleDeleteCriteria = async (criteriaId: string) => {
    if (!confirm('Are you sure you want to delete this criteria?')) return;
    try {
      await criteriaApi.delete(eventId!, criteriaId);
      await loadEvent();
    } catch (error) {
      console.error('Failed to delete criteria:', error);
    }
  };

  // Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await eventsApi.update(eventId!, settingsForm);
      await loadEvent();
      alert('Settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'jury', label: 'Jury', icon: UserCheck },
    { id: 'stages', label: 'Stages', icon: Layers },
    { id: 'criteria', label: 'Scoring', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Event not found</h2>
        <Link to="/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {new Date(event.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {event.venue && ` • ${event.venue}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              event.status === 'LIVE'
                ? 'bg-green-500/10 text-green-500'
                : event.status === 'COMPLETED'
                ? 'bg-gold-500/10 text-gold-500'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {event.status}
          </span>
          <a href={`http://localhost:5181/event/${eventId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="gold">Launch Operator</Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Teams</h3>
              </div>
              <p className="text-3xl font-bold">{event.teams?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Registered teams</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-semibold">Jury</h3>
              </div>
              <p className="text-3xl font-bold">
                {event.profiles?.filter((p) => p.profileType === 'JURY').length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Jury members</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold">Stages</h3>
              </div>
              <p className="text-3xl font-bold">{event.stages?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Event stages</p>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Teams ({event.teams?.length || 0})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="gold" size="sm" onClick={() => { setEditingTeam(null); setTeamForm({ name: '', university: '', roundAssignment: 1, strategyTagline: '' }); setShowTeamModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </div>
            </div>
            
            {event.teams && event.teams.length > 0 ? (
              <div className="space-y-3">
                {event.teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center text-navy-950 font-bold">
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {team.university} • Round {team.roundAssignment}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground mr-2">
                        {team.members?.length || 0} members
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => handleDeleteTeam(team.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No teams added yet. Click "Add Team" to create one.
              </div>
            )}
          </div>
        )}

        {activeTab === 'jury' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Jury Members ({event.profiles?.filter((p) => p.profileType === 'JURY').length || 0})</h2>
              <Button variant="gold" size="sm" onClick={() => { setEditingJury(null); setJuryForm({ name: '', role: '', company: '' }); setShowJuryModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Jury
              </Button>
            </div>
            
            {event.profiles?.filter((p) => p.profileType === 'JURY').length ? (
              <div className="space-y-3">
                {event.profiles
                  .filter((p) => p.profileType === 'JURY')
                  .map((jury) => (
                    <div
                      key={jury.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <span className="font-medium text-muted-foreground">
                            {jury.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{jury.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {jury.role}
                            {jury.company && ` • ${jury.company}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-secondary rounded text-sm font-mono font-bold tracking-wider">
                            {jury.juryAuth?.accessCode || 'N/A'}
                          </code>
                          <button 
                            onClick={() => handleCopyCode(jury.juryAuth?.accessCode || '')}
                            className="p-1.5 hover:bg-secondary rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === jury.juryAuth?.accessCode ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleEditJury(jury)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => handleDeleteJury(jury.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No jury members added yet. Click "Add Jury" to create one.
              </div>
            )}
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Event Stages ({event.stages?.length || 0})</h2>
            </div>
            
            {event.stages && event.stages.length > 0 ? (
              <div className="space-y-2">
                {event.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border/50"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-secondary rounded text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium">{stage.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stage.stageType}
                        {stage.durationMinutes && ` • ${stage.durationMinutes} min`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No stages configured
              </div>
            )}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Scoring Criteria ({event.scoringCriteria?.length || 0})</h2>
              <Button variant="gold" size="sm" onClick={() => { setEditingCriteria(null); setCriteriaForm({ name: '', description: '', maxScore: 10, weight: 1 }); setShowCriteriaModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Criteria
              </Button>
            </div>
            
            {event.scoringCriteria && event.scoringCriteria.length > 0 ? (
              <div className="space-y-3">
                {event.scoringCriteria.map((criteria) => (
                  <div
                    key={criteria.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{criteria.name}</h4>
                      {criteria.description && (
                        <p className="text-sm text-muted-foreground">{criteria.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Max: {criteria.maxScore} • Weight: {criteria.weight}x
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleEditCriteria(criteria)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => handleDeleteCriteria(criteria.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No scoring criteria defined. Click "Add Criteria" to create one.
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Event Settings</h2>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={settingsForm.status}
                  onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIGURED">Configured</option>
                  <option value="LIVE">Live</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <Button variant="gold" onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Team Modal */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => { setShowTeamModal(false); setEditingTeam(null); }}
        title={editingTeam ? 'Edit Team' : 'Add New Team'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTeam(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team Name *</label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alpha Capital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">University *</label>
            <input
              type="text"
              value={teamForm.university}
              onChange={(e) => setTeamForm({ ...teamForm, university: e.target.value })}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Oxford University"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Round Assignment *</label>
            <select
              value={teamForm.roundAssignment}
              onChange={(e) => setTeamForm({ ...teamForm, roundAssignment: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={1}>Round 1</option>
              <option value={2}>Round 2</option>
              <option value={3}>Round 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Strategy Tagline</label>
            <input
              type="text"
              value={teamForm.strategyTagline}
              onChange={(e) => setTeamForm({ ...teamForm, strategyTagline: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Quantitative approach to growth investing"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowTeamModal(false); setEditingTeam(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Jury Modal */}
      <Modal
        isOpen={showJuryModal}
        onClose={() => { setShowJuryModal(false); setEditingJury(null); }}
        title={editingJury ? 'Edit Jury Member' : 'Add New Jury Member'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveJury(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              value={juryForm.name}
              onChange={(e) => setJuryForm({ ...juryForm, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Dr. Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role / Title *</label>
            <input
              type="text"
              value={juryForm.role}
              onChange={(e) => setJuryForm({ ...juryForm, role: e.target.value })}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Managing Director"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <input
              type="text"
              value={juryForm.company}
              onChange={(e) => setJuryForm({ ...juryForm, company: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Goldman Sachs"
            />
          </div>
          {!editingJury && (
            <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              💡 An access code will be automatically generated for the jury member.
            </p>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowJuryModal(false); setEditingJury(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingJury ? 'Update Jury' : 'Create Jury'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Criteria Modal */}
      <Modal
        isOpen={showCriteriaModal}
        onClose={() => { setShowCriteriaModal(false); setEditingCriteria(null); }}
        title={editingCriteria ? 'Edit Scoring Criteria' : 'Add Scoring Criteria'}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveCriteria(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Criteria Name *</label>
            <input
              type="text"
              value={criteriaForm.name}
              onChange={(e) => setCriteriaForm({ ...criteriaForm, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Investment Thesis Quality"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={criteriaForm.description}
              onChange={(e) => setCriteriaForm({ ...criteriaForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Clarity and strength of the investment idea"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Score</label>
              <input
                type="number"
                value={criteriaForm.maxScore}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, maxScore: parseInt(e.target.value) })}
                min={1}
                max={100}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight</label>
              <input
                type="number"
                value={criteriaForm.weight}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, weight: parseFloat(e.target.value) })}
                min={0.1}
                max={10}
                step={0.1}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCriteriaModal(false); setEditingCriteria(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingCriteria ? 'Update Criteria' : 'Create Criteria'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImport
          title="Import Teams from CSV"
          templateFileName="teams-template.csv"
          columns={[
            { key: 'name', label: 'Team Name', required: true },
            { key: 'university', label: 'University', required: true },
            { key: 'roundAssignment', label: 'Round (1-3)', required: true, type: 'number' },
            { key: 'strategyTagline', label: 'Strategy Tagline' },
            { key: 'memberNames', label: 'Members (semicolon separated)' },
          ]}
          onImport={async (data) => {
            const result = await teamsApi.import(eventId!, data);
            if (result.success) {
              await loadEvent();
            }
            return result;
          }}
          onClose={() => setShowCSVImport(false)}
        />
      )}
    </div>
  );
}
