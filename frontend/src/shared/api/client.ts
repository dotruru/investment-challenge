const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface RequestOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { data, ...customConfig } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...headers,
        ...options.headers,
      },
      ...customConfig,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', data });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint: string, file: File, fieldName = 'file'): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth endpoints
export const authApi = {
  loginAdmin: (email: string, password: string) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/admin/login', { email, password }),
  
  registerAdmin: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/admin/register', data),
  
  loginJury: (accessCode: string) =>
    api.post<{ jury: any; event: any; accessToken: string; refreshToken: string }>('/auth/jury/login', { accessCode }),
  
  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/admin/refresh', { refreshToken }),
};

// Events endpoints
export const eventsApi = {
  list: () => api.get<any[]>('/events'),
  get: (id: string) => api.get<any>(`/events/${id}`),
  create: (data: { name: string; date: string; venue?: string }) => api.post<any>('/events', data),
  update: (id: string, data: any) => api.put<any>(`/events/${id}`, data),
  delete: (id: string) => api.delete<any>(`/events/${id}`),
  getDisplay: (id: string) => api.get<any>(`/events/${id}/display`),
};

// Teams endpoints
export const teamsApi = {
  list: (eventId: string) => api.get<any[]>(`/events/${eventId}/teams`),
  get: (eventId: string, teamId: string) => api.get<any>(`/events/${eventId}/teams/${teamId}`),
  create: (eventId: string, data: any) => api.post<any>(`/events/${eventId}/teams`, data),
  update: (eventId: string, teamId: string, data: any) => api.put<any>(`/events/${eventId}/teams/${teamId}`, data),
  delete: (eventId: string, teamId: string) => api.delete<any>(`/events/${eventId}/teams/${teamId}`),
  import: (eventId: string, teams: any[]) => api.post<any>(`/events/${eventId}/teams/import`, { teams }),
  addMember: (eventId: string, teamId: string, data: any) => api.post<any>(`/events/${eventId}/teams/${teamId}/members`, data),
  updateMember: (eventId: string, teamId: string, memberId: string, data: any) =>
    api.put<any>(`/events/${eventId}/teams/${teamId}/members/${memberId}`, data),
  removeMember: (eventId: string, teamId: string, memberId: string) =>
    api.delete<any>(`/events/${eventId}/teams/${teamId}/members/${memberId}`),
};

// Profiles endpoints
export const profilesApi = {
  list: (eventId: string) => api.get<any[]>(`/events/${eventId}/profiles`),
  getJury: (eventId: string) => api.get<any[]>(`/events/${eventId}/profiles/jury`),
  get: (eventId: string, profileId: string) => api.get<any>(`/events/${eventId}/profiles/${profileId}`),
  create: (eventId: string, data: any) => api.post<any>(`/events/${eventId}/profiles`, data),
  update: (eventId: string, profileId: string, data: any) => api.put<any>(`/events/${eventId}/profiles/${profileId}`, data),
  delete: (eventId: string, profileId: string) => api.delete<any>(`/events/${eventId}/profiles/${profileId}`),
  regenerateCode: (eventId: string, profileId: string) => api.post<any>(`/events/${eventId}/profiles/${profileId}/regenerate-code`),
};

// Criteria endpoints
export const criteriaApi = {
  list: (eventId: string) => api.get<any[]>(`/events/${eventId}/criteria`),
  create: (eventId: string, data: any) => api.post<any>(`/events/${eventId}/criteria`, data),
  update: (eventId: string, criteriaId: string, data: any) => api.put<any>(`/events/${eventId}/criteria/${criteriaId}`, data),
  delete: (eventId: string, criteriaId: string) => api.delete<any>(`/events/${eventId}/criteria/${criteriaId}`),
  getRankings: (eventId: string) => api.get<any[]>(`/events/${eventId}/criteria/rankings`),
};

// Operator endpoints
export const operatorApi = {
  getState: (eventId: string) => api.get<any>(`/operator/events/${eventId}/state`),
  setStage: (eventId: string, stageId: string) => api.post<any>(`/operator/events/${eventId}/stage`, { stageId }),
  setTeam: (eventId: string, teamId: string) => api.post<any>(`/operator/events/${eventId}/team`, { teamId }),
  nextTeam: (eventId: string) => api.post<any>(`/operator/events/${eventId}/team/next`),
  startTimer: (eventId: string, type: string, durationSeconds: number, label?: string) =>
    api.post<any>(`/operator/events/${eventId}/timer/start`, { type, durationSeconds, label }),
  pauseTimer: (eventId: string) => api.post<any>(`/operator/events/${eventId}/timer/pause`),
  resumeTimer: (eventId: string) => api.post<any>(`/operator/events/${eventId}/timer/resume`),
  resetTimer: (eventId: string) => api.post<any>(`/operator/events/${eventId}/timer/reset`),
  randomizeRound: (eventId: string, roundNumber: number) =>
    api.post<any>(`/operator/events/${eventId}/round/randomize`, { roundNumber }),
  triggerAnimation: (eventId: string, animation: string, params?: any) =>
    api.post<any>(`/operator/events/${eventId}/animation/trigger`, { animation, params }),
  nextAnimationStep: (eventId: string) => api.post<any>(`/operator/events/${eventId}/animation/next`),
  getScoringStatus: (eventId: string) => api.get<any>(`/operator/events/${eventId}/scores/status`),
  lockAwards: (eventId: string) => api.post<any>(`/operator/events/${eventId}/awards/lock`),
  getResults: (eventId: string) => api.get<any>(`/operator/events/${eventId}/awards/results`),
};

// Jury endpoints
export const juryApi = {
  getEvent: () => api.get<any>('/jury/event'),
  getTeams: () => api.get<any[]>('/jury/teams'),
  getTeamDetails: (teamId: string) => api.get<any>(`/jury/teams/${teamId}`),
  getScores: () => api.get<any[]>('/jury/scores'),
  submitScore: (teamId: string, criteriaScores: Array<{ criteriaId: string; score: number }>) =>
    api.post<any>(`/jury/scores/${teamId}`, { criteriaScores }),
  getCurrentTeam: () => api.get<any>('/jury/current'),
  getCriteria: () => api.get<any[]>('/jury/criteria'),
};

// Upload endpoints
export const uploadApi = {
  image: (file: File) => api.upload('/upload/image', file),
  document: (file: File) => api.upload('/upload/document', file),
};

