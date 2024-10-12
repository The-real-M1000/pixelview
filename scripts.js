// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Inicializa Firestore
const db = getFirestore(app);
console.log("Firebase inicializado correctamente");

// Referencias a elementos del DOM
let videoList;
let genereButtons;
let searchInput;
let searchButton;
let videoForm;
let loadMoreButton;
let sortAlphabeticallyButton;
let sortByDateButton;

// Variables para la paginación y ordenación
let lastVisible = null;
const pageSize = 20;
let currentGenre = 'all';
let currentSortMethod = 'date';
let currentPage = 1;

// Función para normalizar el texto del género
function normalizeGenre(genre) {
    return genre.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/á/g, 'a')
                .replace(/é/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ó/g, 'o')
                .replace(/ú/g, 'u')
                .replace(/ñ/g, 'n');
}

// Función para inicializar elementos del DOM
function initializeElements() {
    videoList = document.getElementById('videoList');
    genereButtons = document.getElementById('genereButtons');
    searchInput = document.getElementById('search-bar');
    searchButton = document.getElementById('search-button');
    videoForm = document.getElementById('videoForm');
    loadMoreButton = document.getElementById('loadMoreButton');
    sortAlphabeticallyButton = document.querySelector('.sort-buttons button:first-child');
    sortByDateButton = document.querySelector('.sort-buttons button:last-child');

    if (!videoList) console.error("Elemento 'videoList' no encontrado");
    if (!genereButtons) console.error("Elemento 'genereButtons' no encontrado");
    if (!searchInput) console.error("Elemento 'searchInput' no encontrado");
    if (!searchButton) console.error("Elemento 'searchButton' no encontrado");
    if (!videoForm) console.error("Elemento 'videoForm' no encontrado");
    if (!loadMoreButton) console.error("Elemento 'loadMoreButton' no encontrado");
    if (!sortAlphabeticallyButton) console.error("Elemento 'sortAlphabetically' no encontrado");
    if (!sortByDateButton) console.error("Elemento 'sortByDate' no encontrado");
}

// Función para validar el formulario
function validateForm() {
    const title = document.getElementById("videoTitle").value;
    const url = document.getElementById("videoUrl").value;
    const imageUrl = document.getElementById("imageUrl").value;
    
    if (!title || !url || !imageUrl) {
        alert("Por favor, rellena todos los campos");
        return false;
    }
    
    if (!isValidUrl(url) || !isValidUrl(imageUrl)) {
        alert("Por favor, introduce URLs válidas");
        return false;
    }
    
    return true;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;  
    }
}

// Función para subir video
function setupVideoForm() {
    if (videoForm) {
        videoForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!validateForm()) return;

            const videoTitle = document.getElementById("videoTitle").value;
            const videoUrl = document.getElementById("videoUrl").value;
            const imageUrl = document.getElementById("imageUrl").value;
            const videoType = document.getElementById("videoType").value;
            const videoGenere = normalizeGenre(document.getElementById("videoGenere").value);
            const videoRating = document.getElementById("videoRating").value;
            const videoDescription = document.getElementById("videoDescription").value;

            try {
                const docId = videoTitle.toLowerCase().replace(/\s+/g, '-');
                await setDoc(doc(db, "videos", docId), {
                    title: videoTitle,
                    videoUrl: videoUrl,
                    imageUrl: imageUrl,
                    type: videoType,
                    genere: videoGenere,
                    rating: videoRating,
                    description: videoDescription,
                    uploadDate: new Date().toISOString()
                });

                console.log("Video subido con género:", videoGenere);
                alert("Video subido correctamente");
                loadVideos();
                videoForm.reset();
            } catch (error) {
                console.error("Error al subir el video: ", error);
                alert("Error al subir el video. Por favor, intenta de nuevo.");
            }
        });
    }
}
// Función para cargar y mostrar videos
async function loadVideos(isLoadMore = false) {
    console.log("Cargando videos - Género:", currentGenre, "Orden:", currentSortMethod);
    if (!videoList) {
        console.error("videoList no está definido");
        return;
    }
    
    if (!isLoadMore) {
        videoList.innerHTML = "";
        lastVisible = null;
        currentPage = 1;
    }

    try {
        let videosQuery = collection(db, "videos");

        if (currentGenre !== 'all') {
            videosQuery = query(videosQuery, where("genere", "==", currentGenre));
        }

        if (currentSortMethod === 'alphabetical') {
            videosQuery = query(videosQuery, orderBy("title"));
        } else {
            videosQuery = query(videosQuery, orderBy("uploadDate", "desc"));
        }

        videosQuery = query(videosQuery, limit(pageSize));

        if (lastVisible) {
            videosQuery = query(videosQuery, startAfter(lastVisible));
        }

        const querySnapshot = await getDocs(videosQuery);
        if (querySnapshot.empty) {
            console.log("No se encontraron videos");
            if (!isLoadMore) {
                videoList.innerHTML = `<p>No se encontraron videos para el género: ${currentGenre}.</p>`;
            }
            loadMoreButton.style.display = 'none';
        } else {
            querySnapshot.forEach((doc) => {
                const videoData = doc.data();
                console.log("Video cargado:", videoData);
                const videoContainer = createVideoCard(videoData);
                videoList.appendChild(videoContainer);
            });
            lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            loadMoreButton.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al cargar videos:", error);
        videoList.innerHTML += "<p>Error al cargar videos. Por favor, intenta de nuevo más tarde.</p>";
    }
      querySnapshot.forEach((doc) => {
        const videoData = doc.data();
        console.log("Video cargado:", videoData);
        const videoContainer = createVideoCard(videoData);
        videoList.appendChild(videoContainer);
    });

    lazyLoadImages();
}

// Función para crear un elemento de tarjeta de video
function createVideoCard(videoData) {
    console.log("Creando tarjeta para:", videoData.title);
    const videoContainer = document.createElement("div");
    videoContainer.className = 'movie';
    videoContainer.setAttribute('tabindex', '0');
    videoContainer.setAttribute('role', 'button');
    videoContainer.setAttribute('aria-label', `Ver detalles de: ${videoData.title}`);
    
    const safeTitle = sanitizeInput(videoData.title);
    videoContainer.innerHTML = `
        <div class="image-container">
            <img src="placeholder.jpg" data-src="${videoData.imageUrl}" alt="${safeTitle}" loading="lazy">
        </div>
        <h2 class="title">${safeTitle}</h2>
        <div class="info">${videoData.type} - ${videoData.genere}</div>
    `;
    
    // Importante: Usamos una función de flecha para preservar el contexto de 'this'
    videoContainer.addEventListener('click', () => {
        showMovieDetails(videoData);
    });

    return videoContainer;
}

// Función para mostrar los detalles de la película
function showMovieDetails(videoData) {
    console.log("Mostrando detalles para:", videoData.title); // Agregado para depuración
    const movieDetailsContainer = document.createElement('div');
    movieDetailsContainer.className = 'movie-details';
    movieDetailsContainer.innerHTML = `
        <div class="movie-details-content">
            <button class="close-button">&times;</button>
            <h2>${sanitizeInput(videoData.title)}</h2>
            <img src="${videoData.imageUrl}" alt="${sanitizeInput(videoData.title)}">
            <p>Género: ${videoData.genere}</p>
            <p>Tipo: ${videoData.type}</p>
            <p>Calificación: ${videoData.rating || 'No disponible'}</p>
            <p>Descripción: ${videoData.description || 'No disponible'}</p>
            <button class="watch-button">Ver película</button>
        </div>
    `;

    document.body.appendChild(movieDetailsContainer);

     // Añadir evento para cerrar los detalles
    const closeButton = movieDetailsContainer.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(movieDetailsContainer);
    });
      const watchButton = movieDetailsContainer.querySelector('.watch-button');
    watchButton.addEventListener('click', () => {
        window.open(videoData.videoUrl, '_blank');
    });
}

