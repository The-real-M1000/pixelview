// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAmHL0-1uJZgPAhxqDN4zA1uUXH-X6YtzY",
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

// Variable para almacenar el filtro de género actual
let currentGenere = 'all';

// Función para inicializar elementos del DOM
function initializeElements() {
    videoList = document.getElementById('videoList');
    genereButtons = document.getElementById('genereButtons');
    searchInput = document.getElementById('searchInput');
    searchButton = document.getElementById('searchButton');
    videoForm = document.getElementById('videoForm');

    if (!videoList) {
        console.error("Elemento 'videoList' no encontrado");
    }
    if (!genereButtons) {
        console.error("Elemento 'genereButtons' no encontrado");
    }
    if (!searchInput) {
        console.error("Elemento 'searchInput' no encontrado");
    }
    if (!searchButton) {
        console.error("Elemento 'searchButton' no encontrado");
    }
}

// Función para subir video (solo si el formulario está presente)
function setupVideoForm() {
    if (videoForm) {
        videoForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const videoTitle = document.getElementById("videoTitle").value;
            const videoUrl = document.getElementById("videoUrl").value;
            const imageUrl = document.getElementById("imageUrl").value;
            const videoType = document.getElementById("videoType").value;
            const videoGenere = document.getElementById("videoGenere").value;

            try {
                // Añadir datos del video a Firestore
                await addDoc(collection(db, "videos"), {
                    title: videoTitle,
                    videoUrl: videoUrl,
                    imageUrl: imageUrl,
                    type: videoType,
                    genere: videoGenere
                });

                alert("Video subido correctamente");
                loadVideos(); // Cargar los videos actualizados
                videoForm.reset(); // Limpiar el formulario
            } catch (error) {
                console.error("Error al subir el video: ", error);
            }
        });
    }
}

// Función para cargar y mostrar videos
async function loadVideos() {
    console.log("Cargando videos...");
    if (!videoList) {
        console.error("videoList no está definido");
        return;
    }
    videoList.innerHTML = ""; // Limpiar lista antes de recargar

    let videosQuery = collection(db, "videos");

    if (currentGenere !== 'all') {
        videosQuery = query(videosQuery, where("genere", "==", currentGenere));
    }

    try {
        const querySnapshot = await getDocs(videosQuery);
        if (querySnapshot.empty) {
            console.log("No se encontraron videos");
            videoList.innerHTML = "<p>No se encontraron videos.</p>";
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

// Configurar event listeners
function setupEventListeners() {
    if (genereButtons) {
        genereButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('genere-btn')) {
                genereButtons.querySelectorAll('.genere-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                currentGenere = e.target.dataset.genere;
                console.log("Género seleccionado:", currentGenere);
                loadVideos();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
}

// Función para buscar videos
async function performSearch() {
    if (!searchInput || !videoList) {
        console.error("Elementos de búsqueda no encontrados");
        return;
    }

    const query = searchInput.value.toLowerCase();
    videoList.innerHTML = ""; // Limpiar lista antes de recargar

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
});