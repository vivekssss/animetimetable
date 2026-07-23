
import { Anime } from '../types';

const ANILIST_URL = 'https://graphql.anilist.co';
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export const getCurrentSeasonInfo = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  // 0: WINTER (Jan-Mar), 1: SPRING (Apr-Jun), 2: SUMMER (Jul-Sep), 3: FALL (Oct-Dec)
  const seasonIndex = Math.floor(month / 3);
  const nextSeasonIndex = (seasonIndex + 1) % 4;
  const nextSeasonYear = nextSeasonIndex === 0 ? year + 1 : year;

  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthName = nextMonthDate.toLocaleString('default', { month: 'long' });

  return {
    current: { season: SEASONS[seasonIndex], year },
    upcoming: { 
      season: SEASONS[nextSeasonIndex], 
      year: nextSeasonYear, 
      monthName: nextMonthName,
      seasonName: SEASONS[nextSeasonIndex]
    }
  };
};

const cleanDescription = (html: string) => {
  if (!html) return 'No description available.';
  return html.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
};

const MEDIA_FIELDS = `
  id
  title { english romaji native }
  coverImage { extraLarge large }
  bannerImage
  genres
  description
  averageScore
  format
  status
  duration
  synonyms
  startDate { year month day }
  endDate { year month day }
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

const formatDate = (dateObj: any) => {
  if (!dateObj || !dateObj.year) return 'TBA';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[dateObj.month - 1]} ${dateObj.day}, ${dateObj.year}`;
};

const transformMedia = (m: any, airingAt?: number, ep?: number): Anime => ({
  id: `${m.id}-${airingAt || 0}-${ep || 0}`,
  anilistId: m.id,
  title: m.title.english || m.title.romaji || m.title.native,
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
  format: m.format,
  status: m.status,
  duration: m.duration,
  synonyms: m.synonyms,
  startDate: formatDate(m.startDate),
  endDate: formatDate(m.endDate),
  trailer: m.trailer,
  externalLinks: m.externalLinks,
  isUpcoming: m.status === 'NOT_YET_RELEASED',
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
  d.setDate(d.getDate() + (weekOffset * 7));
  const day = d.getDay();
  const diff = d.getDate() - day;
  const startOfWeekDate = new Date(d);
  startOfWeekDate.setDate(diff);
  startOfWeekDate.setHours(0, 0, 0, 0);
  const startOfWeek = Math.floor(startOfWeekDate.getTime() / 1000);

  const { upcoming } = getCurrentSeasonInfo();

  const query = `
    query ($airingStart: Int, $airingEnd: Int, $upcomingSeason: MediaSeason, $upcomingYear: Int, $pastStart: Int, $pastEnd: Int) {
      airing: Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $airingStart, airingAt_lesser: $airingEnd, sort: TIME) {
          airingAt
          episode
          media { ${MEDIA_FIELDS} }
        }
      }
      airing2: Page(page: 2, perPage: 50) {
        airingSchedules(airingAt_greater: $airingStart, airingAt_lesser: $airingEnd, sort: TIME) {
          airingAt
          episode
          media { ${MEDIA_FIELDS} }
        }
      }
      airing3: Page(page: 3, perPage: 50) {
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
        media(status: NOT_YET_RELEASED, sort: TRENDING_DESC, type: ANIME) {
           ${MEDIA_FIELDS}
        }
      }
      seasonal: Page(page: 1, perPage: 80) {
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
    if (json.errors) {
      console.warn("Anilist API partial errors:", json.errors);
    }
    
    if (!json.data) throw new Error("API Error: No data returned");

    const { data } = json;
    const combinedAiring = [
      ...(data.airing?.airingSchedules || []),
      ...(data.airing2?.airingSchedules || []),
      ...(data.airing3?.airingSchedules || [])
    ];

    // Prefer seasonal data if available, otherwise fallback to general upcoming
    const rawUpcoming = (data.seasonal?.media?.length > 0) ? data.seasonal.media : (data.upcoming?.media || []);

    return {
      currentData: combinedAiring.map((s: any) => transformMedia(s.media, s.airingAt, s.episode)) || [],
      upcomingData: rawUpcoming.map((m: any) => transformMedia(m)) || [],
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

export const searchAnime = async (query?: string, genre?: string, sort: string = "POPULARITY_DESC"): Promise<Anime[]> => {
  try {
    const variables: any = {};
    const queryArgs: string[] = [];

    if (query && query.trim()) {
      variables.q = query.trim();
      queryArgs.push("search: $q");
    }
    if (genre && genre.trim()) {
      variables.genre = genre.trim();
      queryArgs.push("genre: $genre");
    }
    if (sort) {
      variables.sort = [sort];
      queryArgs.push("sort: $sort");
    }

    const argsString = queryArgs.length > 0 ? `(${queryArgs.join(", ")}, type: ANIME)` : `(type: ANIME)`;
    const varDefs: string[] = [];
    if (variables.q) varDefs.push("$q: String");
    if (variables.genre) varDefs.push("$genre: String");
    if (variables.sort) varDefs.push("$sort: [MediaSort]");
    const varDefString = varDefs.length > 0 ? `(${varDefs.join(", ")})` : "";

    const gqlQuery = `query ${varDefString} { Page(perPage: 12) { media${argsString} { ${MEDIA_FIELDS} } } }`;

    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: gqlQuery,
        variables
      })
    });
    const json = await response.json();
    return json.data?.Page?.media?.map((m: any) => transformMedia(m)) || [];
  } catch (err) {
    console.error("searchAnime error:", err);
    return [];
  }
};
