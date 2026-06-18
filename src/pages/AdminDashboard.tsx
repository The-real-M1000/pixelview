import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import type { Report, Comment } from "../firebase/services";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Shield, AlertTriangle, MessageSquare, Users, BarChart3, Trash2, CheckCircle2, XCircle } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"reports" | "comments" | "users" | "stats">("reports");
  const [loading, setLoading] = useState(true);

  // Data lists
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<Comment[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    usersCount: 0,
    likesCount: 0,
    commentsCount: 0,
    reportsCount: 0
  });

  useEffect(() => {
    if (authLoading) return;
    // Route guard: Redirect if not administrator
    if (!userData || userData.role !== "admin") {
      navigate("/");
      return;
    }

    loadDashboardData();
  }, [userData, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Reports
      const allReports = await dbServices.getReports();
      setReports(allReports);

      // 2. Fetch Flagged Comments (under moderation check)
      const commentsSnap = await getDocs(collection(db, "comments"));
      const cList: Comment[] = [];
      commentsSnap.forEach(d => {
        const data = d.data();
        if (data.pendingReview) {
          cList.push({ id: d.id, ...data } as Comment);
        }
      });
      setFlaggedComments(cList);

      // 3. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const uList: any[] = [];
      usersSnap.forEach(d => {
        uList.push({ uid: d.id, ...d.data() });
      });
      setSystemUsers(uList);

      // 4. Resolve statistics counts
      const likesSnap = await getDocs(collection(db, "likes"));
      setStats({
        usersCount: uList.length,
        likesCount: likesSnap.size,
        commentsCount: commentsSnap.size,
        reportsCount: allReports.length
      });

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: "resolved" | "dismissed") => {
    try {
      await dbServices.updateReportStatus(reportId, action);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action } : r));
    } catch (err) {
      console.error("Error updating report:", err);
    }
  };

  const handleDeleteReportedComment = async (reportId: string, commentId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este comentario ofensivo?")) return;
    try {
      await dbServices.deleteComment(commentId);
      await dbServices.updateReportStatus(reportId, "resolved");
      
      // Update UI states
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: "resolved" } : r));
      setFlaggedComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting reported comment:", err);
    }
  };

  const handleDeleteCommentDirectly = async (commentId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este comentario?")) return;
    try {
      await dbServices.deleteComment(commentId);
      setFlaggedComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleUpdateUserRole = async (userId: string, currentRole: "user" | "admin") => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`¿Quieres cambiar el rol del usuario a "${nextRole}"?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), { role: nextRole });
      setSystemUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: nextRole } : u));
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  if (loading || authLoading) {
    return <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>Cargando panel de administración...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
      {/* Title */}
      <h1 style={{ fontSize: "1.75rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
        <Shield size={28} style={{ color: "var(--primary)" }} /> Panel de Administración
      </h1>

      {/* Tabs Menu Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--outline-variant)",
        gap: "1.5rem",
        marginBottom: "2rem",
        overflowX: "auto"
      }}>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "reports" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "reports" ? "var(--primary)" : "inherit",
            padding: "0.75rem 0.5rem",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            whiteSpace: "nowrap"
          }}
        >
          <AlertTriangle size={18} /> Reportes ({reports.filter(r => r.status === "pending").length})
        </button>

        <button
          onClick={() => setActiveTab("comments")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "comments" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "comments" ? "var(--primary)" : "inherit",
            padding: "0.75rem 0.5rem",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            whiteSpace: "nowrap"
          }}
        >
          <MessageSquare size={18} /> Comentarios Flaggeados ({flaggedComments.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "users" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "users" ? "var(--primary)" : "inherit",
            padding: "0.75rem 0.5rem",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            whiteSpace: "nowrap"
          }}
        >
          <Users size={18} /> Usuarios ({systemUsers.length})
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "stats" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "stats" ? "var(--primary)" : "inherit",
            padding: "0.75rem 0.5rem",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            whiteSpace: "nowrap"
          }}
        >
          <BarChart3 size={18} /> Estadísticas
        </button>
      </div>

      {/* --- TAB CONTENT PANEL --- */}

      {activeTab === "reports" && (
        /* REPORTS TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reports.length === 0 ? (
            <div style={{ fontStyle: "italic", color: "var(--on-surface-variant)" }}>No hay reportes registrados.</div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--outline-variant)",
                  padding: "1.25rem",
                  opacity: report.status !== "pending" ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                {/* Header Info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={{
                      backgroundColor: report.autoDetected ? "rgba(186, 26, 26, 0.12)" : "var(--surface-variant)",
                      color: report.autoDetected ? "var(--error)" : "var(--on-surface-variant)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      marginRight: "0.5rem"
                    }}>
                      {report.autoDetected ? "Auto Moderación" : "Reporte Usuario"}
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)" }}>
                      Objetivo: <strong>{report.targetName}</strong> ({report.targetType})
                    </span>
                  </div>
                  
                  <span style={{
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    color: report.status === "pending" ? "var(--primary)" : (report.status === "resolved" ? "var(--success)" : "var(--outline)")
                  }}>
                    {report.status === "pending" ? "Pendiente" : (report.status === "resolved" ? "Resuelto" : "Descartado")}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: "0.5rem 0" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>Motivo: <strong style={{ textTransform: "capitalize" }}>{report.reason}</strong></div>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.95rem" }}>{report.details}</p>
                </div>

                {/* Report Action CTAs */}
                {report.status === "pending" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--outline-variant)", paddingTop: "0.75rem" }}>
                    {report.targetType === "comment" && (
                      <button
                        onClick={() => handleDeleteReportedComment(report.id, report.targetId)}
                        className="btn btn-secondary"
                        style={{ color: "var(--error)", padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                      >
                        <Trash2 size={14} /> Eliminar Comentario
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleResolveReport(report.id, "dismissed")}
                      className="btn btn-outline"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                    >
                      <XCircle size={14} /> Descartar Reporte
                    </button>
                    
                    <button
                      onClick={() => handleResolveReport(report.id, "resolved")}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                    >
                      <CheckCircle2 size={14} /> Resolver Reporte
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "comments" && (
        /* COMMENTS MODERATION TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {flaggedComments.length === 0 ? (
            <div style={{ fontStyle: "italic", color: "var(--on-surface-variant)" }}>No hay comentarios sospechosos marcados.</div>
          ) : (
            flaggedComments.map(comment => (
              <div
                key={comment.id}
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--outline-variant)",
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1.5rem"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: "600" }}>
                    Autor: @{comment.username} | ID del medio: {comment.mediaId}
                  </div>
                  <p style={{ marginTop: "0.25rem", color: "var(--error)", fontStyle: "italic" }}>
                    "{comment.content}"
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteCommentDirectly(comment.id)}
                  className="btn btn-secondary"
                  style={{ color: "var(--error)", padding: "0.5rem" }}
                  title="Eliminar comentario"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "users" && (
        /* USERS MANAGEMENT TAB */
        <div style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--outline-variant)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-variant)" }}>
                <th style={{ padding: "1rem" }}>Usuario</th>
                <th style={{ padding: "1rem" }}>Correo</th>
                <th style={{ padding: "1rem" }}>Rol</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {systemUsers.map(u => (
                <tr key={u.uid} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <img src={u.photoURL} alt={u.username} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: "700" }}>{u.displayName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>@{u.username}</div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      backgroundColor: u.role === "admin" ? "var(--primary-container)" : "var(--surface-variant)",
                      color: u.role === "admin" ? "var(--on-primary-container)" : "inherit",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "700"
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleUpdateUserRole(u.uid, u.role)}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                      disabled={userData?.uid === u.uid} // Can't change own role
                    >
                      Alternar Rol
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "stats" && (
        /* STATISTICS SYSTEM DASHBOARD */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem"
        }}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)", padding: "1.5rem", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <Users size={32} style={{ color: "var(--primary)", margin: "0 auto 0.5rem auto" }} />
            <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: "600" }}>Usuarios Registrados</div>
            <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.25rem" }}>{stats.usersCount}</div>
          </div>
          
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)", padding: "1.5rem", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <Shield size={32} style={{ color: "var(--primary)", margin: "0 auto 0.5rem auto" }} />
            <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: "600" }}>Me Gustas Totales</div>
            <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.25rem" }}>{stats.likesCount}</div>
          </div>

          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)", padding: "1.5rem", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <MessageSquare size={32} style={{ color: "var(--primary)", margin: "0 auto 0.5rem auto" }} />
            <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: "600" }}>Comentarios Escritos</div>
            <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.25rem" }}>{stats.commentsCount}</div>
          </div>

          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--outline-variant)", padding: "1.5rem", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
            <AlertTriangle size={32} style={{ color: "var(--primary)", margin: "0 auto 0.5rem auto" }} />
            <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", fontWeight: "600" }}>Reportes Totales</div>
            <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "0.25rem" }}>{stats.reportsCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};
