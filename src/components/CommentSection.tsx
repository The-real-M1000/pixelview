import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import type { Comment } from "../firebase/services";
import { ReportModal } from "./ReportModal";
import { MessageSquare, CornerDownRight, MoreVertical, Edit2, Trash2, Flag, Send } from "lucide-react";

interface CommentSectionProps {
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  mediaTitle: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  mediaId,
  mediaType,
  mediaTitle
}) => {
  const { user, userData } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const data = await dbServices.getComments(mediaId);
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [mediaId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !newCommentText.trim()) return;

    try {
      const newComment = await dbServices.addComment(
        mediaId,
        mediaType,
        mediaTitle,
        user.uid,
        userData.username,
        userData.photoURL,
        newCommentText.trim()
      );
      setComments((prev) => [...prev, newComment]);
      setNewCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user || !userData || !replyText.trim()) return;

    try {
      const newReply = await dbServices.addComment(
        mediaId,
        mediaType,
        mediaTitle,
        user.uid,
        userData.username,
        userData.photoURL,
        replyText.trim(),
        parentId
      );
      setComments((prev) => [...prev, newReply]);
      setReplyText("");
      setReplyToId(null);
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  const handleEditComment = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      await dbServices.updateComment(commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: editText.trim(), updatedAt: new Date().toISOString() }
            : c
        )
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      console.error("Error updating comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;
    
    try {
      await dbServices.deleteComment(commentId);
      // Remove comment and all its replies from UI
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleOpenReport = (commentId: string, authorName: string) => {
    setReportTarget({ id: commentId, name: `Comentario de @${authorName}` });
    setReportModalOpen(true);
    setActiveMenuId(null);
  };

  // Group comments into root comments and their corresponding replies
  const rootComments = comments.filter((c) => !c.parentId);
  const getRepliesFor = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const formatCommentDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderCommentBody = (comment: Comment) => {
    const isAuthor = user && comment.userId === user.uid;
    const isAdmin = userData && userData.role === "admin";

    if (comment.pendingReview) {
      if (isAuthor || isAdmin) {
        return (
          <div>
            <div style={{
              backgroundColor: "rgba(186, 26, 26, 0.08)",
              borderLeft: "3px solid var(--error)",
              padding: "0.5rem 0.75rem",
              borderRadius: "0 8px 8px 0",
              fontSize: "0.85rem",
              color: "var(--error)",
              marginBottom: "0.5rem",
              fontWeight: "600"
            }}>
              ⚠️ Este comentario está bajo revisión por moderación automática.
            </div>
            <p style={{ opacity: 0.7, fontStyle: "italic" }}>{comment.content}</p>
          </div>
        );
      } else {
        return (
          <p style={{ color: "var(--on-surface-variant)", fontStyle: "italic", opacity: 0.7 }}>
            [Este comentario está bajo revisión por moderación]
          </p>
        );
      }
    }

    return <p style={{ whiteSpace: "pre-line" }}>{comment.content}</p>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <MessageSquare size={20} /> Comentarios ({comments.length})
      </h3>

      {/* Main Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <img
            src={userData?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
            alt="Tu Avatar"
            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <textarea
              placeholder="Escribe tu comentario..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={3}
              className="input-field"
              style={{ fontSize: "0.95rem", resize: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                <Send size={14} /> Comentar
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{
          backgroundColor: "var(--surface-variant)",
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          textAlign: "center",
          fontSize: "0.95rem"
        }}>
          Debes <Link to="/auth" style={{ color: "var(--primary)", fontWeight: "600" }}>iniciar sesión</Link> para dejar un comentario.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div>Cargando comentarios...</div>
      ) : rootComments.length === 0 ? (
        <div style={{ color: "var(--on-surface-variant)", fontStyle: "italic" }}>
          No hay comentarios aún. ¡Sé el primero en comentar!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {rootComments.map((comment) => {
            const replies = getRepliesFor(comment.id);
            const isCommentAuthor = user && comment.userId === user.uid;
            const isAdmin = userData && userData.role === "admin";

            return (
              <div key={comment.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Root Comment Row */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", position: "relative" }}>
                  <img
                    src={comment.userPhoto}
                    alt={comment.username}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>@{comment.username}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>

                    {/* Content / Edit Box */}
                    {editingCommentId === comment.id ? (
                      <form onSubmit={(e) => handleEditComment(e, comment.id)} style={{ marginTop: "0.5rem" }}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="input-field"
                          rows={2}
                          style={{ resize: "none", fontSize: "0.9rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => setEditingCommentId(null)} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
                            Cancelar
                          </button>
                          <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
                            Guardar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ marginTop: "0.25rem", fontSize: "0.95rem", color: "var(--on-background)" }}>
                        {renderCommentBody(comment)}
                      </div>
                    )}

                    {/* Actions Row */}
                    {!editingCommentId && (
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginTop: "0.5rem" }}>
                        {user && !comment.pendingReview && (
                          <button
                            onClick={() => {
                              setReplyToId(replyToId === comment.id ? null : comment.id);
                              setReplyText("");
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              color: "var(--on-surface-variant)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            Responder
                          </button>
                        )}
                        
                        {/* Options trigger */}
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === comment.id ? null : comment.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--on-surface-variant)",
                              display: "flex",
                              alignItems: "center"
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === comment.id && (
                            <div style={{
                              position: "absolute",
                              left: 0,
                              top: "100%",
                              backgroundColor: "var(--surface)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--outline-variant)",
                              boxShadow: "0 4px 12px var(--shadow)",
                              padding: "0.25rem 0",
                              zIndex: 10,
                              width: "120px"
                            }}>
                              {isCommentAuthor && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditText(comment.content);
                                      setActiveMenuId(null);
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      width: "100%",
                                      padding: "0.5rem 0.75rem",
                                      border: "none",
                                      background: "none",
                                      fontSize: "0.8rem",
                                      textAlign: "left",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <Edit2 size={12} /> Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteComment(comment.id);
                                      setActiveMenuId(null);
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      width: "100%",
                                      padding: "0.5rem 0.75rem",
                                      border: "none",
                                      background: "none",
                                      fontSize: "0.8rem",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      color: "var(--error)"
                                    }}
                                  >
                                    <Trash2 size={12} /> Eliminar
                                  </button>
                                </>
                              )}

                              {!isCommentAuthor && user && (
                                <button
                                  onClick={() => handleOpenReport(comment.id, comment.username)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    background: "none",
                                    fontSize: "0.8rem",
                                    textAlign: "left",
                                    cursor: "pointer"
                                  }}
                                >
                                  <Flag size={12} /> Reportar
                                </button>
                              )}

                              {isAdmin && !isCommentAuthor && (
                                <button
                                  onClick={() => {
                                    handleDeleteComment(comment.id);
                                    setActiveMenuId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "none",
                                    background: "none",
                                    fontSize: "0.8rem",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    color: "var(--error)"
                                  }}
                                >
                                  <Trash2 size={12} /> Eliminar (Admin)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <form
                    onSubmit={(e) => handleAddReply(e, comment.id)}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                      marginLeft: "3rem",
                      marginTop: "0.25rem"
                    }}
                  >
                    <img
                      src={userData?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                      alt="Tu Avatar"
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <textarea
                        placeholder={`Responde a @${comment.username}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="input-field"
                        style={{ fontSize: "0.9rem", resize: "none" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button type="button" onClick={() => setReplyToId(null)} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
                          Responder
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Replies Listing */}
                {replies.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginLeft: "3rem", borderLeft: "2px solid var(--outline-variant)", paddingLeft: "1rem" }}>
                    {replies.map((reply) => {
                      const isReplyAuthor = user && reply.userId === user.uid;
                      return (
                        <div key={reply.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", position: "relative" }}>
                          <CornerDownRight size={14} style={{ color: "var(--on-surface-variant)", opacity: 0.5, marginTop: "0.5rem" }} />
                          <img
                            src={reply.userPhoto}
                            alt={reply.username}
                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>@{reply.username}</span>
                              <span style={{ fontSize: "0.7rem", color: "var(--on-surface-variant)" }}>
                                {formatCommentDate(reply.createdAt)}
                              </span>
                            </div>

                            {editingCommentId === reply.id ? (
                              <form onSubmit={(e) => handleEditComment(e, reply.id)} style={{ marginTop: "0.5rem" }}>
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="input-field"
                                  rows={2}
                                  style={{ resize: "none", fontSize: "0.85rem" }}
                                />
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                                  <button type="button" onClick={() => setEditingCommentId(null)} className="btn btn-secondary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }}>
                                    Cancelar
                                  </button>
                                  <button type="submit" className="btn btn-primary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem" }}>
                                    Guardar
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div style={{ marginTop: "0.25rem", fontSize: "0.9rem", color: "var(--on-background)" }}>
                                {renderCommentBody(reply)}
                              </div>
                            )}

                            {!editingCommentId && (
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
                                <div style={{ position: "relative" }}>
                                  <button
                                    onClick={() => setActiveMenuId(activeMenuId === reply.id ? null : reply.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--on-surface-variant)",
                                      display: "flex",
                                      alignItems: "center"
                                    }}
                                  >
                                    <MoreVertical size={14} />
                                  </button>

                                  {activeMenuId === reply.id && (
                                    <div style={{
                                      position: "absolute",
                                      left: 0,
                                      top: "100%",
                                      backgroundColor: "var(--surface)",
                                      borderRadius: "var(--radius-sm)",
                                      border: "1px solid var(--outline-variant)",
                                      boxShadow: "0 4px 12px var(--shadow)",
                                      padding: "0.25rem 0",
                                      zIndex: 10,
                                      width: "120px"
                                    }}>
                                      {isReplyAuthor && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingCommentId(reply.id);
                                              setEditText(reply.content);
                                              setActiveMenuId(null);
                                            }}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "0.5rem",
                                              width: "100%",
                                              padding: "0.5rem 0.75rem",
                                              border: "none",
                                              background: "none",
                                              fontSize: "0.8rem",
                                              textAlign: "left",
                                              cursor: "pointer"
                                            }}
                                          >
                                            <Edit2 size={12} /> Editar
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleDeleteComment(reply.id);
                                              setActiveMenuId(null);
                                            }}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "0.5rem",
                                              width: "100%",
                                              padding: "0.5rem 0.75rem",
                                              border: "none",
                                              background: "none",
                                              fontSize: "0.8rem",
                                              textAlign: "left",
                                              cursor: "pointer",
                                              color: "var(--error)"
                                            }}
                                          >
                                            <Trash2 size={12} /> Eliminar
                                          </button>
                                        </>
                                      )}

                                      {!isReplyAuthor && user && (
                                        <button
                                          onClick={() => handleOpenReport(reply.id, reply.username)}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            width: "100%",
                                            padding: "0.5rem 0.75rem",
                                            border: "none",
                                            background: "none",
                                            fontSize: "0.8rem",
                                            textAlign: "left",
                                            cursor: "pointer"
                                          }}
                                        >
                                          <Flag size={12} /> Reportar
                                        </button>
                                      )}

                                      {isAdmin && !isReplyAuthor && (
                                        <button
                                          onClick={() => {
                                            handleDeleteComment(reply.id);
                                            setActiveMenuId(null);
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            width: "100%",
                                            padding: "0.5rem 0.75rem",
                                            border: "none",
                                            background: "none",
                                            fontSize: "0.8rem",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            color: "var(--error)"
                                          }}
                                        >
                                          <Trash2 size={12} /> Eliminar (Admin)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Report Modal Hooked */}
      {reportTarget && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          targetType="comment"
          targetId={reportTarget.id}
          targetName={reportTarget.name}
        />
      )}
    </div>
  );
};
