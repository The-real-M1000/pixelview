import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
        
        // Mostrar el video directamente desde la URL
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
            
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentMovieId) {
                    const movieData = doc.data();
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    
                    card.innerHTML = `
                        <img src="${movieData.imageUrl || '/assets/placeholder.jpg'}" 
                             alt="${movieData.title}"
                             onerror="this.src='/assets/placeholder.jpg'"
                             loading="lazy">
                        <div class="movie-info">
                            <h3>${movieData.title}</h3>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        window.location.href = `movie.html?id=${doc.id}`;
                    });
                    
                    recommendedContainer.appendChild(card);
                }
            });

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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadMovieDetails);