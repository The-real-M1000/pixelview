import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tmdbApi } from "../services/tmdb";
import type { TMDBMedia } from "../services/tmdb";
import { Search, Sun, Moon, LogOut, User as UserIcon, Shield, Film, Tv, Sparkles, Menu, X } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<TMDBMedia & { media_type: "movie" | "tv" }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Perform search in real-time
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const data = await tmdbApi.searchMulti(searchQuery);
        // Filter out people, focus only on movie and tv
        const filtered = data.results.filter(
          item => item.media_type === "movie" || item.media_type === "tv"
        );
        setSearchResults(filtered.slice(0, 6)); // Show top 6 results
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Helper to determine media URL (checking if TV show origin country is JP to treat as anime)
  const getMediaUrl = (item: TMDBMedia & { media_type: "movie" | "tv" }) => {
    const isAnime = item.media_type === "tv" && item.origin_country?.includes("JP");
    if (isAnime) return `/anime/${item.id}`;
    return item.media_type === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
  };

  const handleSearchResultClick = (item: TMDBMedia & { media_type: "movie" | "tv" }) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(getMediaUrl(item));
  };

  return (
    <header className="glass-header" style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
      transition: "background-color 0.3s ease"
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        gap: "1.5rem"
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            background: "linear-gradient(90deg, #FFD600 0%, #FFA000 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em"
          }}>
            PixelView
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: "none" }} className="desktop-nav">
          <ul style={{ display: "flex", listStyle: "none", gap: "1.5rem", fontWeight: "600" }}>
            <li>
              <Link 
                to="/movies" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.25rem",
                  color: location.pathname === "/movies" ? "var(--primary)" : "inherit",
                  transition: "color 0.2s"
                }}
              >
                <Film size={16} /> Películas
              </Link>
            </li>
            <li>
              <Link 
                to="/series" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.25rem",
                  color: location.pathname === "/series" ? "var(--primary)" : "inherit",
                  transition: "color 0.2s"
                }}
              >
                <Tv size={16} /> Series
              </Link>
            </li>
            <li>
              <Link 
                to="/anime" 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.25rem",
                  color: location.pathname === "/anime" ? "var(--primary)" : "inherit",
                  transition: "color 0.2s"
                }}
              >
                <Sparkles size={16} /> Anime
              </Link>
            </li>
          </ul>
        </nav>

        {/* Search Bar */}
        <div ref={searchRef} style={{ position: "relative", flex: "1", maxWidth: "400px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Buscar películas, series, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: "2.75rem",
                borderRadius: "var(--radius-full)",
                height: "40px",
                fontSize: "0.9rem",
                border: "1px solid var(--outline-variant)"
              }}
            />
            <Search 
              size={18} 
              style={{ 
                position: "absolute", 
                left: "1rem", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "var(--on-surface-variant)",
                opacity: 0.7
              }} 
            />
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              position: "absolute",
              top: "110%",
              left: 0,
              width: "100%",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--outline-variant)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 1001
            }}>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSearchResultClick(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--outline-variant)",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-variant)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <img
                    src={tmdbApi.getImageUrl(item.poster_path, "w342")}
                    alt={item.title || item.name}
                    style={{ width: "36px", aspectRatio: "2/3", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || item.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", display: "flex", gap: "0.5rem" }}>
                      <span>{((item.release_date || item.first_air_date) || "").substring(0, 4)}</span>
                      <span>•</span>
                      <span style={{ textTransform: "capitalize" }}>
                        {item.origin_country?.includes("JP") && item.media_type === "tv" ? "Anime" : (item.media_type === "tv" ? "Serie" : "Película")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls & Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="btn-icon" 
            title="Cambiar Tema"
            style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {theme === "dark" ? <Sun size={20} style={{ color: "#FFD600" }} /> : <Moon size={20} />}
          </button>

          {/* User Menu Dropdown */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <img
                  src={userData?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                  alt={userData?.username || "Usuario"}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--primary)"
                  }}
                />
              </button>

              {showDropdown && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "120%",
                  width: "220px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--outline-variant)",
                  boxShadow: "0 8px 24px var(--shadow)",
                  padding: "0.5rem 0",
                  zIndex: 1001
                }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--outline-variant)" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{userData?.displayName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>@{userData?.username}</div>
                  </div>
                  
                  <Link 
                    to={`/user/${userData?.username}`} 
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.9rem"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-variant)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <UserIcon size={16} /> Mi Perfil
                  </Link>

                  {userData?.role === "admin" && (
                    <Link 
                      to="/admin" 
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        fontSize: "0.9rem",
                        color: "var(--primary)",
                        fontWeight: "600"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-variant)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <Shield size={16} /> Panel Admin
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: "0.75rem 1rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      color: "var(--error)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-variant)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", height: "38px", fontSize: "0.85rem" }}>
              Iniciar Sesión
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: "none", border: "none", background: "transparent", cursor: "pointer", width: "40px", height: "40px", alignItems: "center", justifyContent: "center" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--outline-variant)",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          fontWeight: "600"
        }}>
          <Link to="/movies" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
            <Film size={18} /> Películas
          </Link>
          <Link to="/series" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
            <Tv size={18} /> Series
          </Link>
          <Link to="/anime" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
            <Sparkles size={18} /> Anime
          </Link>
        </div>
      )}

      {/* Global CSS Inject for media queries */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: block !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
};
