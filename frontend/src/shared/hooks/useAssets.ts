import { useState, useEffect } from 'react';

// Asset manifest types
export interface TeamMemberAsset {
  name: string;
  photo: string;
  role?: string;
  quote?: string;
  unverified?: boolean;
}

export interface TeamMetrics {
  return: number | null;
  sharpe: number | null;
  volatility: number | null;
  annualised: boolean;
}

export interface TeamAsset {
  id: string;
  name: string;
  university: string;
  logo: string | null;
  logoPlaceholder?: string;
  presentation: string;
  metrics: TeamMetrics;
  members: TeamMemberAsset[];
}

export interface PersonAsset {
  id: string;
  name: string;
  role: string;
  company?: string;
  companyLogo?: string;
  photo: string;
  bio: string;
  credentials?: string;
  order?: number;
}

export interface OrganiserPartner {
  name: string;
  logoLight: string;
  logoDark: string;
}

export interface IndustryPartner {
  name: string;
  logoLight?: string;
  logoDark?: string;
  logo?: string;
}

export interface EventPartner {
  name: string;
  logo: string;
}

export interface UniversityPartner {
  name: string;
  logo: string;
}

export interface Partners {
  organisers: OrganiserPartner[];
  industry: IndustryPartner[];
  event: EventPartner[];
  universities: UniversityPartner[];
  societies: string[];
}

export interface AssetManifest {
  version: string;
  updatedAt: string;
  event: {
    name: string;
    logos: {
      light: string;
      dark: string;
    };
  };
  hosts: PersonAsset[];
  speakers: PersonAsset[];
  jury: PersonAsset[];
  teams: TeamAsset[];
  partners: Partners;
}

const MANIFEST_URL = '/assets/index.json';

let cachedManifest: AssetManifest | null = null;
let fetchPromise: Promise<AssetManifest> | null = null;

async function fetchManifest(): Promise<AssetManifest> {
  if (cachedManifest) return cachedManifest;
  
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = fetch(MANIFEST_URL)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load asset manifest: ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedManifest = data;
      return data;
    });
  
  return fetchPromise;
}

export function useAssets() {
  const [manifest, setManifest] = useState<AssetManifest | null>(cachedManifest);
  const [loading, setLoading] = useState(!cachedManifest);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedManifest) {
      setManifest(cachedManifest);
      setLoading(false);
      return;
    }

    fetchManifest()
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Helper functions
  const getTeam = (teamId: string) => 
    manifest?.teams.find(t => t.id === teamId);

  // Search by various identifiers (id, name, slug-like formats, partial matches)
  const getTeamAssets = (identifier: string) => {
    if (!manifest?.teams || !identifier) return null;
    
    const normalized = identifier.toLowerCase().replace(/[\s-_]+/g, '');
    
    // Try exact matches first
    let found = manifest.teams.find(t => 
      t.id === identifier || 
      t.name.toLowerCase() === identifier.toLowerCase()
    );
    
    if (found) return found;
    
    // Try normalized matches (remove spaces, dashes, underscores)
    found = manifest.teams.find(t => {
      const teamId = t.id.toLowerCase().replace(/[\s-_]+/g, '');
      const teamName = t.name.toLowerCase().replace(/[\s-_]+/g, '');
      return teamId === normalized || teamName === normalized;
    });
    
    if (found) return found;
    
    // Try partial/contains match as last resort
    found = manifest.teams.find(t => {
      const teamName = t.name.toLowerCase();
      const searchTerm = identifier.toLowerCase();
      return teamName.includes(searchTerm) || searchTerm.includes(teamName);
    });
    
    return found || null;
  };

  const getSpeaker = (speakerId: string) =>
    manifest?.speakers.find(s => s.id === speakerId);

  const getJury = (juryId: string) =>
    manifest?.jury.find(j => j.id === juryId);

  const getHost = (hostId: string) =>
    manifest?.hosts.find(h => h.id === hostId);

  return {
    manifest,
    loading,
    error,
    // Data shortcuts
    teams: manifest?.teams ?? [],
    hosts: manifest?.hosts ?? [],
    speakers: manifest?.speakers ?? [],
    jury: manifest?.jury ?? [],
    partners: manifest?.partners ?? null,
    event: manifest?.event ?? null,
    // Helper functions
    getTeam,
    getTeamAssets,
    getSpeaker,
    getJury,
    getHost,
  };
}

// Pre-fetch function to load assets early
export function prefetchAssets() {
  fetchManifest().catch(console.error);
}

