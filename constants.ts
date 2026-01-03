
import { Anime } from './types';

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Added missing required properties 'anilistId' and 'rawAiringTime' to match Anime interface
export const MOCK_ANIME_DATA: Anime[] = [
  {
    id: '1',
    anilistId: 100001,
    title: 'Blue Lock: VS. U-20 JAPAN',
    image: 'https://picsum.photos/seed/anime1/400/600',
    airingDay: 6,
    airingTime: '23:30',
    rawAiringTime: Math.floor(Date.now() / 1000),
    genres: ['Sports', 'Shounen'],
    description: 'The intense battle for survival continues as the Blue Lock project faces its biggest challenge yet.',
    episode: 12,
    score: 8.4,
    studio: '8bit'
  },
  {
    id: '2',
    anilistId: 100002,
    title: 'Re:Zero Season 3',
    image: 'https://picsum.photos/seed/anime2/400/600',
    airingDay: 3,
    airingTime: '22:30',
    rawAiringTime: Math.floor(Date.now() / 1000),
    genres: ['Fantasy', 'Drama', 'Psychological'],
    description: 'Subaru Natsuki continues his struggle against fate in the kingdom of Lugunica.',
    episode: 1,
    score: 8.9,
    studio: 'White Fox'
  },
  {
    id: '3',
    anilistId: 100003,
    title: 'Bleach: Thousand-Year Blood War',
    image: 'https://picsum.photos/seed/anime3/400/600',
    airingDay: 6,
    airingTime: '23:00',
    rawAiringTime: Math.floor(Date.now() / 1000),
    genres: ['Action', 'Fantasy'],
    description: 'The final arc of the legendary Bleach series reaches its climax.',
    episode: 27,
    score: 9.1,
    studio: 'Pierrot'
  },
  {
    id: '4',
    anilistId: 100004,
    title: 'DanMachi V',
    image: 'https://picsum.photos/seed/anime4/400/600',
    airingDay: 4,
    airingTime: '23:00',
    rawAiringTime: Math.floor(Date.now() / 1000),
    genres: ['Adventure', 'Fantasy'],
    description: 'Bell Cranel dives deeper into the Dungeon to protect those he loves.',
    episode: 5,
    score: 7.8,
    studio: 'J.C.Staff'
  },
  {
    id: '5',
    anilistId: 100005,
    title: 'Shangri-La Frontier S2',
    image: 'https://picsum.photos/seed/anime5/400/600',
    airingDay: 0,
    airingTime: '17:00',
    rawAiringTime: Math.floor(Date.now() / 1000),
    genres: ['Action', 'Adventure'],
    description: 'The "Trash-Game Hunter" Sunraku takes on the ultimate VRMMO challenge.',
    episode: 4,
    score: 8.2,
    studio: 'C2C'
  }
];
