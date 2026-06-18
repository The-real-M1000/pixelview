import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, KeyRound, Sparkles } from "lucide-react";

export const Auth: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [pk, setPk] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, pk);
        navigate("/");
      } else if (mode === "register") {
        if (!username.trim() || !displayName.trim()) {
          setError("El nombre de usuario y nombre visible son obligatorios.");
          setLoading(false);
          return;
        }
        await register(email, pk, username, displayName);
        navigate("/");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Se ha enviado un enlace de recuperación a tu correo electrónico.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Map Firebase codes to readable messages
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Este correo electrónico ya está registrado.");
          break;
        case "auth/weak-password":
          setError("La contraseña debe tener al menos 6 caracteres.");
          break;
        case "auth/invalid-email":
          setError("El correo electrónico no es válido.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Credenciales incorrectas. Inténtalo de nuevo.");
          break;
        default:
          setError("Ocurrió un error en la autenticación. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
      backgroundColor: "var(--background)",
      backgroundImage: "linear-gradient(135deg, rgba(255, 214, 0, 0.03) 0%, rgba(14, 13, 11, 0) 100%)"
    }}>
      <div style={{
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--outline-variant)",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 12px 36px var(--shadow)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Banner header logo */}
        <div style={{
          padding: "2rem 2rem 1rem 2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            backgroundColor: "var(--primary-container)",
            color: "var(--on-primary-container)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles size={24} />
          </div>
          <span style={{
            fontSize: "1.75rem",
            fontWeight: "900",
            background: "linear-gradient(90deg, #FFD600 0%, #FFA000 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em"
          }}>
            PixelView
          </span>
          <p style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
            {mode === "login" ? "Accede a tu catálogo premium" : (mode === "register" ? "Únete a la mejor comunidad de streaming" : "Recupera tu acceso")}
          </p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem 2rem 2rem 2rem" }}>
          
          {error && (
            <div style={{
              backgroundColor: "rgba(186, 26, 26, 0.1)",
              color: "var(--error)",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              fontWeight: "600"
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              backgroundColor: "rgba(46, 125, 50, 0.1)",
              color: "var(--success)",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              fontWeight: "600"
            }}>
              {message}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* Display Name (Register only) */}
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Nombre Visible</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre real o apodo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {/* Username (Register only) */}
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Nombre de Usuario (único)</label>
                <input
                  type="text"
                  required
                  placeholder="ej. juanito123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Password Field (Login & Register only) */}
            {mode !== "forgot" && (
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caracteres"
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {/* CTA Action button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                height: "44px",
                fontSize: "0.95rem",
                marginTop: "0.5rem"
              }}
            >
              {loading ? "Cargando..." : (
                mode === "login" ? (
                  <><LogIn size={16} /> Iniciar Sesión</>
                ) : mode === "register" ? (
                  <><UserPlus size={16} /> Registrarme</>
                ) : (
                  <><KeyRound size={16} /> Enviar enlace</>
                )
              )}
            </button>
          </div>

          {/* Toggle modes links */}
          <div style={{
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "var(--on-surface-variant)"
          }}>
            {mode === "login" && (
              <>
                <button type="button" onClick={() => setMode("register")} style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "700" }}>
                  ¿No tienes cuenta? Regístrate
                </button>
                <button type="button" onClick={() => setMode("forgot")} style={{ border: "none", background: "none", cursor: "pointer" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            )}

            {mode === "register" && (
              <button type="button" onClick={() => setMode("login")} style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "700" }}>
                ¿Ya tienes cuenta? Inicia Sesión
              </button>
            )}

            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "700" }}>
                Volver al Inicio de Sesión
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
