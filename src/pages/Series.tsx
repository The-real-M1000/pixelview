import React, { useState, useEffect } from "react";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { Carousel } from "../components/Carousel";
import { MediaCard } from "../components/MediaCard";
import { CarouselSkeleton, CardSkeleton } from "../components/Skeleton";

const TV_GENRES = [
  { id: 10759, name: "Acción & Aventura" },
  { id: 16, name: "Animación" },
  { id: 35, name: "Comedia" },
  { id: 80, name: "Crimen" },
  { id: 99, name: "Documental" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Familia" },
  { id: 10762, name: "Infantil" },
  { id: 9648, name: "Misterio" },
  { id: 10763, name: "Noticias" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Ciencia Ficción & Fantasía" },
  { id: 10766, name: "Telenovela" },
  { id: 10767, name: "Charla" },
  { id: 10768, name: "Guerra & Política" },
  { id: 37, name: "Western" },
];

export const Series: React.FC = () => {
  const [series, setSeries] = useState<TMDBMedia[]>([]);
  const [carouselItems, setCarouselItems] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "name">("popular");

  const loadSeries = async () => {
    try {
      setLoading(true);
      const [p1, p2, p3] = await Promise.all([
        tmdbApi.getPopularSeries(1),
        tmdbApi.getPopularSeries(2),
        tmdbApi.getPopularSeries(3),
      ]);
      const all = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
      setSeries(all);
      setCarouselItems(all.slice(0, 5));
    } catch (err) {
      console.error("Error loading series:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const filteredSeries = series
    .filter((s) => {
      if (selectedGenre === "all") return true;
      return s.genres?.some((g) => g.id === Number(selectedGenre)) ?? true;
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
      <Carousel items={carouselItems} mediaType="series" />

      <section className="container">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem",
          marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>
            📺 Series Populares
            <span style={{ fontSize: "0.9rem", fontWeight: 400, marginLeft: "0.75rem", color: "var(--on-surface-variant)" }}>
              {filteredSeries.length} resultados
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
              {TV_GENRES.map((g) => (
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

        {filteredSeries.length === 0 ? (
          <div style={{ padding: "4rem 0", fontStyle: "italic", textAlign: "center", color: "var(--on-surface-variant)" }}>
            No se encontraron series con este género.
          </div>
        ) : (
          <div className="media-grid">
            {filteredSeries.map((s) => (
              <MediaCard
                key={s.id}
                id={s.id}
                title={s.name || s.title || ""}
                posterPath={s.poster_path}
                releaseDate={s.first_air_date}
                voteAverage={s.vote_average}
                mediaType="series"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
