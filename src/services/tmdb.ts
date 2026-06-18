const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  genres?: Array<{ id: number; name: string }>;
  episode_run_time?: number[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  origin_country?: string[];
}

export interface TMDBCredit {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  job?: string;
}

// Fetch helper
async function tmdbFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "es-ES",
    ...Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null) {
        acc[key] = String(val);
      }
      return acc;
    }, {} as Record<string, string>)
  });

  const response = await fetch(`${TMDB_BASE_URL}${path}?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB error fetching ${path}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const tmdbApi = {
  // Get Details for Movies
  getMovieDetails: (id: number) => tmdbFetch<TMDBMedia>(`/movie/${id}`),

  // Get Details for TV Series / Anime
  getTVDetails: (id: number) => tmdbFetch<TMDBMedia>(`/tv/${id}`),

  // Get Season Details (episodes, dates, posters)
  getTVSeasonDetails: (id: number, seasonNumber: number) =>
    tmdbFetch<{
      episodes: Array<{
        id: number;
        name: string;
        episode_number: number;
        overview: string;
        still_path: string | null;
        air_date: string;
      }>;
    }>(`/tv/${id}/season/${seasonNumber}`),

  // Search movies, series, and anime
  searchMulti: (query: string, page = 1) =>
    tmdbFetch<{
      results: Array<TMDBMedia & { media_type: "movie" | "tv" }>;
      total_pages: number;
      total_results: number;
    }>("/search/multi", { query, page }),

  // Get Cast & Crew
  getCredits: (id: number, type: "movie" | "tv") =>
    tmdbFetch<{ cast: TMDBCredit[]; crew: TMDBCredit[] }>(`/${type}/${id}/credits`),

  // Get Similar Items
  getSimilar: (id: number, type: "movie" | "tv") =>
    tmdbFetch<{ results: TMDBMedia[] }>(`/${type}/${id}/similar`),

  // Helper to format TMDB Image URL
  getImageUrl: (path: string | null, size: "original" | "w500" | "w342" = "original") => {
    if (!path) return "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=342"; // Placeholder image
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  // Get Popular Movies (TMDB) – top 20 most popular movies
  getPopularMovies: (page = 1) =>
    tmdbFetch<{ results: TMDBMedia[] }>("/movie/popular", { page }),

  // Get Popular TV Series (TMDB) – top 20 most popular series
  getPopularSeries: (page = 1) =>
    tmdbFetch<{ results: TMDBMedia[] }>("/tv/popular", { page }),

  // NEW: Get Trending media (movies, series, anime) for the week
  getTrending: (timeWindow: "day" | "week" = "week") =>
    tmdbFetch<{ results: Array<TMDBMedia & { media_type: "movie" | "tv" }> }>(`/trending/all/${timeWindow}`),
};
