// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmHL0-1uJZgPAhxqDN4zA1uXH-X6YtzY",
    authDomain: "pixelview-30.firebaseapp.com",
    projectId: "pixelview-30",
    storageBucket: "pixelview-30.appspot.com",
    messagingSenderId: "267067796738",
    appId: "1:267067796738:web:cadd6fd09b25f94fb5661b",
    measurementId: "G-4VPZX8PV0N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to normalize text (remove accents, lowercase, etc.)
function normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/[^a-z0-9\s]/g, "")
               .trim()
               .replace(/\s+/g, "-");
}

// Function to get current date in required format
function getCurrentFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours());
    const minutes = String(now.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Function to show status messages
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Function to create season fields
function createSeasonFields(seasonNumber, episodeCount = 1) {
    const seasonContainer = document.createElement('div');
    seasonContainer.className = 'season-container';
    seasonContainer.innerHTML = `
        <div class="season-header">Temporada ${seasonNumber}</div>
        <div class="form-group">
            <label for="season${seasonNumber}Episodes">Número de Episodios</label>
            <input type="number" id="season${seasonNumber}Episodes" 
                   name="season${seasonNumber}Episodes" min="1" value="${episodeCount}"
                   class="episode-count">
        </div>
        <div class="episodes-container" id="season${seasonNumber}EpisodesContainer">
        </div>
    `;

    // Add episode fields
    const episodesContainer = seasonContainer.querySelector('.episodes-container');
    for (let i = 1; i <= episodeCount; i++) {
        addEpisodeField(episodesContainer, seasonNumber, i);
    }

    // Listen for changes in episode count
    const episodeInput = seasonContainer.querySelector('.episode-count');
    episodeInput.addEventListener('change', (e) => {
        updateEpisodeFields(episodesContainer, seasonNumber, e.target.value);
    });

    return seasonContainer;
}

// Function to add episode field
function addEpisodeField(container, seasonNumber, episodeNumber) {
    const episodeDiv = document.createElement('div');
    episodeDiv.className = 'episode-container';
    episodeDiv.innerHTML = `
        <div class="episode-header">Episodio ${episodeNumber}</div>
        <div class="form-group">
            <label for="s${seasonNumber}e${episodeNumber}url">URL del Episodio</label>
            <input  id="s${seasonNumber}e${episodeNumber}url" 
                   name="s${seasonNumber}e${episodeNumber}url" required>
        </div>
    `;
    container.appendChild(episodeDiv);
}

// Function to update episode fields
function updateEpisodeFields(container, seasonNumber, newCount) {
    container.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        addEpisodeField(container, seasonNumber, i);
    }
}

// Function to update season fields
function updateSeasonFields() {
    const seasonCount = parseInt(document.getElementById('seasonCount').value);
    const container = document.getElementById('seasonsContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= seasonCount; i++) {
        container.appendChild(createSeasonFields(i));
    }
}

// Function to validate form data
function validateFormData(form, type) {
    const title = form.querySelector('#title').value.trim();
    const genere = form.querySelector('#genere').value;

    if (!title) throw new Error('El título es requerido');
    if (!genere) throw new Error('El género es requerido');

    if (type === 'movie') {
        const movieUrl = form.querySelector('#movieUrl').value.trim();
        if (!movieUrl) throw new Error('La URL de la película es requerida');
    } else if (type === 'series') {
        const seasonCount = parseInt(form.querySelector('#seasonCount').value);
        if (seasonCount < 1) throw new Error('Debe haber al menos una temporada');

        // Validate each season has at least one episode with URL
        for (let s = 1; s <= seasonCount; s++) {
            const episodeCount = parseInt(form.querySelector(`#season${s}Episodes`).value);
            if (episodeCount < 1) throw new Error(`La temporada ${s} debe tener al menos un episodio`);

            for (let e = 1; e <= episodeCount; e++) {
                const url = form.querySelector(`#s${s}e${e}url`).value.trim();
                if (!url) throw new Error(`Falta la URL del episodio ${e} de la temporada ${s}`);
            }
        }
    }
}

// Function to upload video
async function uploadVideo(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Subiendo...';
    
    try {
        const type = form.querySelector('#type').value;
        
        // Validate form data
        validateFormData(form, type);

        // Prepare basic video data
        const videoData = {
            title: form.querySelector('#title').value.trim(),
            originalTitle: form.querySelector('#originalTitle').value.trim() || null,
            type,
            genere: form.querySelector('#genere').value,
            uploadDate: getCurrentFormattedDate(),
            normalizedTitle: normalizeText(form.querySelector('#title').value.trim())
        };

        // Add type-specific data
        if (type === 'movie') {
            videoData.videoUrl = form.querySelector('#movieUrl').value.trim();
        } else if (type === 'series') {
            const seasons = [];
            const seasonCount = parseInt(form.querySelector('#seasonCount').value);
            
            for (let s = 1; s <= seasonCount; s++) {
                const episodeCount = parseInt(form.querySelector(`#season${s}Episodes`).value);
                const episodes = [];
                
                for (let e = 1; e <= episodeCount; e++) {
                    const url = form.querySelector(`#s${s}e${e}url`).value.trim();
                    episodes.push({
                        episode: e,
                        url
                    });
                }
                
                seasons.push({
                    season: s,
                    episodeCount,
                    episodes
                });
            }
            
            videoData.seasons = seasons;
        }

        // Upload to Firestore
        const docRef = await addDoc(collection(db, "videos"), videoData);
        showMessage('¡Contenido subido exitosamente!');
        
        // Redirect after successful upload
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error("Error al subir:", error);
        showMessage(error.message, true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Subir video';
    }
}

// Event Listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const typeSelect = document.getElementById('type');
    const seriesFields = document.getElementById('seriesFields');
    const movieFields = document.getElementById('movieFields');
    const seasonCount = document.getElementById('seasonCount');

    // Form submit handler
    if (uploadForm) {
        uploadForm.addEventListener('submit', uploadVideo);
    }

    // Type select handler
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'series') {
                seriesFields.style.display = 'block';
                movieFields.style.display = 'none';
                updateSeasonFields();
            } else if (e.target.value === 'movie') {
                seriesFields.style.display = 'none';
                movieFields.style.display = 'block';
            } else {
                seriesFields.style.display = 'none';
                movieFields.style.display = 'none';
            }
        });
    }

    // Season count change handler
    if (seasonCount) {
        seasonCount.addEventListener('change', updateSeasonFields);
    }
});

// Handle unhandled rejections
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled error:', event.reason);
    showMessage('Ocurrió un error inesperado. Por favor, intenta de nuevo.', true);
});