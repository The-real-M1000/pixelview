import React, { useState, useEffect } from "react";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { Carousel } from "../components/Carousel";
import { MediaCard } from "../components/MediaCard";
import { CarouselSkeleton, CardSkeleton } from "../components/Skeleton";

const ANIME_SUBGENRES = [
  { id: 28, name: "Acción" },
  { id: 35, name: "Comedia" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasía" },
  { id: 27, name: "Terror" },
  { id: 9648, name: "Misterio" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ciencia Ficción" },
  { id: 53, name: "Suspenso" },
];

export const Anime: React.FC = () => {
  const [animes, setAnimes] = useState<TMDBMedia[]>([]);
  const [carouselItems, setCarouselItems] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "name">("popular");

  const loadAnime = async () => {
    try {
      setLoading(true);
      const [p1, p2, p3] = await Promise.all([
        tmdbApi.getPopularAnime(1),
        tmdbApi.getPopularAnime(2),
        tmdbApi.getPopularAnime(3),
      ]);
      const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
      setAnimes(all);
      setCarouselItems(all.slice(0, 5));
    } catch (err) {
      console.error("Error loading anime:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnime();
  }, []);

  const filteredAnime = animes
    .filter((a) => {
      if (selectedGenre === "all") return true;
      return a.genres?.some((g) => g.id === Number(selectedGenre)) ?? true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.popularity - a.popularity;
      if (sortBy === "newest") return (b.first_air_date || "").localeCompare(a.first_air_date || "");
      return (a.name || "").localeCompare(b.name || "");
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
      <Carousel items={carouselItems} mediaType="anime" />

      <section className="container">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem",
          marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>
            ⛩️ Anime Popular
            <span style={{ fontSize: "0.9rem", fontWeight: 400, marginLeft: "0.75rem", color: "var(--on-surface-variant)" }}>
              {filteredAnime.length} resultados
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
              {ANIME_SUBGENRES.map((g) => (
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
              <option value="newest">Más Nuevos</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {filteredAnime.length === 0 ? (
          <div style={{ padding: "4rem 0", fontStyle: "italic", textAlign: "center", color: "var(--on-surface-variant)" }}>
            No se encontraron animes con este género.
          </div>
        ) : (
          <div className="media-grid">
            {filteredAnime.map((a) => (
              <MediaCard
                key={a.id}
                id={a.id}
                title={a.name || a.title || ""}
                posterPath={a.poster_path}
                releaseDate={a.first_air_date}
                voteAverage={a.vote_average}
                mediaType="anime"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
