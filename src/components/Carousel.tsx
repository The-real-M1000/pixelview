import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  items: TMDBMedia[];
  mediaType: "movie" | "series" | "anime";
}

export const Carousel: React.FC<CarouselProps> = ({ items, mediaType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (items.length === 0) return;

    // Auto rotate every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [items]);

  // Load favorites for current items
  useEffect(() => {
    if (!user || items.length === 0) return;

    const checkFavs = async () => {
      const favStates: Record<number, boolean> = {};
      await Promise.all(
        items.map(async (item) => {
          const isFav = await dbServices.isFavorite(user.uid, String(item.id));
          favStates[item.id] = isFav;
        })
      );
      setFavorites(favStates);
    };

    checkFavs();
  }, [user, items]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDetails = () => {
    const isAnime = mediaType === "anime" || (mediaType === "series" && currentItem.origin_country?.includes("JP"));
    const path = isAnime ? `/anime/${currentItem.id}` : (mediaType === "movie" ? `/movie/${currentItem.id}` : `/series/${currentItem.id}`);
    navigate(path);
  };

  const handlePlay = () => {
    const isAnime = mediaType === "anime" || (mediaType === "series" && currentItem.origin_country?.includes("JP"));
    const path = isAnime ? `/anime/${currentItem.id}?play=true` : (mediaType === "movie" ? `/movie/${currentItem.id}?play=true` : `/series/${currentItem.id}?play=true`);
    navigate(path);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }

    const title = currentItem.title || currentItem.name || "";
    const poster = currentItem.poster_path || "";
    
    try {
      const isFav = await dbServices.toggleFavorite(user.uid, String(currentItem.id), mediaType, title, poster);
      setFavorites((prev) => ({ ...prev, [currentItem.id]: isFav }));
    } catch (err) {
      console.error("Error toggling favorite in Carousel:", err);
    }
  };

  const getReleaseYear = (dateStr?: string) => {
    if (!dateStr) return "";
    return dateStr.substring(0, 4);
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "75vh",
      maxHeight: "700px",
      minHeight: "450px",
      overflow: "hidden",
      backgroundColor: "#000",
      borderRadius: "0 0 32px 32px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
    }}>
      {/* Background Slides */}
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: isActive ? 1 : 0,
              visibility: isActive ? "visible" : "hidden",
              transition: "opacity 0.8s cubic-bezier(0.2, 0, 0, 1), visibility 0.8s",
              zIndex: 1
            }}
          >
            {/* Image */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url(${tmdbApi.getImageUrl(item.backdrop_path, "original")})`,
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
              transform: isActive ? "scale(1.03)" : "scale(1.1)",
              transition: "transform 8s ease-out"
            }} />

            {/* Overlays */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "linear-gradient(to right, rgba(14,13,11,0.85) 0%, rgba(14,13,11,0.4) 40%, rgba(14,13,11,0) 80%)",
              zIndex: 2
            }} />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "250px",
              background: "linear-gradient(to top, var(--background) 0%, rgba(14,13,11,0.8) 50%, rgba(14,13,11,0) 100%)",
              zIndex: 2
            }} />
          </div>
        );
      })}

      {/* Content Info Overlaid */}
      <div className="container" style={{
        position: "absolute",
        left: "50%",
        top: "45%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        pointerEvents: "none"
      }}>
        <div style={{ maxWidth: "600px", pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Metadata badges */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", fontWeight: "700" }}>
            <span style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              padding: "0.2rem 0.6rem",
              borderRadius: "6px",
              textTransform: "uppercase"
            }}>
              {mediaType === "anime" ? "Anime" : (mediaType === "series" ? "Serie" : "Película")}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)" }}>
              {getReleaseYear(currentItem.release_date || currentItem.first_air_date)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "0.15rem" }}>
              ★ {currentItem.vote_average.toFixed(1)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-hero" style={{ 
            color: "#FFFFFF", 
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            margin: "0.25rem 0",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }}>
            {currentItem.title || currentItem.name}
          </h1>

          {/* Description */}
          <p style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "1.05rem",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            lineHeight: "1.4",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            margin: "0.5rem 0"
          }}>
            {currentItem.overview || "No hay sinopsis disponible en español para este título."}
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
            <button onClick={handlePlay} className="btn btn-primary" style={{ padding: "0.85rem 1.75rem" }}>
              <Play size={18} fill="currentColor" /> Reproducir
            </button>
            
            <button onClick={handleDetails} className="btn btn-secondary" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
              <Info size={18} /> Detalles
            </button>
            
            <button 
              onClick={handleToggleFavorite} 
              className="btn btn-outline" 
              style={{ 
                borderColor: "rgba(255,255,255,0.4)", 
                color: "#FFFFFF",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)"
              }}
              title="Añadir a Favoritos"
            >
              {favorites[currentItem.id] ? <Check size={20} style={{ color: "var(--primary)" }} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Navigation Controls */}
      <button
        onClick={handlePrev}
        style={{
          position: "absolute",
          left: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 6,
          backgroundColor: "rgba(0,0,0,0.3)",
          color: "#FFF",
          border: "none",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.3)"}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={handleNext}
        style={{
          position: "absolute",
          right: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 6,
          backgroundColor: "rgba(0,0,0,0.3)",
          color: "#FFF",
          border: "none",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.3)"}
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div style={{
        position: "absolute",
        bottom: "2rem",
        right: "3rem",
        display: "flex",
        gap: "0.5rem",
        zIndex: 6
      }}>
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: index === currentIndex ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: index === currentIndex ? "var(--primary)" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "width 0.3s, background-color 0.3s"
            }}
          />
        ))}
      </div>
    </div>
  );
};
