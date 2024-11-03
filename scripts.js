// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    setDoc, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAmHL0-1uJZgPAhxqDN4zA1uXH-X6YtzY",
    authDomain: "pixelview-30.firebaseapp.com",
    projectId: "pixelview-30",
    storageBucket: "pixelview-30.appspot.com",
    messagingSenderId: "267067796738",
    appId: "1:267067796738:web:cadd6fd09b25f94fb5661b",
    measurementId: "G-4VPZX8PV0N"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales para el estado de la aplicación
let lastVisible = null;
const pageSize = 20;
let currentGenre = 'all';
let currentSortMethod = 'date';
let isSearching = false;
let isLoading = false;

// Función para normalizar texto (eliminar acentos, convertir a minúsculas, etc.)
function normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/[^a-z0-9\s]/g, "")
               .trim()
               .replace(/\s+/g, "-");
}

// Función específica para normalizar géneros
function normalizeGenre(genre) {
    if (genre === 'Ciencia Ficción' || genre === 'ciencia ficcion') {
        return 'ciencia-ficcion';
    }
    return normalizeText(genre);
}

// Función para mostrar el estado de carga
function showLoading(container) {
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando contenido...</p>
        </div>
    `;
}

// Función para mostrar mensajes de error
function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="location.reload()">Reintentar</button>
        </div>
    `;
}

// Función principal para cargar videos
async function loadVideos(isLoadMore = false) {
    const videoList = document.getElementById('videoList');
    const loadMoreButton = document.getElementById('loadMoreContainer');
    
    if (!videoList || isLoading) return;
    
    try {
        isLoading = true;
        if (!isLoadMore) {
            showLoading(videoList);
            lastVisible = null;
        }

        // Construir la consulta base
        let videosRef = collection(db, "videos");
        let queryConstraints = [];

        // Aplicar filtros según el género seleccionado
        if (currentGenre !== 'all') {
            queryConstraints.push(where("genere", "==", currentGenre));
        }

        // Aplicar ordenamiento
        if (currentSortMethod === 'alphabetical') {
            queryConstraints.push(orderBy("title"));
        } else {
            queryConstraints.push(orderBy("uploadDate", "desc"));
        }

        // Aplicar paginación
        queryConstraints.push(limit(pageSize));
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        // Ejecutar la consulta
        const q = query(videosRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        // Manejar resultados vacíos
        if (querySnapshot.empty && !isLoadMore) {
            videoList.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron videos${currentGenre !== 'all' ? ` para el género: ${currentGenre}` : ''}.</p>
                </div>
            `;
            if (loadMoreButton) loadMoreButton.style.display = 'none';
            return;
        }

        // Procesar y mostrar resultados
        if (!isLoadMore) {
            videoList.innerHTML = '';
        }

        const fragment = document.createDocumentFragment();
        querySnapshot.forEach((doc) => {
            const videoData = { ...doc.data(), id: doc.id };
            const videoCard = createVideoCard(videoData);
            fragment.appendChild(videoCard);
        });
        videoList.appendChild(fragment);

        // Actualizar estado de paginación
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (loadMoreButton) {
            loadMoreButton.style.display = querySnapshot.size >= pageSize ? 'block' : 'none';
        }

    } catch (error) {
        console.error("Error al cargar videos:", error);
        if (!isLoadMore) {
            showError(videoList, "Error al cargar los videos. Por favor, intenta de nuevo más tarde.");
        }
    } finally {
        isLoading = false;
    }
}

// Función para crear tarjetas de video
function createVideoCard(videoData) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    card.innerHTML = `
        <div class="image-container">
            <img src="${videoData.imageUrl || '/assets/placeholder.jpg'}" 
                 alt="${videoData.title}"
                 onerror="this.src='/assets/placeholder.jpg'"
                 loading="lazy">
        </div>
        <div class="movie-info">
            <h3>${videoData.title}</h3>
            <p>${videoData.type || ''} ${videoData.genere ? `- ${videoData.genere}` : ''}</p>
        </div>
    `;

    // Agregar evento de clic para la navegación
    card.addEventListener('click', () => {
        window.location.href = `movie.html?id=${videoData.id}`;
    });

    // Implementar lazy loading de imágenes
    const img = card.querySelector('img');
    if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
    } else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = videoData.imageUrl || '/assets/placeholder.jpg';
                    observer.unobserve(img);
                }
            });
        });
        observer.observe(img);
    }

    return card;
}

// Función mejorada para búsqueda con debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función de búsqueda
async function performSearch() {
    const searchInput = document.getElementById('search-bar');
    const videoList = document.getElementById('videoList');
    const loadMoreButton = document.getElementById('loadMoreContainer');
    
    if (!searchInput || !videoList || isLoading) return;

    const searchQuery = normalizeText(searchInput.value);
    if (!searchQuery) {
        isSearching = false;
        loadVideos(false);
        return;
    }

    try {
        isLoading = true;
        isSearching = true;
        showLoading(videoList);
        
        const videosRef = collection(db, "videos");
        const q = query(videosRef, orderBy("title"));
        const querySnapshot = await getDocs(q);
        
        videoList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        let resultsFound = false;

        querySnapshot.forEach((doc) => {
            const videoData = { ...doc.data(), id: doc.id };
            const normalizedTitle = normalizeText(videoData.title);
            const normalizedGenre = normalizeText(videoData.genere || '');
            
            if (normalizedTitle.includes(searchQuery) || normalizedGenre.includes(searchQuery)) {
                const videoCard = createVideoCard(videoData);
                fragment.appendChild(videoCard);
                resultsFound = true;
            }
        });

        if (!resultsFound) {
            videoList.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron resultados para: "${searchInput.value}"</p>
                    <p>Intenta con otros términos de búsqueda.</p>
                </div>
            `;
        } else {
            videoList.appendChild(fragment);
        }

        if (loadMoreButton) {
            loadMoreButton.style.display = 'none';
        }

    } catch (error) {
        console.error("Error en la búsqueda:", error);
        showError(videoList, "Error al realizar la búsqueda. Por favor, intenta de nuevo.");
    } finally {
        isLoading = false;
    }
}

// Inicialización y configuración de eventos cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botones de género
    const genreButtons = document.querySelectorAll('.genre-button');
    genreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const genre = button.dataset.genre;
            currentGenre = genre;
            isSearching = false;
            
            genreButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            loadVideos(false);
        });
    });

    // Configurar botones de ordenamiento
    const sortButtons = document.querySelectorAll('.sort-button');
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentSortMethod = button.textContent.trim().toLowerCase() === 'a-z' ? 'alphabetical' : 'date';
            
            sortButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            if (!isSearching) {
                loadVideos(false);
            }
        });
    });

    // Configurar barra de búsqueda
    const searchInput = document.getElementById('search-bar');
    if (searchInput) {
        const debouncedSearch = debounce(() => performSearch(), 300);
        
        searchInput.addEventListener('input', debouncedSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Configurar botón de cargar más
    const loadMoreButton = document.getElementById('loadMoreContainer');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            if (!isLoading && !isSearching) {
                loadVideos(true);
            }
        });
    }

    // Cargar videos iniciales
    loadVideos(false);
});