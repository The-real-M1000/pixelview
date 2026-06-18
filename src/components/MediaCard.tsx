import React from "react";
import { useNavigate } from "react-router-dom";
import { tmdbApi } from "../services/tmdb";
import { Star } from "lucide-react";

interface MediaCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
  mediaType: "movie" | "series" | "anime";
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  mediaType
}) => {
  const navigate = useNavigate();

  const getYear = (dateStr?: string) => {
    if (!dateStr) return "";
    return dateStr.substring(0, 4);
  };

  const handleClick = () => {
    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="media-card-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        cursor: "pointer",
        position: "relative",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        transition: "transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease",
        outline: "1px solid rgba(255, 214, 0, 0)", // Invisible yellow border normally
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
        e.currentTarget.style.outline = "2px solid var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.outline = "1px solid rgba(255, 214, 0, 0)";
      }}
    >
      {/* Poster Image */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        backgroundColor: "var(--surface-variant)"
      }}>
        <img
          src={tmdbApi.getImageUrl(posterPath, "w342")}
          alt={title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />

        {/* Rating Badge */}
        {voteAverage !== undefined && voteAverage > 0 && (
          <div style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            backgroundColor: "rgba(14, 13, 11, 0.8)",
            backdropFilter: "blur(4px)",
            padding: "0.2rem 0.4rem",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "0.15rem",
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "var(--primary)"
          }}>
            <Star size={10} fill="currentColor" /> {voteAverage.toFixed(1)}
          </div>
        )}

        {/* Content Type Badge */}
        <div style={{
          position: "absolute",
          bottom: "0.5rem",
          left: "0.5rem",
          backgroundColor: "rgba(14, 13, 11, 0.85)",
          color: "#FFF",
          backdropFilter: "blur(4px)",
          padding: "0.15rem 0.4rem",
          borderRadius: "4px",
          fontSize: "0.7rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          {mediaType === "anime" ? "Anime" : (mediaType === "series" ? "Serie" : "Peli")}
        </div>
      </div>

      {/* Info details */}
      <div style={{ padding: "0 0.25rem 0.5rem 0.25rem" }}>
        <h3 style={{
          fontSize: "0.95rem",
          fontWeight: "600",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "var(--on-background)"
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: "0.8rem",
          color: "var(--on-surface-variant)",
          margin: "0.1rem 0 0 0"
        }}>
          {getYear(releaseDate)}
        </p>
      </div>
    </div>
  );
};
