import React, { useRef } from "react";
import { MediaCard } from "./MediaCard";
import type { TMDBMedia } from "../services/tmdb";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaSliderProps {
  title: string;
  items: TMDBMedia[];
  mediaType: "movie" | "series" | "anime";
}

export const MediaSlider: React.FC<MediaSliderProps> = ({ title, items, mediaType }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: -sliderRef.current.offsetWidth * 0.8,
        behavior: "smooth"
      });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: sliderRef.current.offsetWidth * 0.8,
        behavior: "smooth"
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <div style={{
      position: "relative",
      padding: "1.5rem 0",
      width: "100%",
      overflow: "hidden"
    }}>
      {/* Slider Title */}
      <h2 style={{
        fontSize: "1.35rem",
        fontWeight: "700",
        marginBottom: "1rem",
        paddingLeft: "2rem",
        color: "var(--on-background)",
        letterSpacing: "-0.01em"
      }}>
        {title}
      </h2>

      {/* Slider Wrapper */}
      <div style={{ position: "relative" }} className="slider-wrapper">
        {/* Navigation Arrow Left */}
        <button
          onClick={handleScrollLeft}
          className="slider-arrow arrow-left"
          style={{
            position: "absolute",
            left: "0.5rem",
            top: "calc(50% - 20px)",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(14, 13, 11, 0.75)",
            backdropFilter: "blur(4px)",
            border: "none",
            color: "#FFF",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            opacity: 0,
            transition: "opacity 0.2s ease, background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(14, 13, 11, 0.75)"}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrolling Strip */}
        <div
          ref={sliderRef}
          style={{
            display: "flex",
            gap: "1.25rem",
            overflowX: "auto",
            scrollBehavior: "smooth",
            padding: "0.5rem 2rem",
            scrollbarWidth: "none" // Firefox
          }}
          className="slider-content"
        >
          {items.map((item) => (
            <div 
              key={item.id} 
              style={{
                minWidth: "160px",
                width: "160px",
                flexShrink: 0
              }}
            >
              <MediaCard
                id={item.id}
                title={item.title || item.name || ""}
                posterPath={item.poster_path}
                releaseDate={item.release_date || item.first_air_date}
                voteAverage={item.vote_average}
                mediaType={mediaType}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleScrollRight}
          className="slider-arrow arrow-right"
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "calc(50% - 20px)",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(14, 13, 11, 0.75)",
            backdropFilter: "blur(4px)",
            border: "none",
            color: "#FFF",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            opacity: 0,
            transition: "opacity 0.2s ease, background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(14, 13, 11, 0.75)"}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <style>{`
        /* Hide scrollbar for WebKit */
        .slider-content::-webkit-scrollbar {
          display: none;
        }
        
        .slider-wrapper:hover .slider-arrow {
          opacity: 1 !important;
        }

        @media (min-width: 600px) {
          .slider-content > div {
            min-width: 180px !important;
            width: 180px !important;
          }
        }
        
        @media (max-width: 768px) {
          .slider-arrow {
            display: none !important; /* Hide arrows on touch devices */
          }
        }
      `}</style>
    </div>
  );
};
