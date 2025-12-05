// Event Types
export type EventStatus = 'DRAFT' | 'CONFIGURED' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';

export type StageType =
  | 'LOBBY'
  | 'LOBBY_CARD_GRID'
  | 'WELCOME'
  | 'JURY_REVEAL'
  | 'ROUND'
  | 'TEAM_TRANSITION'
  | 'BREAK'
  | 'KEYNOTE'
  | 'SCORING'
  | 'AWARDS'
  | 'LEADERBOARD'
  | 'NETWORKING';

export type ProfileType = 'HOST' | 'JURY' | 'SPEAKER';

export type TeamStatus = 'REGISTERED' | 'APPROVED' | 'PRESENTING' | 'COMPLETED';

export type AssetType = 'BACKGROUND_IMAGE' | 'BACKGROUND_VIDEO' | 'LOGO' | 'ANIMATION' | 'AUDIO';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// Event
export interface Event {
  id: string;
  name: string;
  date: string;
  venue?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  stages?: EventStage[];
  teams?: Team[];
  profiles?: PersonProfile[];
  scoringCriteria?: ScoringCriteria[];
  liveState?: LiveState;
}

// Stage
export interface EventStage {
  id: string;
  eventId: string;
  title: string;
  stageType: StageType;
  orderIndex: number;
  startTimePlanned?: string;
  durationMinutes?: number;
  configuration: Record<string, any>;
  assets?: StageScreenAsset[];
}

export interface StageScreenAsset {
  id: string;
  stageId: string;
  assetType: AssetType;
  url: string;
  displayOrder: number;
  metadata: Record<string, any>;
}

// Team
export interface Team {
  id: string;
  eventId: string;
  name: string;
  university: string;
  rankGlobal?: number;
  rankBadge?: string;
  stats: Record<string, any>;
  strategyTagline?: string;
  strategyTearsheetUrl?: string;
  avatarCardImageUrl?: string;
  roundAssignment: number;
  presentationOrder?: number;
  status: TeamStatus;
  members?: TeamMember[];
  hasScored?: boolean;
}

export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  photoUrl?: string;
  role?: string;
  quote?: string;
  displayOrder: number;
}

// Profile
export interface PersonProfile {
  id: string;
  eventId: string;
  name: string;
  role: string;
  company?: string;
  photoUrl?: string;
  bioShort?: string;
  profileType: ProfileType;
  displayOrder: number;
  juryAuth?: {
    accessCode: string;
    lastLoginAt?: string;
  };
}

// Scoring
export interface ScoringCriteria {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
}

export interface TeamScore {
  id: string;
  teamId: string;
  juryId: string;
  criteriaScores: Record<string, number>;
  totalScore: number;
  submittedAt: string;
  isLocked: boolean;
}

// Live State
export interface TimerState {
  type: 'presentation' | 'qa' | 'break' | 'custom';
  status: TimerStatus;
  durationMs: number;
  serverStartTime: number;
  pausedRemainingMs?: number;
  label?: string;
}

export interface AnimationState {
  currentAnimation: string | null;
  step: number;
  totalSteps: number;
  params?: Record<string, any>;
}

export interface RoundState {
  currentRound: number;
  teamOrder: string[];
  currentTeamIndex: number;
  teamsCompleted: string[];
}

export interface LiveState {
  eventId: string;
  currentStageId: string | null;
  currentStage: EventStage | null;
  currentTeamId: string | null;
  currentTeam: Team | null;
  timerState: TimerState;
  animationState: AnimationState;
  roundState: RoundState;
  awardsLocked: boolean;
  updatedAt: string;
}

// Auth
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
}

export interface JuryUser {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Ranking
export interface TeamRanking {
  rank: number;
  teamId: string;
  teamName: string;
  university: string;
  roundAssignment: number;
  scoresCount: number;
  averageScore: number;
}

// Scoring Status
export interface ScoringStatus {
  total: number;
  submitted: number;
  jury: Array<{
    id: string;
    name: string;
    hasSubmitted: boolean;
  }>;
}

