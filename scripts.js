// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
let instructionsPopup;
let acceptButton;
let loadMoreButton;
let pageInfo;

// Variables para paginación
const VIDEOS_PER_PAGE = 25;
let lastDoc = null;
let currentGenere = 'all';
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
    instructionsPopup = document.getElementById('instructionsPopup');
    acceptButton = document.getElementById('acceptButton');
    
    loadMoreButton = document.createElement('button');
    loadMoreButton.textContent = 'Cargar más';
    loadMoreButton.id = 'loadMoreButton';
    loadMoreButton.style.display = 'none';
    
    pageInfo = document.createElement('div');
    pageInfo.id = 'pageInfo';
    
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'paginationContainer';
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(loadMoreButton);
    
    document.body.appendChild(paginationContainer);

    // Verificar si los elementos existen
    if (!videoList) console.error("Elemento 'videoList' no encontrado");
    if (!genereButtons) console.error("Elemento 'genereButtons' no encontrado");
    if (!searchInput) console.error("Elemento 'searchInput' no encontrado");
    if (!searchButton) console.error("Elemento 'searchButton' no encontrado");
    if (!videoForm) console.error("Elemento 'videoForm' no encontrado");
    if (!instructionsPopup) console.error("Elemento 'instructionsPopup' no encontrado");
    if (!acceptButton) console.error("Elemento 'acceptButton' no encontrado");
}

// Función para cargar y mostrar videos
async function loadVideos(isInitialLoad = true) {
    console.log("Cargando videos...");
    if (!videoList) {
        console.error("videoList no está definido");
        return;
    }

    if (isInitialLoad) {
        videoList.innerHTML = "";
        lastDoc = null;
        currentPage = 1;
    }

    let videosQuery = query(
        collection(db, "videos"),
        orderBy("title"),
        limit(VIDEOS_PER_PAGE)
    );

    if (currentGenere !== 'all') {
        videosQuery = query(videosQuery, where("genere", "==", currentGenere));
    }

    if (lastDoc) {
        videosQuery = query(videosQuery, startAfter(lastDoc));
    }

    try {
        const querySnapshot = await getDocs(videosQuery);
        console.log("Documentos recuperados:", querySnapshot.size);
        if (querySnapshot.empty && isInitialLoad) {
            console.log("No se encontraron videos para el género:", currentGenere);
            videoList.innerHTML = `<p>No se encontraron videos para el género: ${currentGenere}.</p>`;
            loadMoreButton.style.display = 'none';
            pageInfo.textContent = '';
        } else {
            querySnapshot.forEach((doc) => {
                const videoData = doc.data();
                console.log("Datos del video:", videoData);
                const videoContainer = createVideoCard(videoData);
                videoList.appendChild(videoContainer);
            });

            lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            loadMoreButton.style.display = querySnapshot.size === VIDEOS_PER_PAGE ? 'block' : 'none';
            updatePageInfo();
        }
    } catch (error) {
        console.error("Error al cargar videos:", error);
        videoList.innerHTML += "<p>Error al cargar videos. Por favor, intenta de nuevo más tarde.</p>";
    }
}

// Función para crear un elemento de tarjeta de video
function createVideoCard(videoData) {
    const videoContainer = document.createElement("div");
    videoContainer.className = 'movie';
    videoContainer.innerHTML = `
        <img src="${videoData.imageUrl}" alt="${videoData.title}" loading="lazy">
        <div class="title">${videoData.title}</div>
        <div class="info">${videoData.type} - ${videoData.genere}</div>
    `;
    videoContainer.addEventListener('click', () => {
        window.open(videoData.videoUrl, '_blank');
    });
    return videoContainer;
}

// Función para actualizar la información de la página
function updatePageInfo() {
    pageInfo.textContent = `Página ${currentPage}`;
}

// Función para mostrar el pop-up
function showPopup() {
    if (instructionsPopup) {
        instructionsPopup.style.display = 'block';
    }
}

// Función para ocultar el pop-up
function hidePopup() {
    if (instructionsPopup) {
        instructionsPopup.style.display = 'none';
    }
}

// Función para configurar los botones de género
function setupGenreButtons() {
    if (genereButtons) {
        genereButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                let selectedGenre = e.target.textContent;
                console.log("Género seleccionado (original):", selectedGenre);
                
                if (selectedGenre.toLowerCase() === 'todos') {
                    currentGenere = 'all';
                } else {
                    currentGenere = normalizeGenre(selectedGenre);
                }
                
                console.log("Género normalizado:", currentGenere);
                loadVideos(true);

                const buttons = genereButtons.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
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
    if (acceptButton) {
        acceptButton.addEventListener('click', hidePopup);
    }
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            loadVideos(false);
        });
    }
    setupGenreButtons();
}

// Función para buscar videos
async function performSearch() {
    if (!searchInput || !videoList) {
        console.error("Elementos de búsqueda no encontrados");
        return;
    }

    const searchTerm = searchInput.value.toLowerCase();
    videoList.innerHTML = "";
    lastDoc = null;
    currentPage = 1;
    loadMoreButton.style.display = 'none';

    const videosQuery = query(
        collection(db, "videos"),
        where("title", ">=", searchTerm),
        where("title", "<=", searchTerm + '\uf8ff'),
        limit(VIDEOS_PER_PAGE)
    );

    try {
        const querySnapshot = await getDocs(videosQuery);
        console.log("Resultados de búsqueda:", querySnapshot.size);
        if (querySnapshot.empty) {
            videoList.innerHTML = "<p>No se encontraron resultados para la búsqueda.</p>";
            pageInfo.textContent = '';
        } else {
            querySnapshot.forEach((doc) => {
                const videoData = doc.data();
                const videoContainer = createVideoCard(videoData);
                videoList.appendChild(videoContainer);
            });

            lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            loadMoreButton.style.display = querySnapshot.size === VIDEOS_PER_PAGE ? 'block' : 'none';
            updatePageInfo();
        }
    } catch (error) {
        console.error("Error al realizar la búsqueda:", error);
        videoList.innerHTML = "<p>Error al realizar la búsqueda. Por favor, intenta de nuevo más tarde.</p>";
    }
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente cargado y parseado");
    initializeElements();
    setupEventListeners();
    loadVideos(true);
    showPopup();
});
