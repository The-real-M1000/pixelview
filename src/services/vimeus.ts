const VIMEUS_API_KEY = import.meta.env.VITE_VIMEUS_API_KEY;
const VIMEUS_VIEW_KEY = import.meta.env.VITE_VIMEUS_VIEW_KEY;
const VIMEUS_BASE_URL = "https://vimeus.com";

export interface VimeusMovie {
  id: number;
  content_type: "movie";
  tmdb_id: number;
  imdb_id: string;
  title: string;
  poster: string;
  backdrop: string;
  synced_at: string;
}

export interface VimeusSeries {
  id: number;
  content_type: "series";
  tmdb_id: number;
  imdb_id: string;
  title: string;
  poster: string;
  backdrop: string;
  total_seasons: number;
  total_episodes: number;
  synced_at: string;
}

export interface VimeusAnime {
  id: number;
  content_type: "anime";
  tmdb_id: number;
  imdb_id: string;
  title: string;
  poster: string;
  backdrop: string;
  total_seasons: number;
  total_episodes: number;
  synced_at: string;
}

export interface VimeusEpisode {
  id: number;
  content_type: "series" | "anime";
  tmdb_id: number;
  imdb_id: string;
  title: string;
  poster: string;
  backdrop: string;
  season: number;
  episode: number;
  synced_at: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_results: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

interface VimeusResponse<T> {
  error: boolean;
  message: string;
  data: T & { pagination: Pagination };
}

// Fetch helper with API Key headers
async function vimeusFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const queryParams = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null) {
        acc[key] = String(val);
      }
      return acc;
    }, {} as Record<string, string>)
  );

  const url = `${VIMEUS_BASE_URL}${path}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
  console.log(`Vimeus fetch URL: ${url}`);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-API-Key": VIMEUS_API_KEY
    }
  });

  if (!response.ok) {
    console.error(`Vimeus API request failed: ${response.status} ${response.statusText}`);
    // Try to read error body for more info
    try {
      const errBody = await response.text();
      console.error('Vimeus error body:', errBody);
    } catch (e) {
      console.error('Failed to read Vimeus error body', e);
    }
    // Return a safe empty structure to avoid breaking callers
    return {
      error: false,
      message: "",
      data: {
        pagination: {
          current_page: 0,
          total_pages: 0,
          total_results: 0,
          per_page: 0,
          has_next: false,
          has_prev: false
        },
        movies: [],
        series: [],
        animes: [],
        episodes: []
      }
    } as any;
  }

  const json = await response.json();
  if (json.error) {
    console.error(`Vimeus API returned error: ${json.message}`);
    throw new Error(`Vimeus API returned error: ${json.message}`);
  }

  return json as T;
}

export const vimeusApi = {
  // List Movies
  listMovies: async (page = 1) => {
    try {
      return await vimeusFetch<VimeusResponse<{ movies: VimeusMovie[] }>>("/api/listing/movies", { page });
    } catch (e) {
      console.error('Failed to fetch movies from Vimeus API:', e);
      return { error: false, message: '', data: { pagination: { current_page: 0, total_pages: 0, total_results: 0, per_page: 0, has_next: false, has_prev: false }, movies: [] } } as any;
    }
  },

  // List Series
  listSeries: async (page = 1) => {
    try {
      return await vimeusFetch<VimeusResponse<{ series: VimeusSeries[] }>>('/api/listing/series', { page });
    } catch (e) {
      console.error('Failed to fetch series from Vimeus API:', e);
      return { error: false, message: '', data: { pagination: { current_page: 0, total_pages: 0, total_results: 0, per_page: 0, has_next: false, has_prev: false }, series: [] } } as any;
    }
  },

  // List Animes
  listAnimes: async (page = 1) => {
    try {
      return await vimeusFetch<VimeusResponse<{ animes: VimeusAnime[] }>>('/api/listing/animes', { page });
    } catch (e) {
      console.error('Failed to fetch animes from Vimeus API:', e);
      return { error: false, message: '', data: { pagination: { current_page: 0, total_pages: 0, total_results: 0, per_page: 0, has_next: false, has_prev: false }, animes: [] } } as any;
    }
  },

  // List Episodes
  listEpisodes: (page = 1, tmdbId?: number, season?: number) => {
    const query: Record<string, number> = { page };
    if (tmdbId) query.tmdb_id = tmdbId;
    if (season) query.season = season;
    return vimeusFetch<VimeusResponse<{ episodes: VimeusEpisode[] }>>("/api/listing/episodes", query);
  },

  // Get Playback Embed URL
  getMovieEmbedUrl: (tmdbId: number) => {
    return `${VIMEUS_BASE_URL}/e/movie?tmdb=${tmdbId}&view_key=${VIMEUS_VIEW_KEY}`;
  },

  getSeriesEmbedUrl: (tmdbId: number, season = 1, episode = 1) => {
    return `${VIMEUS_BASE_URL}/e/serie?tmdb=${tmdbId}&se=${season}&ep=${episode}&view_key=${VIMEUS_VIEW_KEY}`;
  },

  getAnimeEmbedUrl: (tmdbId: number, season = 1, episode = 1) => {
    return `${VIMEUS_BASE_URL}/e/anime?tmdb=${tmdbId}&se=${season}&ep=${episode}&view_key=${VIMEUS_VIEW_KEY}`;
  }
};
