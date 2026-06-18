import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import type { Playlist, PlaylistItem } from "../firebase/services";
import { X, Plus, FolderPlus, Globe, Lock } from "lucide-react";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  mediaTitle: string;
  mediaPoster: string;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
  mediaPoster
}) => {
  const { user } = useAuth();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // New playlist form
  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [formError, setFormError] = useState("");

  const loadPlaylists = async () => {
    if (!user) return;
    try {
      const data = await dbServices.getUserPlaylists(user.uid);
      setPlaylists(data);
    } catch (err) {
      console.error("Error loading playlists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadPlaylists();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleTogglePlaylistItem = async (playlist: Playlist) => {
    const isAlreadyAdded = playlist.items.some(item => item.mediaId === mediaId);
    let updatedItems: PlaylistItem[] = [];

    if (isAlreadyAdded) {
      // Remove
      updatedItems = playlist.items.filter(item => item.mediaId !== mediaId);
    } else {
      // Add
      updatedItems = [
        ...playlist.items,
        {
          mediaId,
          mediaType,
          title: mediaTitle,
          poster: mediaPoster
        }
      ];
    }

    try {
      await dbServices.updatePlaylistItems(playlist.id, updatedItems);
      // Update local state
      setPlaylists(prev =>
        prev.map(p => (p.id === playlist.id ? { ...p, items: updatedItems } : p))
      );
    } catch (err) {
      console.error("Error updating playlist item:", err);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listName.trim()) return;

    setFormError("");
    try {
      const newList = await dbServices.createPlaylist(
        user.uid,
        listName.trim(),
        listDesc.trim(),
        isPublic
      );
      
      // Auto add the item to this newly created list
      const updatedItems = [
        {
          mediaId,
          mediaType,
          title: mediaTitle,
          poster: mediaPoster
        }
      ];
      await dbServices.updatePlaylistItems(newList.id, updatedItems);
      newList.items = updatedItems;

      // Update state
      setPlaylists(prev => [...prev, newList]);
      
      // Reset form
      setListName("");
      setListDesc("");
      setIsPublic(true);
      setCreating(false);
    } catch (err) {
      console.error("Error creating playlist:", err);
      setFormError("No se pudo crear la lista. Inténtalo de nuevo.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--outline-variant)",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 12px 36px var(--shadow)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--outline-variant)"
        }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>
            Añadir a lista
          </h3>
          <button onClick={onClose} className="btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "1.5rem" }}>
          {creating ? (
            /* Create Playlist Form */
            <form onSubmit={handleCreatePlaylist} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h4 style={{ fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FolderPlus size={18} /> Nueva lista de reproducción
              </h4>

              {formError && (
                <div style={{ color: "var(--error)", fontSize: "0.8rem", fontWeight: "600" }}>
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mis películas de acción favoritas"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción (Opcional)</label>
                <textarea
                  placeholder="Añade una descripción breve..."
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  className="input-field"
                  rows={2}
                  style={{ resize: "none" }}
                />
              </div>

              {/* Privacy Select */}
              <div className="form-group">
                <label className="form-label">Privacidad</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                    />
                    <Globe size={14} /> Pública
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                    />
                    <Lock size={14} /> Privada
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setCreating(false)} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                  Atrás
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                  Crear y Guardar
                </button>
              </div>
            </form>
          ) : (
            /* Playlist Checklist */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loading ? (
                <div>Cargando tus listas...</div>
              ) : playlists.length === 0 ? (
                <div style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", fontStyle: "italic", textAlign: "center", margin: "1rem 0" }}>
                  No tienes listas de reproducción creadas.
                </div>
              ) : (
                <div style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  paddingRight: "0.25rem"
                }}>
                  {playlists.map((playlist) => {
                    const isAdded = playlist.items.some(item => item.mediaId === mediaId);
                    return (
                      <label
                        key={playlist.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-variant)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>
                          <input
                            type="checkbox"
                            checked={isAdded}
                            onChange={() => handleTogglePlaylistItem(playlist)}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          {playlist.name}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          {playlist.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                          {playlist.items.length} {playlist.items.length === 1 ? "item" : "items"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Create New Trigger */}
              <button
                onClick={() => setCreating(true)}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem"
                }}
              >
                <Plus size={16} /> Crear nueva lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
