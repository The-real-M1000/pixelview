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

// Referencias a elementos del DOM
const videoList = document.getElementById('videoList');
const genereButtons = document.getElementById('genereButtons');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// Verifica si el formulario existe antes de añadir el event listener
const videoForm = document.getElementById('videoForm');

// Variable para almacenar el filtro de género actual
let currentGenere = 'all';

// Función para subir video (solo si el formulario está presente)
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

// Función para cargar y mostrar videos
async function loadVideos() {
    if (!videoList) return; // Verificación de que videoList existe
    videoList.innerHTML = ""; // Limpiar lista antes de recargar

    let videosQuery = collection(db, "videos");

    if (currentGenere !== 'all') {
        videosQuery = query(videosQuery, where("genere", "==", currentGenere));
    }

    const querySnapshot = await getDocs(videosQuery);
    querySnapshot.forEach((doc) => {
        const videoData = doc.data();
        const videoContainer = createVideoCard(videoData);
        videoList.appendChild(videoContainer);
    });
}

// Función para crear un elemento de tarjeta de video
function createVideoCard(videoData) {
    const videoContainer = document.createElement("div");
    videoContainer.className = 'video-card';
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

// Event listener para los botones de género
if (genereButtons) {
    genereButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('genere-btn')) {
            // Remover la clase 'active' de todos los botones
            genereButtons.querySelectorAll('.genere-btn').forEach(btn => btn.classList.remove('active'));
            // Añadir la clase 'active' al botón clickeado
            e.target.classList.add('active');
            
            currentGenere = e.target.dataset.genere;
            console.log("Género seleccionado:", currentGenere); // Para depuración
            loadVideos();
        }
    });
}
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita el envío del formulario si está dentro de uno
        performSearch(); // Llama a tu función de búsqueda
    }
});

document.getElementById('searchButton').addEventListener('click', function() {
    performSearch(); // Llama a tu función de búsqueda al hacer clic en el botón
});

function performSearch() {
    const query = document.getElementById('searchInput').value;
    // Aquí puedes implementar la lógica de búsqueda, como redirigir a una nueva página o filtrar resultados
    console.log('Buscando:', query); // Reemplaza esto con tu lógica de búsqueda
}


// Event listener para la búsqueda
if (searchButton) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const videoCards = videoList.getElementsByClassName('video-card');
        
        Array.from(videoCards).forEach((card) => {
            const title = card.querySelector('.title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Cargar todos los videos al inicio si estamos en la página principal
document.addEventListener('DOMContentLoaded', (event) => {
    if (videoList) { // Verifica si existe la lista de videos antes de intentar cargar
        loadVideos();
    }
});
