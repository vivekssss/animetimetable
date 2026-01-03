
import { Anime } from '../types';

const ANILIST_URL = 'https://graphql.anilist.co';
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export const getCurrentSeasonInfo = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let seasonIndex = 0;
  if (month >= 0 && month <= 2) seasonIndex = 0;
  else if (month >= 3 && month <= 5) seasonIndex = 1;
  else if (month >= 6 && month <= 8) seasonIndex = 2;
  else seasonIndex = 3;

  const nextSeasonIndex = (seasonIndex + 1) % 4;
  const nextMonthName = new Date(year, month + 1, 1).toLocaleString('default', { month: 'long' });

  return {
    current: { season: SEASONS[seasonIndex], year },
    upcoming: { season: SEASONS[nextSeasonIndex], year: nextSeasonIndex === 0 ? year + 1 : year, monthName: nextMonthName }
  };
};

const cleanDescription = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '').trim() : 'No description available.';
};

const MEDIA_FIELDS = `
  id
  title { english romaji }
  coverImage { extraLarge large }
  bannerImage
  genres
  description
  averageScore
  trailer { id site }
  externalLinks { site url }
  studios(isMain: true) { nodes { name } }
  relations {
    nodes {
      id
      type
      title { english romaji }
      coverImage { large }
    }
  }
`;

const transformMedia = (m: any, airingAt?: number, ep?: number): Anime => ({
  id: `${m.id}-${airingAt || 0}-${ep || 0}`,
  anilistId: m.id,
  title: m.title.english || m.title.romaji,
  image: m.coverImage.extraLarge || m.coverImage.large,
  banner: m.bannerImage,
  airingDay: airingAt ? new Date(airingAt * 1000).getDay() : 0,
  airingTime: airingAt ? new Date(airingAt * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : 'TBA',
  rawAiringTime: airingAt || 0,
  genres: m.genres,
  description: cleanDescription(m.description),
  episode: ep || 0,
  score: m.averageScore ? m.averageScore / 10 : 0,
  studio: m.studios?.nodes?.[0]?.name || 'Unknown',
  trailer: m.trailer,
  externalLinks: m.externalLinks,
  relations: m.relations?.nodes?.map((n: any) => ({
    id: n.id,
    title: n.title.english || n.title.romaji,
    type: n.type,
    image: n.coverImage.large
  }))
});

export const fetchAllSchedules = async (weekOffset: number = 0) => {
  const now = Math.floor(Date.now() / 1000);
  const oneWeek = 60 * 60 * 24 * 7;

  const d = new Date();
  d.setDate(d.getDate() + (weekOffset * 7)); // Apply week offset
  const day = d.getDay();
  const diff = d.getDate() - day;
  const startOfWeekDate = new Date(d.setDate(diff));
  startOfWeekDate.setHours(0, 0, 0, 0);
  const startOfWeek = Math.floor(startOfWeekDate.getTime() / 1000);

  const { upcoming } = getCurrentSeasonInfo();

  const query = `
    query ($airingStart: Int, $airingEnd: Int, $upcomingSeason: MediaSeason, $upcomingYear: Int, $pastStart: Int, $pastEnd: Int) {
      airing: Page(page: 1, perPage: 100) {
        airingSchedules(airingAt_greater: $airingStart, airingAt_lesser: $airingEnd, sort: TIME) {
          airingAt
          episode
          media { ${MEDIA_FIELDS} }
        }
      }
      past: Page(page: 1, perPage: 25) {
        airingSchedules(airingAt_greater: $pastStart, airingAt_lesser: $pastEnd, sort: TIME_DESC) {
          airingAt
          episode
          media { ${MEDIA_FIELDS} }
        }
      }
      upcoming: Page(page: 1, perPage: 80) {
        media(season: $upcomingSeason, seasonYear: $upcomingYear, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME) {
           ${MEDIA_FIELDS}
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          airingStart: startOfWeek,
          airingEnd: startOfWeek + oneWeek,
          upcomingSeason: upcoming.season,
          upcomingYear: upcoming.year,
          pastStart: now - (86400 * 3),
          pastEnd: now
        }
      })
    });

    const json = await response.json();
    if (json.errors || !json.data) throw new Error(json.errors?.[0]?.message || "API Error");

    const { data } = json;
    return {
      currentData: data.airing?.airingSchedules?.map((s: any) => transformMedia(s.media, s.airingAt, s.episode)) || [],
      upcomingData: data.upcoming?.media?.map((m: any) => transformMedia(m)) || [],
      pastData: data.past?.airingSchedules?.map((s: any) => transformMedia(s.media, s.airingAt, s.episode)) || []
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const fetchAnimeById = async (id: number): Promise<Anime | null> => {
  try {
    const query = `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`;
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id } })
    });
    const json = await response.json();
    return json.data?.Media ? transformMedia(json.data.Media) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query ($q: String) { Page(perPage: 12) { media(search: $q, type: ANIME) { ${MEDIA_FIELDS} } } }`,
        variables: { q: query }
      })
    });
    const json = await response.json();
    return json.data?.Page?.media?.map((m: any) => transformMedia(m)) || [];
  } catch (err) {
    return [];
  }
};
