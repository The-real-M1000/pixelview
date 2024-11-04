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

// Función para obtener el path del icono SVG
function getIconPath(iconName) {
    const icons = {
        genre: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
        type: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M12 8v8M8 12h8"/>',
        duration: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        date: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        rating: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        director: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        cast: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        original: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
    };
    return icons[iconName] || icons.genre;
}

// Función para crear un elemento de metadato
function createMetadataItem(label, value, iconName) {
    return `
        <div class="metadata-item">
            <svg class="metadata-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${getIconPath(iconName)}
            </svg>
            <span class="metadata-label">${label}</span>
            <span class="metadata-value">${value}</span>
        </div>
    `;
}

// Funciones TMDB
async function searchMovie(originalTitle) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(originalTitle)}&language=es-ES`
        );
        
        if (!response.ok) {
            throw new Error('TMDB API request failed');
        }
        
        const data = await response.json();
        const exactMatch = data.results.find(
            movie => movie.original_title.toLowerCase() === originalTitle.toLowerCase()
        );
        
        return exactMatch || data.results[0];
    } catch (error) {
        console.error('Error searching TMDB:', error);
        return null;
    }
}

async function getMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=es-ES`
        );
        
        if (!response.ok) {
            throw new Error('TMDB API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting movie details:', error);
        return null;
    }
}

function getPosterUrl(posterPath, size = 'w500') {
    if (!posterPath) return null;
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

async function getMoviePoster(originalTitle) {
    try {
        const movie = await searchMovie(originalTitle);
        if (movie && movie.poster_path) {
            return {
                posterUrl: getPosterUrl(movie.poster_path),
                movieId: movie.id
            };
        }
        return { posterUrl: null, movieId: null };
    } catch (error) {
        console.error('Error getting movie poster:', error);
        return { posterUrl: null, movieId: null };
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
        
        if (!movieData.originalTitle) {
            console.warn('No se encontró el título original para la película:', movieData.title);
        }
        
        // Actualizar título
        document.getElementById('movieTitle').textContent = movieData.title;
        
        // Buscar información de TMDB
        const { posterUrl, movieId: tmdbId } = await getMoviePoster(movieData.originalTitle || movieData.title);
        
        // Actualizar póster
        const posterImage = document.getElementById('moviePoster');
        if (posterImage) {
            posterImage.src = posterUrl || '/assets/placeholder.jpg';
            posterImage.onerror = () => {
                posterImage.src = '/assets/placeholder.jpg';
            };
        }

        // Mostrar el video
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer && movieData.videoUrl) {
            videoContainer.innerHTML = movieData.videoUrl;
        } else {
            videoContainer.innerHTML = '<p>Video no disponible</p>';
        }

        // Obtener detalles adicionales de TMDB
        if (tmdbId) {
            const tmdbDetails = await getMovieDetails(tmdbId);
            if (tmdbDetails) {
                const director = tmdbDetails.credits.crew.find(person => person.job === "Director");
                const mainCast = tmdbDetails.credits.cast.slice(0, 3).map(actor => actor.name).join(', ');
                
                // Actualizar metadatos
                const metadataContainer = document.querySelector('.movie-metadata');
                if (metadataContainer) {
                    metadataContainer.innerHTML = `
                        <div class="metadata-section">
                            <h3>Información General</h3>
                            ${createMetadataItem('Género', movieData.genere || 'No especificado', 'genre')}
                            ${createMetadataItem('Tipo', movieData.type || 'No especificado', 'type')}
                            ${movieData.duration ? createMetadataItem('Duración', movieData.duration, 'duration') : ''}
                            ${createMetadataItem('Estreno', new Date(tmdbDetails.release_date).toLocaleDateString('es-ES'), 'date')}
                            ${createMetadataItem('Calificación', `${tmdbDetails.vote_average.toFixed(1)}/10`, 'rating')}
                        </div>
                        <div class="metadata-section">
                            <h3>Equipo y Reparto</h3>
                            ${director ? createMetadataItem('Director', director.name, 'director') : ''}
                            ${createMetadataItem('Reparto', mainCast, 'cast')}
                        </div>
                        <div class="metadata-section">
                            <h3>Detalles Adicionales</h3>
                            ${createMetadataItem('Título original', tmdbDetails.original_title, 'original')}
                        </div>
                    `;
                }
                
                // Actualizar sinopsis
                const descriptionElement = document.getElementById('movieDescription');
                if (descriptionElement) {
                    descriptionElement.innerHTML = `
                        <h3>Sinopsis</h3>
                        <p>${tmdbDetails.overview || movieData.description || 'No hay sinopsis disponible.'}</p>
                    `;
                }
            }
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
                    const { posterUrl } = await getMoviePoster(movieData.originalTitle || movieData.title);
                    
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    
                    card.innerHTML = `
                        <div class="image-container">
                            <div class="loading-overlay">
                                <div class="loading-spinner"></div>
                            </div>
                            <img src="${posterUrl || '/assets/placeholder.jpg'}" 
                                 alt="${movieData.title}"
                                 loading="lazy">
                        </div>
                        <div class="movie-info">
                            <h3>${movieData.title}</h3>
                        </div>
                    `;

                    const img = card.querySelector('img');
                    const loadingOverlay = card.querySelector('.loading-overlay');

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
