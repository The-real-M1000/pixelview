import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia, TMDBCredit } from "../services/tmdb";
import { vimeusApi } from "../services/vimeus";
import { dbServices } from "../firebase/services";
import { CommentSection } from "../components/CommentSection";
import { PlaylistModal } from "../components/PlaylistModal";
import { ReportModal } from "../components/ReportModal";
import { MediaSlider } from "../components/MediaSlider";
import { DetailSkeleton } from "../components/Skeleton";
import { Play, Plus, Check, Star, Clock, Calendar, Heart, AlertOctagon, ListPlus } from "lucide-react";

export const MediaDetail: React.FC = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mediaId = Number(id);
  const mediaType = type as "movie" | "series" | "anime";

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<TMDBMedia | null>(null);
  const [cast, setCast] = useState<TMDBCredit[]>([]);
  const [similar, setSimilar] = useState<TMDBMedia[]>([]);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Season & Episode management
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [playNow, setPlayNow] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);

  // Modals
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Load details
  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch metadata based on media type
        let info: TMDBMedia;
        let creditsType: "movie" | "tv" = mediaType === "movie" ? "movie" : "tv";

        if (mediaType === "movie") {
          info = await tmdbApi.getMovieDetails(mediaId);
        } else {
          info = await tmdbApi.getTVDetails(mediaId);
        }
        setDetails(info);

        // 2. Fetch cast credits
        const credits = await tmdbApi.getCredits(mediaId, creditsType);
        setCast(credits.cast.slice(0, 10)); // Top 10 actors

        // 3. Fetch similar titles
        const similarRes = await tmdbApi.getSimilar(mediaId, creditsType);
        setSimilar(similarRes.results.slice(0, 10));

        // 4. If series/anime, load episodes for first season
        if (mediaType !== "movie") {
          await loadSeasonEpisodes(mediaId, 1);
        }

        // 5. Initial likes count from Firestore
        const allLikes = await dbServices.getMostLikedMediaIds();
        const likesInfo = allLikes.find(l => l.mediaId === id);
        setLikesCount(likesInfo ? likesInfo.count : 0);

        // 6. User Specific States (Like / Favorite)
        if (user) {
          const liked = await dbServices.isLiked(user.uid, id);
          const favorited = await dbServices.isFavorite(user.uid, id);
          setIsLiked(liked);
          setIsFav(favorited);

          // Get progress history if exists
          const history = await dbServices.getHistory(user.uid);
          const historyItem = history.find(h => h.mediaId === id);
          if (historyItem) {
            setWatchProgress(historyItem.progress);
            if (historyItem.season) setSelectedSeason(historyItem.season);
            if (historyItem.episode) setSelectedEpisode(historyItem.episode);
          }
        }

        // Auto play if query parameter is set
        if (searchParams.get("play") === "true") {
          setPlayNow(true);
        }

      } catch (err) {
        console.error("Error loading detail page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [id, mediaType, user]);

  const loadSeasonEpisodes = async (tvId: number, seasonNum: number) => {
    setLoadingEpisodes(true);
    try {
      const data = await tmdbApi.getTVSeasonDetails(tvId, seasonNum);
      setEpisodesList(data.episodes);
    } catch (err) {
      console.error(`Error loading season ${seasonNum} episodes:`, err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonNum = Number(e.target.value);
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
    await loadSeasonEpisodes(mediaId, seasonNum);
  };

  const handleEpisodeSelect = (epNum: number) => {
    setSelectedEpisode(epNum);
    setPlayNow(true);
    
    // Save to user history
    if (user && details) {
      dbServices.saveHistoryItem(
        user.uid,
        id!,
        mediaType,
        details.title || details.name || "",
        details.poster_path || "",
        watchProgress,
        selectedSeason,
        epNum
      );
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const title = details?.title || details?.name || "";
    const poster = details?.poster_path || "";
    try {
      const liked = await dbServices.toggleLike(user.uid, id!, mediaType, title, poster);
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const title = details?.title || details?.name || "";
    const poster = details?.poster_path || "";
    try {
      const fav = await dbServices.toggleFavorite(user.uid, id!, mediaType, title, poster);
      setIsFav(fav);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setWatchProgress(val);
    if (user && details) {
      dbServices.saveHistoryItem(
        user.uid,
        id!,
        mediaType,
        details.title || details.name || "",
        details.poster_path || "",
        val,
        mediaType === "movie" ? null : selectedSeason,
        mediaType === "movie" ? null : selectedEpisode
      );
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!details) return <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>Contenido no encontrado.</div>;

  // Generate Vimeus Iframe Embed URL
  const getEmbedUrl = () => {
    if (mediaType === "movie") {
      return vimeusApi.getMovieEmbedUrl(mediaId);
    } else if (mediaType === "series") {
      return vimeusApi.getSeriesEmbedUrl(mediaId, selectedSeason, selectedEpisode);
    } else {
      return vimeusApi.getAnimeEmbedUrl(mediaId, selectedSeason, selectedEpisode);
    }
  };

  const getReleaseYear = (dateStr?: string) => {
    if (!dateStr) return "";
    return dateStr.substring(0, 4);
  };

  const formatGenres = (genresList?: Array<{ id: number; name: string }>) => {
    if (!genresList) return "";
    return genresList.map(g => g.name).join(" • ");
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Top Banner Backdrop */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "50vh",
        backgroundImage: `url(${tmdbApi.getImageUrl(details.backdrop_path, "original")})`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        zIndex: 0
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, rgba(14,13,11,0.2) 0%, var(--background) 100%)",
          zIndex: 1
        }} />
      </div>

      {/* Detail Core Container */}
      <div className="container" style={{ marginTop: "-20vh", position: "relative", zIndex: 5, paddingBottom: "4rem" }}>
        
        {/* Playback player segment */}
        {playNow ? (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: "#000",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              outline: "1px solid var(--primary)"
            }}>
              <iframe
                src={getEmbedUrl()}
                referrerPolicy="origin"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none"
                }}
              />
            </div>
            
            {/* Progress controller */}
            {user && (
              <div style={{
                marginTop: "1rem",
                backgroundColor: "var(--surface)",
                padding: "1rem 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--outline-variant)",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>
                  <Clock size={16} /> Progreso de reproducción: {watchProgress}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={watchProgress}
                  onChange={handleProgressChange}
                  style={{
                    flex: 1,
                    accentColor: "var(--primary)",
                    cursor: "pointer"
                  }}
                />
                <button
                  onClick={() => {
                    setWatchProgress(100);
                    if (details) {
                      dbServices.saveHistoryItem(user.uid, id!, mediaType, details.title || details.name || "", details.poster_path || "", 100, mediaType === "movie" ? null : selectedSeason, mediaType === "movie" ? null : selectedEpisode);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                >
                  Marcar como Visto
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Content Info Layout Grid */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2.5rem",
          alignItems: "flex-start"
        }}>
          {/* Left Column: Poster & Quick Info */}
          <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "1.25rem", margin: "0 auto" }}>
            <img
              src={tmdbApi.getImageUrl(details.poster_path, "original")}
              alt={details.title || details.name}
              style={{
                width: "100%",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 10px 25px var(--shadow)",
                border: "1px solid var(--outline-variant)"
              }}
            />
            
            {/* Quick action buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button 
                onClick={handleToggleLike} 
                className="btn btn-secondary"
                style={{
                  backgroundColor: isLiked ? "rgba(186, 26, 26, 0.15)" : "var(--surface-variant)",
                  color: isLiked ? "var(--error)" : "inherit",
                  justifyContent: "center",
                  fontSize: "0.85rem"
                }}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {isLiked ? "Te gusta" : "Me gusta"}
              </button>
              <button 
                onClick={handleToggleFavorite} 
                className="btn btn-secondary"
                style={{
                  backgroundColor: isFav ? "rgba(255, 214, 0, 0.15)" : "var(--surface-variant)",
                  color: isFav ? "var(--primary)" : "inherit",
                  justifyContent: "center",
                  fontSize: "0.85rem"
                }}
              >
                {isFav ? <Check size={16} /> : <Plus size={16} />} Favorito
              </button>
            </div>

            <button 
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                setPlaylistModalOpen(true);
              }} 
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "center", fontSize: "0.9rem" }}
            >
              <ListPlus size={16} /> Añadir a mi lista
            </button>

            <button 
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                setReportModalOpen(true);
              }} 
              style={{ color: "var(--on-surface-variant)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", justifyContent: "center" }}
            >
              <AlertOctagon size={14} /> Reportar contenido
            </button>
          </div>

          {/* Right Column: Title, Metadata, Seasons, Cast */}
          <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Title Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--on-background)", lineHeight: "1.1" }}>
                  {details.title || details.name}
                </h1>
                {details.vote_average > 0 && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backgroundColor: "var(--primary-container)",
                    color: "var(--on-primary-container)",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem"
                  }}>
                    <Star size={14} fill="currentColor" /> {details.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Technical indicators */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.25rem", color: "var(--on-surface-variant)", fontSize: "0.9rem", marginTop: "0.75rem", fontWeight: "600" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Calendar size={14} /> {getReleaseYear(details.release_date || details.first_air_date)}
                </span>
                {details.runtime && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock size={14} /> {details.runtime} mins
                  </span>
                )}
                <span>
                  {formatGenres(details.genres)}
                </span>
                <span>
                  Me gustas: {likesCount}
                </span>
              </div>
            </div>

            {/* Play CTA if not playing */}
            {!playNow && (
              <div>
                <button onClick={() => setPlayNow(true)} className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
                  <Play size={22} fill="currentColor" /> Reproducir {mediaType === "movie" ? "Película" : "Episodio 1"}
                </button>
              </div>
            )}

            {/* Synopsis */}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem" }}>Sinopsis</h3>
              <p style={{ lineHeight: "1.6", color: "var(--on-background)", opacity: 0.9 }}>
                {details.overview || "No hay una sinopsis en español disponible para este título en este momento."}
              </p>
            </div>

            {/* Season and Episodes Selector (Series / Anime only) */}
            {mediaType !== "movie" && (
              <div style={{
                backgroundColor: "var(--surface)",
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--outline-variant)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Temporadas y Episodios</h3>
                  
                  {/* Seasons Select Dropdown */}
                  <select
                    value={selectedSeason}
                    onChange={handleSeasonChange}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface)",
                      fontSize: "0.85rem",
                      outline: "none",
                      fontWeight: "700"
                    }}
                  >
                    {Array.from({ length: details.number_of_seasons || 1 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s}>Temporada {s}</option>
                    ))}
                  </select>
                </div>

                {/* Episodes grid scroll */}
                {loadingEpisodes ? (
                  <div>Cargando episodios...</div>
                ) : (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    maxHeight: "350px",
                    overflowY: "auto",
                    paddingRight: "0.25rem"
                  }}>
                    {episodesList.map(ep => {
                      const isCurrent = ep.episode_number === selectedEpisode;
                      return (
                        <div
                          key={ep.id}
                          onClick={() => handleEpisodeSelect(ep.episode_number)}
                          style={{
                            display: "flex",
                            gap: "1rem",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${isCurrent ? "var(--primary)" : "var(--outline-variant)"}`,
                            backgroundColor: isCurrent ? "rgba(255, 214, 0, 0.05)" : "var(--surface)",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = "var(--surface-variant)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = "var(--surface)";
                          }}
                        >
                          {/* Mini Episode Still image */}
                          <div style={{ width: "120px", aspectRatio: "16/9", flexShrink: 0, borderRadius: "6px", overflow: "hidden", backgroundColor: "var(--surface-variant)" }}>
                            <img
                              src={tmdbApi.getImageUrl(ep.still_path, "w342")}
                              alt={ep.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "700", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ color: "var(--primary)" }}>Ep. {ep.episode_number}</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.name}</span>
                            </div>
                            <p style={{
                              fontSize: "0.8rem",
                              color: "var(--on-surface-variant)",
                              lineHeight: "1.4",
                              marginTop: "0.25rem",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}>
                              {ep.overview || "No hay una descripción disponible en español para este episodio."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actor Cast Row */}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.75rem" }}>Reparto Principal</h3>
              <div style={{
                display: "flex",
                gap: "1.25rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                scrollbarWidth: "thin"
              }}>
                {cast.map(c => (
                  <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", minWidth: "90px", width: "90px", textAlign: "center" }}>
                    <img
                      src={tmdbApi.getImageUrl(c.profile_path, "w342")}
                      alt={c.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--outline-variant)"
                      }}
                    />
                    <div style={{ fontWeight: "700", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {c.character}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Similar Recommendations Slider */}
        {similar.length > 0 && (
          <div style={{ marginTop: "3rem" }}>
            <MediaSlider
              title="Títulos Similares"
              items={similar}
              mediaType={mediaType}
            />
          </div>
        )}

        {/* Comments Section Component Block */}
        <div style={{ marginTop: "4rem" }}>
          <CommentSection
            mediaId={id!}
            mediaType={mediaType}
            mediaTitle={details.title || details.name || ""}
          />
        </div>

      </div>

      {/* Playlist modal */}
      {user && details && (
        <PlaylistModal
          isOpen={playlistModalOpen}
          onClose={() => setPlaylistModalOpen(false)}
          mediaId={id!}
          mediaType={mediaType}
          mediaTitle={details.title || details.name || ""}
          mediaPoster={details.poster_path || ""}
        />
      )}

      {/* Media Content Report Modal */}
      {details && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="media"
          targetId={id!}
          targetName={details.title || details.name || ""}
        />
      )}
    </div>
  );
};
