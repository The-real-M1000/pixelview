import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dbServices } from "../firebase/services";
import { X, AlertTriangle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "comment" | "user" | "media";
  targetId: string;
  targetName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<"spam" | "inappropriate" | "copyright" | "violence" | "other">("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Debes iniciar sesión para reportar contenido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await dbServices.createReport(user.uid, targetType, targetId, targetName, reason, details);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails("");
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error creating report:", err);
      setError("No se pudo enviar el reporte. Por favor inténtalo de nuevo.");
    } finally {
      setLoading(false);
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
        maxWidth: "460px",
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
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>
            <AlertTriangle size={20} style={{ color: "var(--primary)" }} /> Reportar Contenido
          </h3>
          <button onClick={onClose} className="btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--success)" }}>
              ✓ Reporte enviado correctamente
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", marginTop: "0.5rem" }}>
              Nuestros administradores revisarán el contenido pronto. ¡Gracias!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--on-surface-variant)" }}>
              Estás reportando: <strong>{targetName}</strong> ({targetType === "comment" ? "comentario" : (targetType === "user" ? "usuario" : "contenido")})
            </div>

            {error && (
              <div style={{
                backgroundColor: "rgba(186, 26, 26, 0.1)",
                color: "var(--error)",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1rem",
                fontSize: "0.85rem",
                fontWeight: "600"
              }}>
                {error}
              </div>
            )}

            {/* Motive Select */}
            <div className="form-group">
              <label className="form-label">Motivo del reporte</label>
              <select
                value={reason}
                onChange={(e: any) => setReason(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--outline-variant)",
                  backgroundColor: "var(--surface)",
                  outline: "none"
                }}
              >
                <option value="spam">Spam / Publicidad no deseada</option>
                <option value="inappropriate">Contenido inapropiado / Ofensivo</option>
                <option value="copyright">Infracción de derechos de autor</option>
                <option value="violence">Violencia / Acoso</option>
                <option value="other">Otro motivo</option>
              </select>
            </div>

            {/* Details Area */}
            <div className="form-group">
              <label className="form-label">Detalles del reporte (Opcional)</label>
              <textarea
                placeholder="Por favor proporciona más contexto sobre por qué reportas este contenido..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="input-field"
                style={{
                  resize: "none",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading} style={{ padding: "0.6rem 1.25rem" }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0.6rem 1.25rem" }}>
                {loading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