// Función para actualizar la apariencia de los botones de ordenación
function updateSortButtons() {
    if (sortAlphabeticallyButton && sortByDateButton) {
        sortAlphabeticallyButton.classList.toggle('active', currentSortMethod === 'alphabetical');
        sortByDateButton.classList.toggle('active', currentSortMethod === 'date');
    }
}

// Configurar event listeners
function setupEventListeners() {
    if (searchButton) {
        searchButton.addEventListener("click", performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                performSearch();
            }
        });
    }
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            loadVideos(true);
        });
    }
    setupGenreAndSortButtons();
}

// Función para configurar los botones de género y ordenación
function setupGenreAndSortButtons() {
    if (genereButtons) {
        const genreButtons = genereButtons.querySelectorAll('button:not(.sort-buttons button)');
        genreButtons.forEach(button => {
            button.addEventListener('click', () => {
                let selectedGenre = button.textContent;
                console.log("Género seleccionado (original):", selectedGenre);
                
                if (selectedGenre.toLowerCase() === 'todos') {
                    currentGenre = 'all';
                } else {
                    currentGenre = normalizeGenre(selectedGenre);
                }
                
                console.log("Género normalizado:", currentGenre);
                lastVisible = null; // Resetear la paginación
                loadVideos();

                genreButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    if (sortAlphabeticallyButton && sortByDateButton) {
        sortAlphabeticallyButton.addEventListener('click', () => {
            currentSortMethod = 'alphabetical';
            updateSortButtons();
            lastVisible = null; // Resetear la paginación
            loadVideos();
        });

        sortByDateButton.addEventListener('click', () => {
            currentSortMethod = 'date';
            updateSortButtons();
            lastVisible = null; // Resetear la paginación
            loadVideos();
        });
    }
}

// Función para buscar videos
async function performSearch() {
    if (!searchInput || !videoList) {
        console.error("Elementos de búsqueda no encontrados");
        return;
    }

    const searchQuery = searchInput.value.toLowerCase();
    videoList.innerHTML = "";
    lastVisible = null; // Resetear la paginación

    let videosQuery = collection(db, "videos");
    videosQuery = query(videosQuery, orderBy("title"));

    try {
        const querySnapshot = await getDocs(videosQuery);
        let resultsFound = false;
        
        querySnapshot.forEach((doc) => {
            const videoData = doc.data();
            if (videoData.title.toLowerCase().includes(searchQuery)) {
                const videoContainer = createVideoCard(videoData);
                videoList.appendChild(videoContainer);
                resultsFound = true;
            }
        });

        if (!resultsFound) {
            videoList.innerHTML = "<p>No se encontraron resultados para la búsqueda.</p>";
        }
        loadMoreButton.style.display = 'none'; // Ocultar el botón en búsquedas
    } catch (error) {
        console.error("Error al realizar la búsqueda:", error);
        videoList.innerHTML = "<p>Error al realizar la búsqueda. Por favor, intenta de nuevo más tarde.</p>";
    }
}

// Función para crear el efecto ripple en los botones
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// Función para implementar lazy loading de imágenes
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                };
                observer.unobserve(img);
            }
        });
    }, options);

    images.forEach(img => observer.observe(img));
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM completamente cargado y parseado");
    initializeElements();
    setupVideoForm();
    setupEventListeners();
    updateSortButtons(); // Actualizar los botones de ordenación al inicio
    loadVideos();

    // Añadir efecto ripple a todos los botones
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
        button.addEventListener("click", createRipple);
    }
});
