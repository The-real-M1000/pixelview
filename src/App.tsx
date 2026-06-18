import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Movies } from "./pages/Movies";
import { Series } from "./pages/Series";
import { Anime } from "./pages/Anime";
import { MediaDetail } from "./pages/MediaDetail";
import { Profile } from "./pages/Profile";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          {/* Header Navigation */}
          <Navbar />
          
          {/* Main Content Area */}
          <main className="main-content" style={{ paddingTop: "64px" }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/:type/:id" element={<MediaDetail />} />
              <Route path="/user/:username" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>

          {/* Footer Component */}
          <footer style={{
            backgroundColor: "var(--surface)",
            borderTop: "1px solid var(--outline-variant)",
            padding: "2rem 0",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--on-surface-variant)"
          }}>
            <div className="container">
              <p style={{ fontWeight: "700", marginBottom: "0.5rem" }}>
                PixelView © {new Date().getFullYear()} — Plataforma de Streaming Premium
              </p>
              <p style={{ opacity: 0.7 }}>
                Diseñado con Material Design 3. Datos obtenidos de TMDB y Vimeus.
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
