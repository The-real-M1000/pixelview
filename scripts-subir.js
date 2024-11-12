// scripts-subir.js
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

// Function to normalize text
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

// Function to upload videos
async function uploadVideo(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable button while processing
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Subiendo...';
    }
    
    try {
        // Get form values
        const title = form.querySelector('[name="title"]').value.trim();
        const originalTitle = form.querySelector('[name="originalTitle"]').value.trim();
        const videoUrl = form.querySelector('[name="videoUrl"]').value.trim();
        const type = form.querySelector('[name="type"]').value;
        const genere = form.querySelector('[name="genere"]').value;
        
        // Validate required fields
        if (!title || !videoUrl || !type || !genere) {
            throw new Error('Por favor completa todos los campos requeridos');
        }

        // Create video data object
        const videoData = {
            title,
            originalTitle: originalTitle || null,
            videoUrl: videoUrl,
            type,
            genere,
            uploadDate: getCurrentFormattedDate(),
            normalizedTitle: normalizeText(title)
        };
        
        // Upload to Firestore
        const docRef = await addDoc(collection(db, "videos"), videoData);
        
        // Show success message
        showMessage('¡Video subido exitosamente!');
        
        // Clear form
        form.reset();
        
        // Redirect to main page after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error("Error al subir el video:", error);
        showMessage(error.message, true);
    } finally {
        // Re-enable button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Subir video';
        }
    }
}

// Add form submit event listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', uploadVideo);
    }
});

// Handle unhandled rejections
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled error:', event.reason);
    showMessage('Ocurrió un error inesperado. Por favor, intenta de nuevo.', true);
});