import React, { useState, useEffect } from "react";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { Carousel } from "../components/Carousel";
import { MediaCard } from "../components/MediaCard";
import { CarouselSkeleton, CardSkeleton } from "../components/Skeleton";

// TMDB genre IDs for movies
const MOVIE_GENRES = [
  { id: 28, name: "Acción" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animación" },
  { id: 35, name: "Comedia" },
  { id: 80, name: "Crimen" },
  { id: 99, name: "Documental" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Familia" },
  { id: 14, name: "Fantasía" },
  { id: 36, name: "Historia" },
  { id: 27, name: "Terror" },
  { id: 10402, name: "Música" },
  { id: 9648, name: "Misterio" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ciencia Ficción" },
  { id: 53, name: "Suspenso" },
  { id: 10752, name: "Bélica" },
  { id: 37, name: "Western" },
];

export const Movies: React.FC = () => {
  const [movies, setMovies] = useState<TMDBMedia[]>([]);
  const [carouselItems, setCarouselItems] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "name">("popular");

  const loadMovies = async () => {
    try {
      setLoading(true);
      // Load 3 pages for a richer catalog
      const [p1, p2, p3] = await Promise.all([
        tmdbApi.getPopularMovies(1),
        tmdbApi.getPopularMovies(2),
        tmdbApi.getPopularMovies(3),
      ]);
      const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
      setMovies(all);
      setCarouselItems(all.slice(0, 5));
    } catch (err) {
      console.error("Error loading movies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const filteredMovies = movies
    .filter((movie) => {
      if (selectedGenre === "all") return true;
      return movie.genres?.some((g) => g.id === Number(selectedGenre)) ?? true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.popularity - a.popularity;
      if (sortBy === "newest") return (b.release_date || "").localeCompare(a.release_date || "");
      return (a.title || "").localeCompare(b.title || "");
    });

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <CarouselSkeleton />
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Carousel items={carouselItems} mediaType="movie" />

      <section className="container">
        {/* Header + Controls */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem",
          marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>
            🎬 Películas Populares
            <span style={{ fontSize: "0.9rem", fontWeight: 400, marginLeft: "0.75rem", color: "var(--on-surface-variant)" }}>
              {filteredMovies.length} resultados
            </span>
          </h2>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "var(--radius-full)",
                border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface)",
                fontSize: "0.85rem", outline: "none", color: "var(--on-surface)", cursor: "pointer"
              }}
            >
              <option value="all">Todos los Géneros</option>
              {MOVIE_GENRES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "var(--radius-full)",
                border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface)",
                fontSize: "0.85rem", outline: "none", color: "var(--on-surface)", cursor: "pointer"
              }}
            >
              <option value="popular">Más Populares</option>
              <option value="newest">Más Nuevas</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {filteredMovies.length === 0 ? (
          <div style={{ padding: "4rem 0", fontStyle: "italic", textAlign: "center", color: "var(--on-surface-variant)" }}>
            No se encontraron películas con este género.
          </div>
        ) : (
          <div className="media-grid">
            {filteredMovies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                title={movie.title || ""}
                posterPath={movie.poster_path}
                releaseDate={movie.release_date}
                voteAverage={movie.vote_average}
                mediaType="movie"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
