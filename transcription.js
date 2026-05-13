// State variables - minimal DOM references
let startBtn, cancelBtn, createChaptersBtn, statusDisplay;
let progressBar, progressFill, modelLoader, modelProgress;
let transcriptionResults;

// Initialize the transcription UI
function initTranscription() {
    // Initialize DOM references
    startBtn = document.getElementById('startTranscribeBtn');
    cancelBtn = document.getElementById('cancelTranscribeBtn');
    createChaptersBtn = document.getElementById('createChaptersBtn');
    statusDisplay = document.getElementById('statusDisplay');
    progressBar = document.getElementById('progressBar');
    progressFill = document.getElementById('progressFill');
    modelLoader = document.getElementById('modelLoader');
    modelProgress = document.getElementById('modelProgress');
    transcriptionResults = document.getElementById('transcriptionResults');
    
    // Update the UI to show that transcription is not available
    document.getElementById('libraryErrorMessage').style.display = 'block';
    document.getElementById('libraryErrorMessage').innerHTML = `
        <strong>Transcription Unavailable:</strong> The automatic transcription feature is currently unavailable 
        due to compatibility issues with the Whisper.js library.
        <br><br>
        <strong>Alternatives:</strong>
        <ul>
            <li>Use a third-party transcription service like <a href="https://www.rev.com" target="_blank">Rev</a>, <a href="https://otter.ai" target="_blank">Otter.ai</a>, or <a href="https://www.happyscribe.com" target="_blank">Happy Scribe</a></li>
            <li>Use YouTube's automatic captioning feature (upload to YouTube, get captions, then import here)</li>
            <li>Manually create chapters by clicking the "Add New Chapter" button at key points in the video</li>
            <li>Use the "Import Chapter List" feature to add pre-formatted chapter timestamps</li>
        </ul>
        <br>
        <em>We apologize for the inconvenience. The browser-based Whisper.js implementation is experimental and depends on third-party services that have changed.</em>
    `;
    
    statusDisplay.textContent = "Transcription feature is currently unavailable";
    
    // Disable start button
    startBtn.disabled = true;
    startBtn.title = "Transcription feature is currently unavailable";
    
    // Add event listeners
    cancelBtn.addEventListener('click', closeTranscriptionModal);
    createChaptersBtn.addEventListener('click', closeTranscriptionModal);
}

// Start the transcription process with the current video - show unsupported message
function startTranscriptionProcess(videoUrl) {
    console.log("Transcription requested but feature is unavailable");
    document.getElementById('libraryErrorMessage').style.display = 'block';
    statusDisplay.textContent = "Transcription feature is currently unavailable";
}

// Format timestamp to HH:MM:SS - utility function still needed for other features
function formatTimestamp(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Global function to seek to timestamp - still needed for UI
function seekToTimestamp(seconds) {
    const video = document.getElementById('mainVideo');
    if (video) {
        video.currentTime = seconds;
        if (video.paused) {
            video.play().catch(error => {
                console.error("Error playing video:", error);
            });
        }
    }
}

// Utility function to close the modal
function closeTranscriptionModal() {
    const modal = document.getElementById('transcriptionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Expose functions to the global scope
window.initTranscription = initTranscription;
window.startTranscriptionProcess = startTranscriptionProcess;
window.seekToTimestamp = seekToTimestamp; 