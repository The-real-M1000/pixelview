// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Variable para almacenar el filtro de género actual
let currentGenere = 'all';

// Función para normalizar el texto del género
function normalizeGenre(genre) {
    return genre.toLowerCase()
                .replace(/\s+/g, '-')  // Reemplaza espacios con guiones
                .replace(/á/g, 'a')    // Elimina acentos
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

    if (!videoList) console.error("Elemento 'videoList' no encontrado");
    if (!genereButtons) console.error("Elemento 'genereButtons' no encontrado");
    if (!searchInput) console.error("Elemento 'searchInput' no encontrado");
    if (!searchButton) console.error("Elemento 'searchButton' no encontrado");
    if (!videoForm) console.error("Elemento 'videoForm' no encontrado");
    if (!instructionsPopup) console.error("Elemento 'instructionsPopup' no encontrado");
    if (!acceptButton) console.error("Elemento 'acceptButton' no encontrado");
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
                    genere: videoGenere
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
async function loadVideos() {
    console.log("Cargando videos para el género:", currentGenere);
    if (!videoList) {
        console.error("videoList no está definido");
        return;
    }
    videoList.innerHTML = "";

    let videosQuery = collection(db, "videos");
    if (currentGenere !== 'all') {
        videosQuery = query(videosQuery, where("genere", "==", currentGenere));
    }

    try {
        const querySnapshot = await getDocs(videosQuery);
        if (querySnapshot.empty) {
            console.log("No se encontraron videos para el género:", currentGenere);
            videoList.innerHTML = `<p>No se encontraron videos para el género: ${currentGenere}.</p>`;
        } else {
            querySnapshot.forEach((doc) => {
                const videoData = doc.data();
                console.log("Video cargado:", videoData);
                const videoContainer = createVideoCard(videoData);
                videoList.appendChild(videoContainer);
            });
        }
    } catch (error) {
        console.error("Error al cargar videos:", error);
        videoList.innerHTML = "<p>Error al cargar videos. Por favor, intenta de nuevo más tarde.</p>";
    }
}

// Función para crear un elemento de tarjeta de video
function createVideoCard(videoData) {
    console.log("Creando tarjeta para:", videoData.title);
    const videoContainer = document.createElement("div");
    videoContainer.className = 'movie';
    videoContainer.innerHTML = `
        <img src="${videoData.imageUrl}" alt="${videoData.title}">
        <div class="title">${videoData.title}</div>
        <div class="info">${videoData.type} - ${videoData.genere}</div>
    `;
    videoContainer.addEventListener('click', () => {
        window.open(videoData.videoUrl, '_blank');
    });
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
                loadVideos();

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
    setupGenreButtons();
}

// Función para buscar videos
async function performSearch() {
    if (!searchInput || !videoList) {
        console.error("Elementos de búsqueda no encontrados");
        return;
    }

    const query = searchInput.value.toLowerCase();
    videoList.innerHTML = "";

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
    loadVideos();
    showPopup();
});