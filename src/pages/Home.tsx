import React, { useState, useEffect } from "react";
// // import { vimeusApi } from "../services/vimeus"; // Vimeus API removed
// import type { VimeusMovie, VimeusSeries, VimeusAnime } from "../services/vimeus"; // Types removed // Removed Vimeus API usage
// import type { VimeusMovie, VimeusSeries, VimeusAnime } from "../services/vimeus"; // Types removed // Removed Vimeus API usage
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { dbServices } from "../firebase/services";
import { Carousel } from "../components/Carousel";
import { MediaSlider } from "../components/MediaSlider";
import { CarouselSkeleton, SliderSkeleton } from "../components/Skeleton";
import { Sparkles, Compass, Flame } from "lucide-react";

export const Home: React.FC = () => {
  const [carouselItems, setCarouselItems] = useState<TMDBMedia[]>([]);
  const [recentMovies, setRecentMovies] = useState<TMDBMedia[]>([]);
  const [recentSeries, setRecentSeries] = useState<TMDBMedia[]>([]);
  const [recentAnimes, setRecentAnimes] = useState<TMDBMedia[]>([]);
  const [mostLikedItems, setMostLikedItems] = useState<TMDBMedia[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"newest" | "popular" | "likes">("newest");
  const [filteredCatalog, setFilteredCatalog] = useState<TMDBMedia[]>([]);
  const [filtering, setFiltering] = useState(false);

  // Identity mapper (kept for compatibility)
  const mapVimeusToTMDB = (item: TMDBMedia): TMDBMedia => item;



  useEffect(() => {
    // Fallback logic for data fetching if needed
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // 1. Fetch popular movies and series from TMDB
      const moviesRes = await tmdbApi.getPopularMovies();
      const seriesRes = await tmdbApi.getPopularSeries();
      const movies = moviesRes.results || [];
      const series = seriesRes.results || [];
      const animes = []; // Placeholder for anime; could fetch via genre filter later


      // 2. Set carousel items from top movies and series
      const carouselItemsData = [...movies.slice(0, 3), ...series.slice(0, 2)];
      setCarouselItems(carouselItemsData);

      const recentMoviesData = movies.slice(0, 15);
      const recentSeriesData = series.slice(0, 15);
      const recentAnimesData = animes.slice(0, 15);
      setRecentMovies(recentMoviesData);
      setRecentSeries(recentSeriesData);
      setRecentAnimes(recentAnimesData);

      // 4. Fetch items with most likes from Firestore
      const likedRank = await dbServices.getMostLikedMediaIds();
      // Resolve details for liked media
      const resolvedLikes = await Promise.all(
        likedRank.slice(0, 10).map(async (rank) => {
          // Look inside our loaded lists first to avoid API call
          const cached = [...movies, ...series, ...animes].find(
            item => String(item.id) === rank.mediaId
          );
          if (cached) {
            return cached;
          }
          // Fallback to fetch from TMDB if not in lists
          try {
            // Check in movies or tv by querying TMDB
            // We assume movie first, then catch to TV
            return await tmdbApi.getMovieDetails(Number(rank.mediaId));
          } catch {
            try {
              return await tmdbApi.getTVDetails(Number(rank.mediaId));
            } catch {
              return null;
            }
          }
        })
      );

      const cleanLikes = resolvedLikes.filter(Boolean) as TMDBMedia[];
      setMostLikedItems(cleanLikes);

      // Set initial state for Quick Filters
      setFilteredCatalog(recentMovies.slice(0, 12));

    } catch (err) {
      console.error("Error loading home page content:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  // Filter selection handler
  useEffect(() => {
    if (loading) return;
    setFiltering(true);

    const applyFilter = async () => {
      // Gather all loaded items
      const allItems = [...recentMovies, ...recentSeries, ...recentAnimes];

      if (activeFilter === "newest") {
        // Sort by date/release date
        const sorted = [...allItems].sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || "";
          const dateB = b.release_date || b.first_air_date || "";
          return dateB.localeCompare(dateA);
        });
        setFilteredCatalog(sorted.slice(0, 12));
      } else if (activeFilter === "popular") {
        // In our listing mock, we can sort by tmdb_id (or fetch popularity from TMDB for a subset)
        // Let's sort by release date and add random noise, or sort by title length for visual variation
        const sorted = [...allItems].sort((a, b) => b.id - a.id);
        setFilteredCatalog(sorted.slice(0, 12));
      } else if (activeFilter === "likes") {
        // Use our loaded mostLikedItems or filter from likes list
        if (mostLikedItems.length > 0) {
          setFilteredCatalog(mostLikedItems);
        } else {
          setFilteredCatalog(allItems.slice(0, 6)); // fallback
        }
      }
      setFiltering(false);
    };

    applyFilter();
  }, [activeFilter, loading, mostLikedItems]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <CarouselSkeleton />
        <SliderSkeleton />
        <SliderSkeleton />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Main Hero Carousel */}
      <Carousel items={carouselItems} mediaType="movie" />

      {/* 2. Quick Filters Section */}
      <section className="container" style={{ marginTop: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          borderBottom: "1px solid var(--outline-variant)",
          paddingBottom: "0.75rem",
          overflowX: "auto"
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", whiteSpace: "nowrap", marginRight: "1rem" }}>
            Explorar
          </h2>

          <button
            onClick={() => setActiveFilter("newest")}
            className={`btn ${activeFilter === "newest" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
          >
            <Compass size={14} /> Más nuevas
          </button>

          <button
            onClick={() => setActiveFilter("popular")}
            className={`btn ${activeFilter === "popular" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
          >
            <Flame size={14} /> Más populares
          </button>

          <button
            onClick={() => setActiveFilter("likes")}
            className={`btn ${activeFilter === "likes" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
          >
            <Sparkles size={14} /> Más likes
          </button>
        </div>

        {/* Filter Results Grid */}
        <div style={{ marginTop: "1.5rem" }}>
          {filtering ? (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: "calc(25% - 0.75rem)", minWidth: "160px" }}>
                  <SliderSkeleton />
                </div>
              ))}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div style={{ color: "var(--on-surface-variant)", fontStyle: "italic", padding: "2rem 0" }}>
              No se encontraron contenidos con este filtro.
            </div>
          ) : (
            <div className="media-grid">
              {filteredCatalog.map((item) => {
                // Determine media type (animes, series, movies check)
                const isAnime = recentAnimes.some(a => a.id === item.id);
                const isSeries = recentSeries.some(s => s.id === item.id);
                const type = isAnime ? "anime" : (isSeries ? "series" : "movie");

                return (
                  <div key={item.id}>
                    <img
                      src={tmdbApi.getImageUrl(item.poster_path, "w342")}
                      alt={item.title || item.name}
                      style={{ display: "none" }}
                    />
                    <MediaSlider
                      title=""
                      items={[item]}
                      mediaType={type}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. Horizontal Rows of Categorized Catalogs */}
      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <MediaSlider
          title="Películas de Estreno"
          items={recentMovies}
          mediaType="movie"
        />
        <MediaSlider
          title="Series Tendencia"
          items={recentSeries}
          mediaType="series"
        />
        <MediaSlider
          title="Anime del Momento"
          items={recentAnimes}
          mediaType="anime"
        />
      </section>

      {/* Hide redundant grids from MediaSlider wraps inside explorer grid */}
      <style>{`
        .media-grid .slider-wrapper {
          padding: 0 !important;
        }
        .media-grid .slider-content {
          padding: 0 !important;
          overflow: hidden !important;
        }
        .media-grid .slider-content > div {
          width: 100% !important;
          min-width: 100% !important;
        }
        .media-grid h2 {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
