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
let instructionsPopup;
let acceptButton;
let loadMoreButton;
let sortAlphabeticallyButton;
let sortByDateButton;

// Variables para la paginación y ordenación
let lastVisible = null;
const pageSize = 25;
let currentGenre = 'all';
let currentSortMethod = 'date'; // Por defecto, ordenar por fecha

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
    loadMoreButton = document.getElementById('loadMoreButton');
    sortAlphabeticallyButton = document.getElementById('sortAlphabetically');
    sortByDateButton = document.getElementById('sortByDate');

    if (!videoList) console.error("Elemento 'videoList' no encontrado");
    if (!genereButtons) console.error("Elemento 'genereButtons' no encontrado");
    if (!searchInput) console.error("Elemento 'searchInput' no encontrado");
    if (!searchButton) console.error("Elemento 'searchButton' no encontrado");
    if (!videoForm) console.error("Elemento 'videoForm' no encontrado");
    if (!instructionsPopup) console.error("Elemento 'instructionsPopup' no encontrado");
    if (!acceptButton) console.error("Elemento 'acceptButton' no encontrado");
    if (!loadMoreButton) console.error("Elemento 'loadMoreButton' no encontrado");
    if (!sortAlphabeticallyButton) console.error("Elemento 'sortAlphabetically' no encontrado");
    if (!sortByDateButton) console.error("Elemento 'sortByDate' no encontrado");
}

// Función para subir video
function setupVideoForm() {
    if (videoForm) {
        videoForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const videoTitle = document.getElementById("videoTitle").value;
            const videoUrl = document.getElementById("videoUrl").value;
            const imageUrl = document.getElementById("imageUrl").value;
            const videoType = document.getElementById("videoType").value;
            const videoGenere = normalizeGenre(document.getElementById("videoGenere").value);

            try {
                const docId = videoTitle.toLowerCase().replace(/\s+/g, '-');
                await setDoc(doc(db, "videos", docId), {
                    title: videoTitle,
                    videoUrl: videoUrl,
                    imageUrl: imageUrl,
                    type: videoType,
                    genere: videoGenere,
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
    console.log("Cargando videos para el género:", currentGenre, "Orden:", currentSortMethod);
    if (!videoList) {
        console.error("videoList no está definido");
        return;
    }
    
    if (!isLoadMore) {
        videoList.innerHTML = "";
        lastVisible = null;
    }

    let videosQuery = collection(db, "videos");
    if (currentGenre !== 'all') {
        videosQuery = query(videosQuery, where("genere", "==", currentGenre));
    }

    // Aplicar ordenación
    if (currentSortMethod === 'alphabetical') {
        videosQuery = query(videosQuery, orderBy("title"));
    } else {
        videosQuery = query(videosQuery, orderBy("uploadDate", "desc"));
    }

    videosQuery = query(videosQuery, limit(pageSize));

    if (lastVisible) {
        videosQuery = query(videosQuery, startAfter(lastVisible));
    }

    try {
        const querySnapshot = await getDocs(videosQuery);
        if (querySnapshot.empty) {
            console.log("No se encontraron más videos");
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
}

// Función para crear un elemento de tarjeta de video
function createVideoCard(videoData) {
    console.log("Creando tarjeta para:", videoData.title);
    const videoContainer = document.createElement("div");
    videoContainer.className = 'movie';
    videoContainer.innerHTML = `
        <div class="image-container">
            <img src="placeholder.jpg" data-src="${videoData.imageUrl}" alt="${videoData.title}" loading="lazy">
        </div>
        <div class="title">${videoData.title}</div>
        <div class="info">${videoData.type} - ${videoData.genere}</div>
    `;
    videoContainer.addEventListener('click', () => {
        window.open(videoData.videoUrl, '_blank');
    });

    // Implementar lazy loading
    const img = videoContainer.querySelector('img');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = img.dataset.src;
                    img.onload = () => {
                        img.classList.add('loaded');
                    };
                    observer.unobserve(img);
                }
            });
        });
        observer.observe(img);
    } else {
        img.src = img.dataset.src;
        img.onload = () => {
            img.classList.add('loaded');
        };
    }

    return videoContainer;
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

// Función para configurar los botones de género y ordenación
function setupGenreAndSortButtons() {
    if (genereButtons) {
        genereButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                let selectedGenre = e.target.textContent;
                console.log("Género seleccionado (original):", selectedGenre);
                
                if (selectedGenre.toLowerCase() === 'todos') {
                    currentGenre = 'all';
                } else {
                    currentGenre = normalizeGenre(selectedGenre);
                }
                
                console.log("Género normalizado:", currentGenre);
                lastVisible = null; // Resetear la paginación
                loadVideos();

                const buttons = genereButtons.querySelectorAll('button:not(.sort-buttons button)');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
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
    if (acceptButton) {
        acceptButton.addEventListener('click', hidePopup);
    }
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => loadVideos(true));
    }
    setupGenreAndSortButtons();
}

// Función para buscar videos
async function performSearch() {
    if (!searchInput || !videoList) {
        console.error("Elementos de búsqueda no encontrados");
        return;
    }

    const query = searchInput.value.toLowerCase();
    videoList.innerHTML = "";
    lastVisible = null; // Resetear la paginación

    const videosQuery = collection(db, "videos");
    try {
        const querySnapshot = await getDocs(videosQuery);
        let resultsFound = false;
        
        querySnapshot.forEach((doc) => {
            const videoData = doc.data();
            if (videoData.title.toLowerCase().includes(query)) {
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

// Inicialización principal
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM completamente cargado y parseado");
    initializeElements();
    setupVideoForm();
    setupEventListeners();
    updateSortButtons(); // Actualizar los botones de ordenación al inicio
    loadVideos();
    showPopup();
});
