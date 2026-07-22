
export interface Anime {
  id: string;
  anilistId: number;
  title: string;
  image: string;
  banner?: string;
  airingDay: number; 
  airingTime: string;
  rawAiringTime: number; // UTC timestamp
  genres: string[];
  description: string;
  episode: number;
  score: number;
  studio: string;
  isUpcoming?: boolean;
  format?: string;
  status?: string;
  duration?: number;
  synonyms?: string[];
  startDate?: string;
  endDate?: string;
  trailer?: {
    id: string;
    site: string;
  };
  externalLinks?: {
    site: string;
    url: string;
  }[];
  relations?: {
    id: number;
    title: string;
    type: string;
    image: string;
  }[];
}

export type ViewMode = 'airing' | 'upcoming';
