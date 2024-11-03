import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Configuración de TMDB
const TMDB_API_KEY = 'c68b3c5edd56efe86a36e35c4dc891fc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAmHL0-1uJZgPAhxqDN4zA1uXH-X6YtzY",
    authDomain: "pixelview-30.firebaseapp.com",
    projectId: "pixelview-30",
    storageBucket: "pixelview-30.appspot.com",
    messagingSenderId: "267067796738",
    appId: "1:267067796738:web:cadd6fd09b25f94fb5661b",
    measurementId: "G-4VPZX8PV0N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funciones TMDB
async function searchMovie(title) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=es-ES`
        );
        
        if (!response.ok) {
            throw new Error('TMDB API request failed');
        }
        
        const data = await response.json();
        return data.results[0];
    } catch (error) {
        console.error('Error searching TMDB:', error);
        return null;
    }
}

function getPosterUrl(posterPath, size = 'w500') {
    if (!posterPath) return null;
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

async function getMoviePoster(title) {
    try {
        const movie = await searchMovie(title);
        if (movie && movie.poster_path) {
            return getPosterUrl(movie.poster_path);
        }
        return null;
    } catch (error) {
        console.error('Error getting movie poster:', error);
        return null;
    }
}

async function loadMovieDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    if (!movieId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const movieDoc = await getDoc(doc(db, "videos", movieId));
        
        if (!movieDoc.exists()) {
            window.location.href = 'index.html';
            return;
        }

        const movieData = movieDoc.data();
        
        // Actualizar título
        document.getElementById('movieTitle').textContent = movieData.title;
        
        // Buscar y actualizar el póster desde TMDB
        const posterUrl = await getMoviePoster(movieData.title);
        const posterImage = document.getElementById('moviePoster');
        if (posterImage && posterUrl) {
            posterImage.src = posterUrl;
        }
        
        // Actualizar metadatos
        const metadataContainer = document.querySelector('.movie-metadata');
        if (metadataContainer) {
            metadataContainer.innerHTML = `
                <span id="movieGenre">Género: ${movieData.genere || 'No especificado'}</span>
                <span id="movieType">Tipo: ${movieData.type || 'No especificado'}</span>
                ${movieData.duration ? `<span id="movieDuration">Duración: ${movieData.duration}</span>` : ''}
                ${movieData.year ? `<span id="movieYear">Año: ${movieData.year}</span>` : ''}
            `;
        }
        
        // Actualizar descripción
        const descriptionElement = document.getElementById('movieDescription');
        if (descriptionElement && movieData.description) {
            descriptionElement.textContent = movieData.description;
        }
        
        // Mostrar el video
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer && movieData.videoUrl) {
            videoContainer.innerHTML = movieData.videoUrl;
        } else {
            videoContainer.innerHTML = '<p>Video no disponible</p>';
        }

        // Cargar películas recomendadas
        await loadRecommendedMovies(movieData.genere, movieId);
    } catch (error) {
        console.error("Error al cargar los detalles de la película:", error);
        showError("Ha ocurrido un error al cargar los detalles. Por favor, intenta de nuevo.");
    }
}

async function loadRecommendedMovies(genre, currentMovieId) {
    try {
        const q = query(
            collection(db, "videos"),
            where("genere", "==", genre),
            limit(6)
        );
        
        const querySnapshot = await getDocs(q);
        const recommendedContainer = document.querySelector('.recommended-grid');
        
        if (recommendedContainer) {
            recommendedContainer.innerHTML = '';
            
            for (const doc of querySnapshot.docs) {
                if (doc.id !== currentMovieId) {
                    const movieData = doc.data();
                    const posterUrl = await getMoviePoster(movieData.title);
                    
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    
                    card.innerHTML = `
                        <div class="image-container">
                            <div class="loading-overlay">
                                <div class="loading-spinner"></div>
                            </div>
                            <img src="${posterUrl || '/assets/placeholder.jpg'}" 
                                 alt="${movieData.title}"
                                 onerror="this.src='/assets/placeholder.jpg'"
                                 loading="lazy">
                        </div>
                        <div class="movie-info">
                            <h3>${movieData.title}</h3>
                        </div>
                    `;

                    const img = card.querySelector('img');
                    const loadingOverlay = card.querySelector('.loading-overlay');

                    // Manejar eventos de carga de imagen
                    img.onload = () => loadingOverlay.remove();
                    img.onerror = () => {
                        img.src = '/assets/placeholder.jpg';
                        loadingOverlay.remove();
                    };
                    
                    card.addEventListener('click', () => {
                        window.location.href = `movie.html?id=${doc.id}`;
                    });
                    
                    recommendedContainer.appendChild(card);
                }
            }

            const recommendedSection = document.querySelector('.recommended-movies');
            if (recommendedSection) {
                recommendedSection.style.display = 
                    recommendedContainer.children.length > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error("Error al cargar películas recomendadas:", error);
    }
}

function showError(message) {
    const container = document.querySelector('.container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="location.reload()">Reintentar</button>
    `;
    container.insertBefore(errorDiv, container.firstChild);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadMovieDetails);
