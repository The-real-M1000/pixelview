import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserData } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import type { HistoryItem, Playlist } from "../firebase/services";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { tmdbApi } from "../services/tmdb";
import {
  Edit3, Trash2, Shield, EyeOff, Globe, Trash, Award,
  Clock, Heart, List, Share2, Copy, Check, X, ChevronLeft, ChevronRight
} from "lucide-react";

// ── Preset Avatars ──────────────────────────────────────────────────────────
const PRESET_AVATARS = [
  { id: "bottts-1",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=pixel&backgroundColor=ffd600" },
  { id: "bottts-2",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=nova&backgroundColor=212121" },
  { id: "bottts-3",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=comet&backgroundColor=1a237e" },
  { id: "bottts-4",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=aurora&backgroundColor=880e4f" },
  { id: "bottts-5",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=nebula&backgroundColor=1b5e20" },
  { id: "bottts-6",  url: "https://api.dicebear.com/7.x/bottts/svg?seed=quasar&backgroundColor=e65100" },
  { id: "pixel-1",  url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel" },
  { id: "pixel-2",  url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=star" },
  { id: "pixel-3",  url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=comet" },
  { id: "pixel-4",  url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=galaxy" },
  { id: "avataaars-1", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  { id: "avataaars-2", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  { id: "avataaars-3", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" },
  { id: "avataaars-4", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mars" },
  { id: "fun-emoji-1", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=stream" },
  { id: "fun-emoji-2", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=movie" },
  { id: "fun-emoji-3", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=anime" },
  { id: "fun-emoji-4", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=popcorn" },
];

// ── Preset Banners ───────────────────────────────────────────────────────────
const PRESET_BANNERS = [
  { id: "gradient-1", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200", label: "Auroras" },
  { id: "gradient-2", url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200", label: "Cosmos" },
  { id: "gradient-3", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200", label: "Tech" },
  { id: "gradient-4", url: "https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=1200", label: "Digital" },
  { id: "gradient-5", url: "https://images.unsplash.com/photo-1475274047050-1d0c0975864c?q=80&w=1200", label: "Noche" },
  { id: "gradient-6", url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?q=80&w=1200", label: "Galaxia" },
  { id: "gradient-7", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200", label: "Nebulosa" },
  { id: "gradient-8", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200", label: "Espacio" },
  { id: "cinema-1",   url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200", label: "Cine" },
  { id: "cinema-2",   url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200", label: "Palomitas" },
  { id: "cinema-3",   url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200", label: "Oscuridad" },
  { id: "anime-1",    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200", label: "Anime" },
];

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { userData: currentUserData, updateProfile } = useAuth();

  const [profileData, setProfileData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<"info" | "avatar" | "banner">("info");

  // Share state
  const [copied, setCopied] = useState(false);

  // Firestore user lists
  const [favorites, setFavorites] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      let isOwner = false;
      let data: UserData | null = null;

      const cleanUsername = username.trim().toLowerCase();

      if (currentUserData && currentUserData.username === cleanUsername) {
        isOwner = true;
        data = currentUserData;
      } else {
        // Search in Firestore by username field
        try {
          const q = query(collection(db, "users"), where("username", "==", cleanUsername));
          const snap = await getDocs(q);
          if (!snap.empty) {
            data = snap.docs[0].data() as UserData;
          }
        } catch {
          // Fallback: try to find by uid if username lookup fails
          const docRef = doc(db, "users", cleanUsername);
          const snap = await getDoc(docRef);
          if (snap.exists()) data = snap.data() as UserData;
        }
      }

      setIsOwnProfile(isOwner);

      if (data) {
        setProfileData(data);
        setEditName(data.displayName || "");
        setEditBio(data.bio || "");
        setEditAvatar(data.photoURL || "");
        setEditBanner(data.bannerURL || "");

        // Fetch favorites
        try {
          const userFavs = await dbServices.getUserFavorites(data.uid);
          setFavorites(userFavs);
        } catch { setFavorites([]); }

        // Fetch playlists
        try {
          const userLists = await dbServices.getUserPlaylists(data.uid);
          setPlaylists(isOwner ? userLists : userLists.filter(p => p.isPublic));
        } catch { setPlaylists([]); }

        // Fetch history (own only)
        if (isOwner) {
          try {
            const userHistory = await dbServices.getHistory(data.uid);
            setHistory(userHistory);
          } catch { setHistory([]); }
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [username, currentUserData]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await updateProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        photoURL: editAvatar,
        bannerURL: editBanner,
      });
      setProfileData(prev => prev ? { ...prev, displayName: editName.trim(), bio: editBio.trim(), photoURL: editAvatar, bannerURL: editBanner } : null);
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("¿Borrar todo el historial?")) return;
    try { await dbServices.clearHistory(profileData!.uid); setHistory([]); } catch {}
  };

  const handleDeleteHistoryItem = async (mediaId: string) => {
    try { await dbServices.deleteHistoryItem(profileData!.uid, mediaId); setHistory(prev => prev.filter(h => h.mediaId !== mediaId)); } catch {}
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!window.confirm("¿Eliminar esta lista?")) return;
    try { await dbServices.deletePlaylist(id); setPlaylists(prev => prev.filter(p => p.id !== id)); if (activePlaylistId === id) setActivePlaylistId(null); } catch {}
  };

  const formatWatchTime = (mins: number) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  };

  const selectedPlaylist = playlists.find(p => p.id === activePlaylistId);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: "48px", height: "48px", border: "4px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "1rem", color: "var(--on-surface-variant)" }}>Cargando perfil...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem" }}>🔍</div>
        <h2 style={{ marginTop: "1rem" }}>Usuario no encontrado</h2>
        <p style={{ color: "var(--on-surface-variant)", marginTop: "0.5rem" }}>@{username} no existe en PixelView.</p>
        <Link to="/" className="btn btn-primary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "4rem" }}>
      {/* ── BANNER ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "clamp(180px, 28vw, 320px)",
        backgroundImage: `url(${profileData.bannerURL || PRESET_BANNERS[0].url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "var(--surface-variant)",
      }}>
        {/* Gradient overlay bottom */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--background) 0%, transparent 60%)" }} />

        {/* Action buttons top-right */}
        <div style={{ position: "absolute", top: "1rem", right: "1.5rem", display: "flex", gap: "0.5rem", zIndex: 20 }}>
          {/* Share button */}
          <button
            onClick={handleShare}
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {copied ? <><Check size={14} /> Copiado!</> : <><Share2 size={14} /> Compartir</>}
          </button>

          {isOwnProfile && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Edit3 size={14} /> Editar Perfil
            </button>
          )}
        </div>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div className="container" style={{ marginTop: "-70px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end", marginBottom: "2.5rem" }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <img
              src={profileData.photoURL || PRESET_AVATARS[0].url}
              alt={profileData.username}
              style={{
                width: "130px", height: "130px", borderRadius: "50%",
                border: "4px solid var(--background)",
                backgroundColor: "var(--surface)", objectFit: "cover",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
              }}
              onError={e => { (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url; }}
            />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: "220px", paddingBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: "800", lineHeight: 1.1 }}>
                {profileData.displayName}
              </h1>
              {profileData.role === "admin" && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  background: "linear-gradient(135deg, #ffd600, #ff8f00)",
                  color: "#000", padding: "0.2rem 0.6rem", borderRadius: "20px",
                  fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0.5px"
                }}>
                  <Shield size={11} /> ADMIN
                </span>
              )}
            </div>
            <div style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", marginTop: "0.15rem" }}>@{profileData.username}</div>
            <p style={{ marginTop: "0.6rem", fontSize: "0.93rem", maxWidth: "550px", lineHeight: 1.5, opacity: 0.9 }}>
              {profileData.bio || "Sin biografía."}
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "1rem" }}>{favorites.length}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>Favoritos</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "1rem" }}>{playlists.length}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>Listas</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "1rem" }}>{formatWatchTime(profileData.stats?.totalWatchTime || 0)}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>Visto</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "800", fontSize: "1rem", textTransform: "capitalize" }}>{profileData.role}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>Rol</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── EDIT MODAL ── */}
        {editing && (
          <div style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000, padding: "1rem"
          }}>
            <div style={{
              backgroundColor: "var(--surface)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--outline-variant)", padding: "0",
              width: "100%", maxWidth: "560px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              maxHeight: "90vh"
            }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--outline-variant)" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: "800" }}>✏️ Editar Perfil</h2>
                <button onClick={() => setEditing(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--on-surface-variant)" }}><X size={20} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--outline-variant)" }}>
                {(["info", "avatar", "banner"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveEditTab(tab)}
                    style={{
                      flex: 1, padding: "0.85rem", border: "none", cursor: "pointer",
                      background: activeEditTab === tab ? "var(--primary-container)" : "transparent",
                      color: activeEditTab === tab ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                      fontWeight: activeEditTab === tab ? "700" : "500",
                      fontSize: "0.85rem",
                      borderBottom: activeEditTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    {tab === "info" ? "📝 Información" : tab === "avatar" ? "👤 Avatar" : "🖼️ Banner"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                <form onSubmit={handleSaveProfile}>

                  {/* INFO TAB */}
                  {activeEditTab === "info" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="form-group">
                        <label className="form-label">Nombre Visible</label>
                        <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="input-field" maxLength={50} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Biografía <span style={{ opacity: 0.5, fontWeight: 400 }}>(máx. 160 chars)</span></label>
                        <textarea
                          value={editBio} onChange={e => setEditBio(e.target.value)}
                          className="input-field" rows={3} style={{ resize: "vertical" }} maxLength={160}
                        />
                        <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", textAlign: "right", marginTop: "0.25rem" }}>{editBio.length}/160</div>
                      </div>
                    </div>
                  )}

                  {/* AVATAR TAB */}
                  {activeEditTab === "avatar" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Preview */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <img src={editAvatar} alt="Avatar preview"
                          style={{ width: "90px", height: "90px", borderRadius: "50%", border: "3px solid var(--primary)", objectFit: "cover", backgroundColor: "var(--surface-variant)" }}
                          onError={e => { (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url; }}
                        />
                      </div>

                      <p style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", textAlign: "center", margin: 0 }}>Elige un avatar de la galería:</p>

                      {/* Avatar grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.6rem" }}>
                        {PRESET_AVATARS.map(av => (
                          <button key={av.id} type="button" onClick={() => setEditAvatar(av.url)}
                            style={{
                              padding: "3px", border: `2px solid ${editAvatar === av.url ? "var(--primary)" : "transparent"}`,
                              borderRadius: "50%", cursor: "pointer", background: "transparent",
                              transition: "border-color 0.2s", outline: "none"
                            }}
                          >
                            <img src={av.url} alt={av.id} style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", display: "block", backgroundColor: "var(--surface-variant)" }} />
                          </button>
                        ))}
                      </div>

                      {/* Manual URL */}
                      <div className="form-group">
                        <label className="form-label">O pega una URL de imagen:</label>
                        <input type="url" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="input-field" placeholder="https://..." />
                      </div>
                    </div>
                  )}

                  {/* BANNER TAB */}
                  {activeEditTab === "banner" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Preview */}
                      <div style={{
                        width: "100%", height: "100px", borderRadius: "var(--radius-md)",
                        backgroundImage: `url(${editBanner})`, backgroundSize: "cover", backgroundPosition: "center",
                        backgroundColor: "var(--surface-variant)", border: "2px solid var(--primary)"
                      }} />

                      <p style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", textAlign: "center", margin: 0 }}>Elige un banner:</p>

                      {/* Banner grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                        {PRESET_BANNERS.map(bn => (
                          <button key={bn.id} type="button" onClick={() => setEditBanner(bn.url)}
                            style={{
                              padding: 0, border: `3px solid ${editBanner === bn.url ? "var(--primary)" : "transparent"}`,
                              borderRadius: "var(--radius-sm)", cursor: "pointer", background: "transparent",
                              overflow: "hidden", transition: "border-color 0.2s", outline: "none",
                              position: "relative"
                            }}
                          >
                            <img src={bn.url} alt={bn.label}
                              style={{ width: "100%", height: "60px", objectFit: "cover", display: "block" }}
                            />
                            <div style={{
                              position: "absolute", bottom: 0, left: 0, right: 0,
                              background: "rgba(0,0,0,0.6)", fontSize: "0.65rem", fontWeight: "600",
                              color: "#fff", padding: "2px 4px", textAlign: "center"
                            }}>{bn.label}</div>
                          </button>
                        ))}
                      </div>

                      {/* Manual URL */}
                      <div className="form-group">
                        <label className="form-label">O pega una URL de imagen:</label>
                        <input type="url" value={editBanner} onChange={e => setEditBanner(e.target.value)} className="input-field" placeholder="https://..." />
                      </div>
                    </div>
                  )}

                  {/* Save/Cancel */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--outline-variant)" }}>
                    <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary" disabled={saveLoading}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                      {saveLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE BODY ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", alignItems: "flex-start" }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Playlists */}
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <List size={18} /> Listas de Reproducción
              </h2>
              {playlists.length === 0 ? (
                <div style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.9rem", padding: "1rem", backgroundColor: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--outline-variant)", textAlign: "center" }}>
                  {isOwnProfile ? "No tienes listas aún." : "No hay listas públicas."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {playlists.map(p => (
                    <div key={p.id}
                      onClick={() => setActivePlaylistId(activePlaylistId === p.id ? null : p.id)}
                      style={{
                        backgroundColor: "var(--surface)", borderRadius: "var(--radius-md)",
                        border: `1px solid ${activePlaylistId === p.id ? "var(--primary)" : "var(--outline-variant)"}`,
                        padding: "0.85rem 1rem", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "border-color 0.2s"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {p.name}
                          {p.isPublic ? <Globe size={11} style={{ opacity: 0.5 }} /> : <EyeOff size={11} style={{ opacity: 0.5 }} />}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: "0.15rem" }}>
                          {p.items.length} {p.items.length === 1 ? "ítem" : "ítems"}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <button onClick={e => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                          style={{ border: "none", background: "transparent", color: "var(--error)", cursor: "pointer", padding: "4px" }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedPlaylist && (
                <div style={{ backgroundColor: "var(--surface-variant)", borderRadius: "var(--radius-md)", padding: "1rem", marginTop: "0.75rem" }}>
                  <h4 style={{ fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.75rem" }}>📋 {selectedPlaylist.name}</h4>
                  {selectedPlaylist.items.length === 0 ? (
                    <p style={{ fontStyle: "italic", fontSize: "0.82rem", opacity: 0.6 }}>Lista vacía.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {selectedPlaylist.items.map(item => (
                        <div key={item.mediaId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface)", padding: "0.45rem 0.6rem", borderRadius: "6px" }}>
                          <Link to={`/${item.mediaType}/${item.mediaId}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                            <img src={tmdbApi.getImageUrl(item.poster, "w342")} style={{ width: "28px", aspectRatio: "2/3", borderRadius: "3px", flexShrink: 0 }} alt={item.title} />
                            <span style={{ fontSize: "0.82rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
                          </Link>
                          {isOwnProfile && (
                            <button onClick={async () => {
                              const newItems = selectedPlaylist.items.filter(i => i.mediaId !== item.mediaId);
                              await dbServices.updatePlaylistItems(selectedPlaylist.id, newItems);
                              setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? { ...p, items: newItems } : p));
                            }} style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", flexShrink: 0 }}>
                              <Trash size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: "2", minWidth: "300px", display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* History (own only) */}
            {isOwnProfile && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.5rem" }}><Clock size={18} /> Continuar Viendo</h2>
                  {history.length > 0 && (
                    <button onClick={handleClearHistory} style={{ border: "none", background: "transparent", color: "var(--error)", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>
                      Limpiar todo
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div style={{ backgroundColor: "var(--surface)", padding: "1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.9rem" }}>
                    ¡Empieza a ver contenido!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {history.map(item => (
                      <div key={item.mediaId} style={{ backgroundColor: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--outline-variant)", padding: "0.7rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <img src={tmdbApi.getImageUrl(item.poster, "w342")} alt={item.title} style={{ width: "42px", aspectRatio: "2/3", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "0.88rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
                            <Link to={`/${item.mediaType}/${item.mediaId}?play=true`}>{item.title}</Link>
                            {item.season && <span style={{ fontSize: "0.72rem", backgroundColor: "var(--surface-variant)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>T{item.season}:E{item.episode}</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.35rem" }}>
                            <div style={{ flex: 1, height: "3px", backgroundColor: "var(--outline-variant)", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ width: `${item.progress}%`, height: "100%", background: "var(--primary)" }} />
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)", flexShrink: 0 }}>{item.progress}%</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteHistoryItem(item.mediaId)} style={{ border: "none", background: "transparent", color: "var(--on-surface-variant)", opacity: 0.5, cursor: "pointer", padding: "4px", flexShrink: 0 }}>
                          <Trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites */}
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Heart size={18} /> Favoritos
              </h2>
              {favorites.length === 0 ? (
                <div style={{ backgroundColor: "var(--surface)", padding: "1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.9rem" }}>
                  {isOwnProfile ? "Agrega películas y series a favoritos." : "No hay favoritos públicos."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.75rem" }}>
                  {favorites.map(fav => (
                    <Link key={fav.mediaId} to={`/${fav.mediaType}/${fav.mediaId}`}
                      style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
                    >
                      <img
                        src={tmdbApi.getImageUrl(fav.poster, "w342")} alt={fav.title}
                        style={{ width: "100%", aspectRatio: "2/3", borderRadius: "var(--radius-sm)", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                        onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/160x240?text=Sin+imagen"; }}
                      />
                      <div style={{ fontSize: "0.75rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fav.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
