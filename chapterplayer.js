class ChapterPlayer {
    constructor(containerId, jsonData) {
        this.container = document.getElementById(containerId);
        this.jsonData = jsonData; // The JSON data for video URL, chapters, etc.
        
        // Get the base URL for resource loading (passed from embed.js)
        this.baseUrl = jsonData && jsonData.baseUrl ? jsonData.baseUrl : this._getBaseUrl();
        
        // Configuration options
        this.useExternalCss = jsonData && jsonData.hasOwnProperty('useExternalCss') ? jsonData.useExternalCss : false;

        // Shadow DOM is on by default. Set { shadowDom: false } in config to render
        // in light DOM so host-page CSS can target internal elements directly.
        this.useShadowDom = !(jsonData && jsonData.shadowDom === false);

        // Threshold for compact mode (default 700px)
        this.compactModeThreshold = jsonData && jsonData.compactModeThreshold ? jsonData.compactModeThreshold : 700;
        
        // Check if this is a mobile device using touch capability as a proxy
        this.isMobileDevice = ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0) || 
                             (navigator.msMaxTouchPoints > 0);
        
        // Core Player Elements - these will be queried from the rendered HTML
        this.video = null;
        this.videoWrapper = null; 
        this.chapterListDiv = null;
        this.chapterListTitleElement = null;

        // Controls and UI Elements
        this.bigPlayButtonOverlay = null;
        this.bigPlayPauseBtn = null;
        this.timelineContainer = null;
        this.timelinePreviewContainer = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.previewChapterTitle = null;
        this.previewTimeNoPreview = null;
        this.seekBarWrapper = null;
        this.seekBarCustom = null;
        this.seekBarTooltip = null; // This element will be part of getPlayerHTML
        this.videoControlsCustom = null;
        this.playPauseBtnCustom = null;
        this.nextChapterBtnCustom = null;
        this.currentChapterTitleDisplay = null;
        this.timeDisplayCustom = null;
        this.speedBtnCustom = null;
        this.speedMenuCustom = null;
        this.muteBtnCustom = null;
        this.volumeBarCustom = null;
        this.pipBtnCustom = null;
        this.fullscreenBtnCustom = null;

        // State
        this.chapters = [];
        this.currentVideoSrc = "";
        this.currentPosterUrl = ""; // Add posterUrl state variable
        this.currentChapterListTitle = "Chapters 📖";
        this.hideChapterListTitle = false;
        this.isSeeking = false;
        this.isPreviewEnabled = true; // Default, builder can control this
        this.currentPreviewTime = 0;
        this.isPreviewVisible = false;
        this.previewUpdateTimeout = null;
        this.previewVideoElement = null; // For generating preview frames
        
        // For responsive layout
        this.resizeObserver = null;

        if (!this.container) {
            console.error(`ChapterPlayer: Container with ID "${containerId}" not found.`);
            return;
        }

        // Render the basic HTML structure of the player
        this._renderPlayerDOM();
        // Find and assign the DOM elements within the rendered structure
        this._initializeDOMElements();
        
        // Add mobile class if on mobile device
        if (this.isMobileDevice && this.playerWrapper) {
            this.playerWrapper.classList.add('mobile-device');
            
            // Add touch event listeners to prevent hover issues on mobile
            if (this.chapterListDiv) {
                // Store item being touched to handle it properly
                let touchedItem = null;
                
                this.chapterListDiv.addEventListener('touchstart', function(e) {
                    // Don't set touch state on the list, only track the specific item
                    const item = e.target.closest('.chapter-item');
                    if (item) {
                        touchedItem = item;
                        item.classList.add('touch-active');
                    }
                }, { passive: true });
                
                this.chapterListDiv.addEventListener('touchend', function(e) {
                    // Clear the touch state immediately
                    if (touchedItem) {
                        touchedItem.classList.remove('touch-active');
                        touchedItem = null;
                    }
                }, { passive: true });
                
                // Also clear on touch cancel
                this.chapterListDiv.addEventListener('touchcancel', function() {
                    if (touchedItem) {
                        touchedItem.classList.remove('touch-active');
                        touchedItem = null;
                    }
                }, { passive: true });
                
                // Clear any stuck states when scrolling
                this.chapterListDiv.addEventListener('scroll', function() {
                    if (touchedItem) {
                        touchedItem.classList.remove('touch-active');
                        touchedItem = null;
                    }
                    // Also clear any focus that may be stuck
                    document.activeElement.blur();
                }, { passive: true });
            }
        }
        
        // Add document-wide touch handling for mobile
        if (this.isMobileDevice) {
            // Clear touch states when touching elsewhere on the page
            document.addEventListener('touchstart', function(e) {
                // Find all elements with touch-active and remove the class
                const activeElements = document.querySelectorAll('.touch-active');
                activeElements.forEach(el => el.classList.remove('touch-active'));
                
                // Clear any stuck focus
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
            }, { passive: true });
        }
        
        // Initialize with data if provided
        if (this.jsonData) {
            this.init(this.jsonData);
        } else {
            // Setup a default placeholder state if no JSON is immediately available
            this._setupInitialPlayerState();
        }
        
        // Set up responsive layout
        this._setupResponsiveLayout();
    }

    // Helper method to determine base URL if not provided
    _getBaseUrl() {
        // Try to find the script URL
        let scripts = document.getElementsByTagName('script');
        let scriptUrl = '';
        
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.includes('chapterplayer.js')) {
                scriptUrl = scripts[i].src;
                break;
            }
        }
        
        if (scriptUrl) {
            return scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
        }
        
        // Fallback to current page path
        return window.location.origin + window.location.pathname.substring(0, 
            window.location.pathname.lastIndexOf('/') + 1);
    }

    _getPlayerHTML() {
        // This HTML is extracted from the .player-container div in the original index.html
        // Note: IDs will be used by _initializeDOMElements to get references.
        // Class names are for styling via chapterplayer.css
        return `
            <div class="video-wrapper">
                <video id="cp-mainVideo" width="640" height="360">
                    <source src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div id="cp-bigPlayButtonOverlay" class="big-play-button-overlay">
                    <button id="cp-bigPlayPauseBtn" title="Play/Pause">
                        <svg class="icon icon-play active" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                        <svg class="icon icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                        <svg class="icon icon-replay" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path></svg>
                    </button>
                </div>

                <div id="cp-timelineContainer" class="timeline-container">
                    <div id="cp-timelinePreviewContainer" class="timeline-preview-container">
                        <div class="preview-wrapper">
                            <canvas id="cp-previewCanvas"></canvas>
                        </div>
                        <div id="cp-previewChapterTitle" class="preview-chapter-title"></div>
                        <div id="cp-previewTimeNoPreview" class="preview-time-no-preview"></div>
                    </div>
                    <div id="cp-seekBarWrapper" class="seek-bar-wrapper">
                        <input type="range" id="cp-seekBarCustom" value="0" min="0" step="0.1">
                    </div>
                </div>

                <div id="cp-videoControlsCustom" class="video-controls-custom">
                    <button id="cp-playPauseBtnCustom" title="Play/Pause">
                        <svg class="icon icon-play active" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                        <svg class="icon icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                        <svg class="icon icon-replay" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path></svg>
                    </button>
                    <button id="cp-nextChapterBtnCustom" title="Next Chapter">
                        <svg class="icon icon-next active" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>
                    </button>
                    <div id="cp-currentChapterTitleDisplay" title="Current Chapter"></div>
                    <div id="cp-timeDisplayCustom" class="time-display">00:00 / 00:00</div>

                    <div class="right-controls">
                        <button id="cp-speedBtnCustom" class="playback-speed-button" title="Playback Speed">1x</button>
                        <div id="cp-speedMenuCustom" class="speed-menu">
                            <button data-speed="0.5">0.5x</button>
                            <button data-speed="0.75">0.75x</button>
                            <button data-speed="1" class="active-speed">1x (Normal)</button>
                            <button data-speed="1.25">1.25x</button>
                            <button data-speed="1.5">1.5x</button>
                            <button data-speed="2">2x</button>
                        </div>
                        <div class="volume-controls">
                            <button id="cp-muteBtnCustom" title="Mute/Unmute">
                                <svg class="icon icon-volume-high active" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                                <svg class="icon icon-volume-muted" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L7 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"></path></svg>
                            </button>
                            <input type="range" id="cp-volumeBarCustom" class="volume-bar" min="0" max="1" step="0.05" value="1">
                        </div>
                        <button id="cp-pipBtnCustom" title="Picture-in-Picture">
                            <svg class="icon icon-pip active" viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"></path></svg>
                        </button>
                        <button id="cp-fullscreenBtnCustom" title="Fullscreen">
                            <svg class="icon icon-fullscreen active" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>
                            <svg class="icon icon-fullscreen-exit" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div id="cp-chapterList" class="chapter-list">
                <h2 id="cp-chapterListTitle">Chapters 📖</h2>
                <p>Load a video and add chapters to see them here.</p>
            </div>
        `;
    }

    _renderPlayerDOM() {
        if (!this.container) return;

        // Add the scoping class to the container itself
        this.container.classList.add('chapter-player-instance');

        const cssUrl = this.baseUrl + 'chapterplayer.css';

        if (this.useShadowDom) {
            // Create a shadow root for style encapsulation
            this.shadowRoot = this.container.attachShadow({ mode: 'open' });

            if (this.useExternalCss) {
                const linkEl = document.createElement('link');
                linkEl.rel = 'stylesheet';
                linkEl.href = cssUrl;
                this.shadowRoot.appendChild(linkEl);
            } else {
                // Original fetch method for production use
                const styleElement = document.createElement('style');

                fetch(cssUrl)
                    .then(response => response.text())
                    .then(cssText => {
                        styleElement.textContent = cssText;
                    })
                    .catch(error => {
                        console.error(`Failed to load CSS from ${cssUrl}:`, error);
                        // Fallback: try to use the style from the document if it exists
                        const existingStyle = document.querySelector(`link[href="${cssUrl}"]`);
                        if (existingStyle) {
                            styleElement.textContent = '/* Using document styles */';
                            this.shadowRoot.appendChild(styleElement);
                            const linkEl = document.createElement('link');
                            linkEl.rel = 'stylesheet';
                            linkEl.href = cssUrl;
                            this.shadowRoot.appendChild(linkEl);
                        }
                    });

                this.shadowRoot.appendChild(styleElement);
            }

            // Add the player HTML directly, not wrapped in another div
            const playerWrapperDiv = document.createElement('div');
            playerWrapperDiv.className = 'chapter-player-instance';
            playerWrapperDiv.innerHTML = this._getPlayerHTML();
            this.shadowRoot.appendChild(playerWrapperDiv);

            this.playerWrapper = playerWrapperDiv;
            this.root = this.shadowRoot;
        } else {
            // Light-DOM mode: inject styles into <head> once (shared across all
            // light-DOM player instances on the page), then append the player
            // markup directly into this.container so host-page CSS can target it.
            this.shadowRoot = null;
            const styleId = 'vcp-styles';
            if (!document.getElementById(styleId)) {
                if (this.useExternalCss) {
                    const linkEl = document.createElement('link');
                    linkEl.id = styleId;
                    linkEl.rel = 'stylesheet';
                    linkEl.href = cssUrl;
                    document.head.appendChild(linkEl);
                } else {
                    const styleElement = document.createElement('style');
                    styleElement.id = styleId;
                    document.head.appendChild(styleElement);
                    fetch(cssUrl)
                        .then(response => response.text())
                        .then(cssText => { styleElement.textContent = cssText; })
                        .catch(error => {
                            console.error(`Failed to load CSS from ${cssUrl}:`, error);
                            styleElement.remove();
                            const linkEl = document.createElement('link');
                            linkEl.id = styleId;
                            linkEl.rel = 'stylesheet';
                            linkEl.href = cssUrl;
                            document.head.appendChild(linkEl);
                        });
                }
            }

            // Clear container and append player markup directly into it.
            this.container.innerHTML = '';
            this.container.innerHTML = this._getPlayerHTML();
            // The container itself already has the .chapter-player-instance class,
            // so it doubles as the player wrapper for things like .mobile-device,
            // .compact-mode, fullscreen, etc.
            this.playerWrapper = this.container;
            this.root = this.container;
        }
    }

    _initializeDOMElements() {
        // In shadow-DOM mode, root is the shadowRoot; in light-DOM mode, the container.
        const root = this.root;
        if (!root) {
            console.error("ChapterPlayer: Root not initialized.");
            return;
        }
        
        // Query within the shadow root using the 'cp-' prefixed IDs
        this.videoWrapper = root.querySelector('.video-wrapper');
        this.video = root.querySelector('#cp-mainVideo');
        this.chapterListDiv = root.querySelector('#cp-chapterList');
        this.chapterListTitleElement = root.querySelector('#cp-chapterListTitle');

        this.bigPlayButtonOverlay = root.querySelector('#cp-bigPlayButtonOverlay');
        this.bigPlayPauseBtn = root.querySelector('#cp-bigPlayPauseBtn');
        this.timelineContainer = root.querySelector('#cp-timelineContainer');
        this.timelinePreviewContainer = root.querySelector('#cp-timelinePreviewContainer');
        this.previewCanvas = root.querySelector('#cp-previewCanvas');
        if (this.previewCanvas) {
            this.previewCtx = this.previewCanvas.getContext('2d');
            // Set canvas size for HiDPI rendering (as in original script)
            this.previewCanvas.width = 320; 
            this.previewCanvas.height = 180;
        }
        this.previewChapterTitle = root.querySelector('#cp-previewChapterTitle');
        this.previewTimeNoPreview = root.querySelector('#cp-previewTimeNoPreview');
        this.seekBarWrapper = root.querySelector('#cp-seekBarWrapper');
        this.seekBarCustom = root.querySelector('#cp-seekBarCustom');
        
        this.videoControlsCustom = root.querySelector('#cp-videoControlsCustom');
        this.playPauseBtnCustom = root.querySelector('#cp-playPauseBtnCustom');
        this.nextChapterBtnCustom = root.querySelector('#cp-nextChapterBtnCustom');
        this.currentChapterTitleDisplay = root.querySelector('#cp-currentChapterTitleDisplay');
        this.timeDisplayCustom = root.querySelector('#cp-timeDisplayCustom');
        this.speedBtnCustom = root.querySelector('#cp-speedBtnCustom');
        this.speedMenuCustom = root.querySelector('#cp-speedMenuCustom');
        this.muteBtnCustom = root.querySelector('#cp-muteBtnCustom');
        this.volumeBarCustom = root.querySelector('#cp-volumeBarCustom');
        this.pipBtnCustom = root.querySelector('#cp-pipBtnCustom');
        this.fullscreenBtnCustom = root.querySelector('#cp-fullscreenBtnCustom');
    }

    // --- Utility Methods (copied and adapted from script.js, prefixed with _ to indicate internal use) ---
    _timeToSeconds(timeStr) {
        if (!isNaN(parseFloat(timeStr)) && isFinite(timeStr)) return parseFloat(timeStr);
        const parts = String(timeStr).split(':').map(Number);
        if (parts.some(isNaN)) return NaN;
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else if (parts.length === 1) seconds = parts[0];
        else return NaN;
        return seconds;
    }

    _secondsToTime(totalSeconds, showHoursForce = false) {
        if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
        totalSeconds = Math.floor(totalSeconds);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        if (h > 0 || showHoursForce) return `${hh}:${mm}:${ss}`;
        return `${mm}:${ss}`;
    }

    _setActiveIcon(button, activeIconClass) {
        if (!button) return;
        button.querySelectorAll('.icon').forEach(icon => {
            icon.classList.toggle('active', icon.classList.contains(activeIconClass));
        });
    }
    
    _showAlert(message) {
        console.warn(`ChapterPlayer Alert: ${message}`);
        // The builder can pass a callback for alerts if needed:
        // if (this.config && this.config.showAlertCallback) this.config.showAlertCallback(message);
    }

    // --- Core Player Logic (methods to be filled by porting from script.js) ---

    init(jsonData) {
        if (!jsonData) {
            console.error("ChapterPlayer: No JSON data provided for initialization.");
            this._setupInitialPlayerState(); // Setup with defaults if no data
            return;
        }
        this.jsonData = jsonData;
        
        // Ensure baseUrl is set
        if (jsonData.baseUrl) {
            this.baseUrl = jsonData.baseUrl;
        }
        
        // Update configuration options if provided
        if (jsonData.hasOwnProperty('useExternalCss')) {
            this.useExternalCss = !!jsonData.useExternalCss;
        }
        
        // Handle video URL - ensure it's absolute
        this.currentVideoSrc = this.jsonData.videoUrl || "";
        if (this.currentVideoSrc && !this.currentVideoSrc.startsWith('http://') && 
            !this.currentVideoSrc.startsWith('https://') && !this.currentVideoSrc.startsWith('//')) {
            // If relative URL, make it absolute using baseUrl
            this.currentVideoSrc = this.baseUrl + this.currentVideoSrc;
        }
        
        // Handle poster URL - ensure it's absolute
        this.currentPosterUrl = this.jsonData.posterUrl || "";
        if (this.currentPosterUrl && !this.currentPosterUrl.startsWith('http://') && 
            !this.currentPosterUrl.startsWith('https://') && !this.currentPosterUrl.startsWith('//')) {
            // If relative URL, make it absolute using baseUrl
            this.currentPosterUrl = this.baseUrl + this.currentPosterUrl;
        }
        
        this.chapters = (this.jsonData.chapters || []).map((ch, index) => ({
            ...ch,
            id: ch.id || `cp-ch-${Date.now()}-${index}` // Ensure unique IDs scoped to player
        }));
        this.currentChapterListTitle = this.jsonData.chapterListTitle || "Chapters 📖";
        this.hideChapterListTitle = !!this.jsonData.hideChapterListTitle;
        this.isPreviewEnabled = this.jsonData.hasOwnProperty('isPreviewEnabled') ? this.jsonData.isPreviewEnabled : true;


        if (this.video) {
            if (this.currentVideoSrc) {
                this.video.src = this.currentVideoSrc;
                
                // Set poster image if available
                if (this.currentPosterUrl) {
                    this.video.setAttribute('poster', this.currentPosterUrl);
                } else {
                    this.video.removeAttribute('poster');
                }
                
                this.video.load(); // Important to load the new source
            } else {
                console.warn("ChapterPlayer: No video URL provided in JSON data.");
                this._clearPlayerState(); // Clear previous video state
            }
        }
        
        this._setupInitialPlayerState(); // Reset UI elements
        this._renderChapterListInternal();
        this._renderTimelineSegments(); // Initial render, might be empty if duration unknown
        this._attachAllEventListeners(); // Ensure all event listeners are active
    }
    
    _clearPlayerState() {
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src'); // Remove src attribute
            this.video.removeAttribute('poster'); // Also remove poster when clearing state
            this.video.load(); // This should stop current video and reset state
        }
        this.chapters = [];
        this.currentVideoSrc = "";
        this.currentPosterUrl = ""; // Clear poster URL state
        // Reset UI elements
        if (this.timeDisplayCustom) this.timeDisplayCustom.textContent = "00:00 / 00:00";
        if (this.seekBarCustom) {
            this.seekBarCustom.value = 0;
            this.seekBarCustom.max = 0;
        }
        if (this.currentChapterTitleDisplay) this.currentChapterTitleDisplay.textContent = "";
        this._setActiveIcon(this.playPauseBtnCustom, 'icon-play');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-play');
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.classList.remove('hidden');
         this._renderChapterListInternal(); // Show "No chapters" or "Video not loaded"
         this._renderTimelineSegments(); // Clear timeline segments
    }


    _setupInitialPlayerState() {
        // Set default states for UI elements, called on init and when video source changes
        if (this.timeDisplayCustom) this.timeDisplayCustom.textContent = "00:00 / 00:00";
        if (this.seekBarCustom) {
            this.seekBarCustom.value = 0;
            this.seekBarCustom.max = 0; // Will be updated on loadedmetadata
        }
        if (this.currentChapterTitleDisplay) this.currentChapterTitleDisplay.textContent = "";

        this._setActiveIcon(this.playPauseBtnCustom, 'icon-play');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-play');
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.classList.remove('hidden');
        
        if (this.video) {
             this._setActiveIcon(this.muteBtnCustom, this.video.muted || this.video.volume === 0 ? 'icon-volume-muted' : 'icon-volume-high');
             if(this.volumeBarCustom) this.volumeBarCustom.value = this.video.muted ? 0 : this.video.volume;
        }
        this._setActiveIcon(this.fullscreenBtnCustom, 'icon-fullscreen');
        if (this.speedBtnCustom) this.speedBtnCustom.textContent = "1x";
        if (this.speedMenuCustom) {
            this.speedMenuCustom.querySelectorAll('button').forEach(btn => btn.classList.remove('active-speed'));
            const defaultSpeedBtn = this.speedMenuCustom.querySelector('button[data-speed="1"]');
            if (defaultSpeedBtn) defaultSpeedBtn.classList.add('active-speed');
        }
        if (this.chapterListTitleElement) {
            this.chapterListTitleElement.textContent = this.currentChapterListTitle;
            this.chapterListTitleElement.style.display = this.hideChapterListTitle ? 'none' : '';
        }
        if (this.timelineContainer) this.timelineContainer.classList.add('bottom-position'); // Start with controls hidden
        if (this.videoControlsCustom) this.videoControlsCustom.classList.remove('visible');
    }
    
    // --- Event Handler Attachments ---
    _attachAllEventListeners() {
        if (!this.video) {
            console.error("ChapterPlayer: Video element not found, cannot attach event listeners.");
            return;
        }

        // Remove any existing listeners to prevent duplicates if re-initializing
        this._removeAllEventListeners(); // Implement this helper

        // Video Element Events
        this.video.addEventListener('loadedmetadata', this._handleLoadedMetadata.bind(this));
        this.video.addEventListener('timeupdate', this._handleTimeUpdate.bind(this));
        this.video.addEventListener('play', this._handlePlay.bind(this));
        this.video.addEventListener('pause', this._handlePause.bind(this));
        this.video.addEventListener('ended', this._handleEnded.bind(this));
        this.video.addEventListener('click', this._handleVideoClick.bind(this));

        // Player Controls Events
        if (this.playPauseBtnCustom) this.playPauseBtnCustom.addEventListener('click', this._togglePlayPause.bind(this));
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.addEventListener('click', this._togglePlayPause.bind(this));
        if (this.nextChapterBtnCustom) this.nextChapterBtnCustom.addEventListener('click', this._goToNextChapter.bind(this));
        
        // Seek Bar
        if (this.seekBarWrapper) {
            this.seekBarWrapper.addEventListener('click', this._handleSeekBarClick.bind(this));
            this.seekBarWrapper.addEventListener('mousemove', this._handleSeekBarMousemove.bind(this));
            this.seekBarWrapper.addEventListener('mouseout', this._handleSeekBarMouseout.bind(this));
        }
        if (this.seekBarCustom) {
            this.seekBarCustom.addEventListener('input', this._handleSeekBarInput.bind(this));
            this.seekBarCustom.addEventListener('mousedown', () => { this.isSeeking = true; });
            this.seekBarCustom.addEventListener('mouseup', () => { this.isSeeking = false; });
        }

        // Volume and Mute
        if (this.muteBtnCustom) this.muteBtnCustom.addEventListener('click', this._toggleMute.bind(this));
        if (this.volumeBarCustom) this.volumeBarCustom.addEventListener('input', this._handleVolumeChange.bind(this));

        // Speed Control
        if (this.speedBtnCustom && this.speedMenuCustom) {
            this.speedBtnCustom.addEventListener('click', this._toggleSpeedMenu.bind(this));
            this.speedMenuCustom.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', this._setPlaybackSpeed.bind(this));
            });
            // Document listener for closing speed menu - carefully manage this
            this._boundSpeedMenuDocumentClickListener = this._handleDocumentClickForSpeedMenu.bind(this);
            document.addEventListener('click', this._boundSpeedMenuDocumentClickListener);
        }

        // Picture-in-Picture
        if (this.pipBtnCustom && 'pictureInPictureEnabled' in document) {
            this.pipBtnCustom.addEventListener('click', this._togglePictureInPicture.bind(this));
        } else if (this.pipBtnCustom) {
            this.pipBtnCustom.style.display = 'none';
        }

        // Fullscreen
        if (this.fullscreenBtnCustom && this.playerWrapper) { // Fullscreen uses the full player wrapper
            this.fullscreenBtnCustom.addEventListener('click', this._toggleFullscreen.bind(this));
        }
         // Fullscreen change listener on document
        this._boundHandleFullscreenChange = this._handleFullscreenChange.bind(this);
        document.addEventListener('fullscreenchange', this._boundHandleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this._boundHandleFullscreenChange); // Safari
        document.addEventListener('msfullscreenchange', this._boundHandleFullscreenChange); // IE11


        // Controls visibility on hover (applies to the video wrapper only)
        if (this.videoControlsCustom && this.timelineContainer && this.videoWrapper) {
            this.videoWrapper.addEventListener('mouseenter', this._handlePlayerMouseEnter.bind(this));
            this.videoWrapper.addEventListener('mouseleave', this._handlePlayerMouseLeave.bind(this));
        }
    }
    
    _removeAllEventListeners() {
        // This is a simplified example. A more robust solution would store references to bound handlers.
        // For now, we'll rely on the fact that we're replacing innerHTML or re-querying elements often.
        // However, for document-level listeners, it's crucial.
        if (this._boundSpeedMenuDocumentClickListener) {
            document.removeEventListener('click', this._boundSpeedMenuDocumentClickListener);
        }
        if (this._boundHandleFullscreenChange) {
            document.removeEventListener('fullscreenchange', this._boundHandleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', this._boundHandleFullscreenChange);
            document.removeEventListener('msfullscreenchange', this._boundHandleFullscreenChange);
        }
        // For element-specific listeners, if elements are stable, store and remove.
        // If _renderPlayerDOM and _initializeDOMElements are called, old nodes are discarded.
    }

    // --- Event Handlers (copied and adapted from script.js) ---
    _handleLoadedMetadata() {
        if (!this.video || !this.seekBarCustom) return;
        const duration = this.video.duration;
        this.seekBarCustom.max = isNaN(duration) ? 0 : duration;
        this._updateTimeDisplay();
        this._renderChapterListInternal(); // Re-render with correct durations/showHours
        this._renderTimelineSegments();   // Re-render segments now that duration is known
        
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.classList.remove('hidden');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-play');
        this._setActiveIcon(this.playPauseBtnCustom, 'icon-play');
    }

    _handleTimeUpdate() {
        if (!this.video || this.isSeeking) return;
        if (this.seekBarCustom) this.seekBarCustom.value = this.video.currentTime;
        this._updateSegmentProgress();
        this._updateTimeDisplay();

        let currentChapter = null;
        for (let i = this.chapters.length - 1; i >= 0; i--) {
            // Add a small tolerance (0.1s) for chapter activation
            if (this.video.currentTime >= this.chapters[i].timestamp - 0.1) {
                currentChapter = this.chapters[i];
                break;
            }
        }
        if (this.currentChapterTitleDisplay) {
            this.currentChapterTitleDisplay.textContent = currentChapter ? currentChapter.title : "";
            this.currentChapterTitleDisplay.title = currentChapter ? currentChapter.title : ""; // For tooltip
        }
        this._setActiveChapterUI(this.video.currentTime);
    }

    _updateTimeDisplay() {
        if (!this.video || !this.timeDisplayCustom) return;
        const duration = this.video.duration;
        if (isNaN(duration)) {
            this.timeDisplayCustom.textContent = `${this._secondsToTime(this.video.currentTime)} / --:--`;
            return;
        }
        const showHours = duration >= 3600;
        this.timeDisplayCustom.textContent = `${this._secondsToTime(this.video.currentTime, showHours)} / ${this._secondsToTime(duration, showHours)}`;
    }

    _handlePlay() {
        this._setActiveIcon(this.playPauseBtnCustom, 'icon-pause');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-pause');
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.classList.add('hidden');
    }

    _handlePause() {
        this._setActiveIcon(this.playPauseBtnCustom, 'icon-play');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-play');
        if (this.video && this.video.readyState >= 1 && !this.video.ended && this.bigPlayButtonOverlay) {
            this.bigPlayButtonOverlay.classList.remove('hidden');
        }
    }

    _handleEnded() {
        this._setActiveIcon(this.playPauseBtnCustom, 'icon-replay');
        this._setActiveIcon(this.bigPlayPauseBtn, 'icon-replay');
        if (this.bigPlayButtonOverlay) this.bigPlayButtonOverlay.classList.remove('hidden');
    }
    
    _handleVideoClick(e) {
        // Only toggle play/pause if big play button is hidden (i.e., controls are visible or video is playing)
        if (e.target === this.video && this.bigPlayButtonOverlay && this.bigPlayButtonOverlay.classList.contains('hidden')) {
             this._togglePlayPause();
        }
    }

    _togglePlayPause() {
        if (!this.video || this.video.readyState < 1) {
            this._showAlert("Load a video first."); // Player-specific alert
            return;
        }
        if (this.video.paused || this.video.ended) {
            this.video.play().catch(e => {
                console.error("ChapterPlayer play error:", e);
                this._showAlert("Could not play: " + e.message);
            });
        } else {
            this.video.pause();
        }
    }
    
    _goToNextChapter() {
        if (!this.video || this.video.readyState < 1 || this.chapters.length === 0) return;
        const currentTime = this.video.currentTime;
        let nextChapterTimestamp = -1;
        // Find the first chapter whose timestamp is greater than current time (with a small buffer)
        for (let i = 0; i < this.chapters.length; i++) {
            if (this.chapters[i].timestamp > currentTime + 0.1) {
                nextChapterTimestamp = this.chapters[i].timestamp;
                break;
            }
        }
        if (nextChapterTimestamp !== -1) {
            this.video.currentTime = nextChapterTimestamp;
            if (this.video.paused) this.video.play().catch(e => console.error("Play error on next chapter:", e));
        } else {
            console.log("Already at or past the last chapter."); // Or handle as loop, etc.
        }
    }

    _handleSeekBarClick(e) {
        if (!this.video || this.video.readyState < 1 || isNaN(this.video.duration) || !this.seekBarWrapper) return;

        // If click is on a segment or its progress bar, let segment's own handler deal with it.
        if (e.target.closest('.timeline-chapter-segment')) {
            return; 
        }
        
        const rect = this.seekBarWrapper.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercent = Math.max(0, Math.min(1, clickX / rect.width)); // Ensure between 0 and 1
        this.video.currentTime = clickPercent * this.video.duration;
        
        this._updateSegmentProgress(); // Immediate UI update
        this._updateTimeDisplay();     // Immediate UI update
        if (this.video.paused) this.video.play().catch(err => console.error(err));
    }

    _handleSeekBarInput(e) {
        if (!this.video || this.video.readyState < 1 || isNaN(this.video.duration)) return;
        this.video.currentTime = parseFloat(e.target.value);
        // No need to call updateSegmentProgress here if isSeeking is true, timeupdate will handle it
        // However, for direct manipulation, it's good to update related UI.
        if (!this.isSeeking) {
            this._updateSegmentProgress();
        }
        this._updateTimeDisplay();
    }
    
    _handlePlayerMouseEnter() {
        if (this.videoControlsCustom) this.videoControlsCustom.classList.add('visible');
        if (this.timelineContainer) this.timelineContainer.classList.remove('bottom-position');
    }

    _handlePlayerMouseLeave() {
         if (this.videoControlsCustom) this.videoControlsCustom.classList.remove('visible');
         if (this.timelineContainer) this.timelineContainer.classList.add('bottom-position');
    }


    _handleSeekBarMousemove(e) {
        if (!this.seekBarWrapper || !this.video || this.video.readyState < 1 || isNaN(this.video.duration)) return;
        const rect = this.seekBarWrapper.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        let hoverPercent = (hoverX / rect.width) * 100;
        hoverPercent = Math.max(0, Math.min(100, hoverPercent)); // Clamp between 0 and 100

        this._showTimelinePreview(e, hoverPercent);

        // Tooltip for general seek bar area if not over a specific segment
        const isOverSegment = e.target.closest('.timeline-chapter-segment');
        if (!isOverSegment && this.seekBarTooltip) {
            const hoverTime = (hoverPercent / 100) * this.video.duration;
            this.seekBarTooltip.innerHTML = `<span class="tooltip-title">Seek</span><span class="tooltip-time">${this._secondsToTime(hoverTime, this.video.duration >= 3600)}</span>`;
            this._positionTooltip(hoverPercent); // General positioning for the main tooltip
            this.seekBarTooltip.style.display = 'block';
        } else if (this.seekBarTooltip && !isOverSegment) { // Hide if moved off general area and not on segment
             this.seekBarTooltip.style.display = 'none';
        }
    }

    _handleSeekBarMouseout(e) {
        if (!this.seekBarWrapper) return;
        // Check if the mouse is still within the seekbar wrapper or related elements
        if (e.relatedTarget && (this.seekBarWrapper.contains(e.relatedTarget) || this.seekBarWrapper === e.relatedTarget || (this.timelinePreviewContainer && this.timelinePreviewContainer.contains(e.relatedTarget)) )) {
            return;
        }
        this._hideTimelinePreview();
        if (this.seekBarTooltip) this.seekBarTooltip.style.display = 'none';
        this.seekBarWrapper.querySelectorAll('.timeline-chapter-segment.hovered').forEach(seg => {
            seg.classList.remove('hovered');
        });
    }
    
    _toggleMute() {
        if (!this.video || this.video.readyState < 1) return;
        this.video.muted = !this.video.muted;
        this._setActiveIcon(this.muteBtnCustom, this.video.muted || this.video.volume === 0 ? 'icon-volume-muted' : 'icon-volume-high');
        if (this.volumeBarCustom) this.volumeBarCustom.value = this.video.muted ? 0 : this.video.volume;
    }

    _handleVolumeChange() {
        if (!this.video || this.video.readyState < 1 || !this.volumeBarCustom) return;
        this.video.volume = parseFloat(this.volumeBarCustom.value);
        this.video.muted = this.video.volume === 0;
        this._setActiveIcon(this.muteBtnCustom, this.video.muted || this.video.volume === 0 ? 'icon-volume-muted' : 'icon-volume-high');
    }

    _toggleSpeedMenu(e) {
        if (!this.speedMenuCustom) return;
        e.stopPropagation(); // Prevent document click from immediately closing it
        this.speedMenuCustom.style.display = this.speedMenuCustom.style.display === 'block' ? 'none' : 'block';
    }
    
    _handleDocumentClickForSpeedMenu(e) {
        if (this.speedMenuCustom && this.speedMenuCustom.style.display === 'block' &&
            this.speedBtnCustom && !this.speedBtnCustom.contains(e.target) &&
            !this.speedMenuCustom.contains(e.target)) {
            this.speedMenuCustom.style.display = 'none';
        }
    }

    _setPlaybackSpeed(e) {
        if (!this.video || !this.speedBtnCustom || !this.speedMenuCustom) return;
        const speed = parseFloat(e.target.dataset.speed);
        this.video.playbackRate = speed;
        this.speedBtnCustom.textContent = `${speed}x`;
        this.speedMenuCustom.querySelectorAll('button').forEach(btn => btn.classList.remove('active-speed'));
        e.target.classList.add('active-speed');
        this.speedMenuCustom.style.display = 'none';
    }

    async _togglePictureInPicture() {
        if (!this.video || this.video.readyState < 1) {
            this._showAlert("Load a video first for Picture-in-Picture.");
            return;
        }
        try {
            if (document.pictureInPictureElement === this.video) { // Check if *this* video is in PiP
                await document.exitPictureInPicture();
            } else {
                await this.video.requestPictureInPicture();
            }
        } catch (error) {
            console.error("PiP Error:", error);
            this._showAlert("Picture-in-Picture not supported or an error occurred.");
        }
    }
    
    _toggleFullscreen() {
        if (!this.video || this.video.readyState < 1 || !this.playerWrapper) { // Use playerWrapper which includes both video and chapter list
            this._showAlert("Load a video first to go fullscreen.");
            return;
        }
        
        const elementForFullscreen = this.playerWrapper; // The full player wrapper element with video and chapter list

        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && // Safari
            !document.msFullscreenElement) {     // IE11
            if (elementForFullscreen.requestFullscreen) {
                elementForFullscreen.requestFullscreen();
            } else if (elementForFullscreen.webkitRequestFullscreen) { /* Safari */
                elementForFullscreen.webkitRequestFullscreen();
            } else if (elementForFullscreen.msRequestFullscreen) { /* IE11 */
                elementForFullscreen.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    }

    _handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        // Check if the current fullscreen element is our video wrapper
        const isOurPlayerFullscreen = isFullscreen && (document.fullscreenElement === this.playerWrapper || document.webkitFullscreenElement === this.playerWrapper || document.msFullscreenElement === this.playerWrapper);
        
        // Update fullscreen button icon
        this._setActiveIcon(this.fullscreenBtnCustom, isOurPlayerFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen');
        
        // Apply compact mode in fullscreen for consistent layout, but not on mobile
        if (isOurPlayerFullscreen && this.playerWrapper && !this.isMobileDevice) {
            this.playerWrapper.classList.add('compact-mode');
            // Store previous state to restore when exiting fullscreen
            this.playerWrapper.dataset.wasCompactBeforeFullscreen = this.playerWrapper.classList.contains('compact-mode') ? 'true' : 'false';
        } else if (this.playerWrapper && !this.isMobileDevice) {
            // Check if player was compact before fullscreen
            const wasCompactBefore = this.playerWrapper.dataset.wasCompactBeforeFullscreen === 'true';
            // If it wasn't in compact mode before fullscreen, remove the class
            if (!wasCompactBefore) {
                this.playerWrapper.classList.remove('compact-mode');
            }
            // Handle based on container width as normal
            this._handleContainerResize(this.container ? this.container.offsetWidth : 0);
        }
    }

    // --- Chapter List Rendering (Internal to player) ---
    _renderChapterListInternal() {
        if (!this.chapterListDiv || !this.chapterListTitleElement) return;

        this.chapterListTitleElement.textContent = this.currentChapterListTitle;
        
        // Clear existing chapter items but keep the title element itself
        const childrenToRemove = Array.from(this.chapterListDiv.children).filter(child => child !== this.chapterListTitleElement);
        childrenToRemove.forEach(child => child.remove());

        if (!this.currentVideoSrc || !this.video || this.video.readyState < 1) {
            const p = document.createElement('p');
            p.textContent = (this.currentVideoSrc && this.video.error) ? "Error loading video." : "Video not loaded.";
            this.chapterListDiv.appendChild(p);
            return;
        }
        if (this.chapters.length === 0) {
            const p = document.createElement('p');
            p.textContent = "No chapters added for this video.";
            this.chapterListDiv.appendChild(p);
            return;
        }
        const showHours = this.video.duration >= 3600;
        this.chapters.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.dataset.timestamp = ch.timestamp;
            // Ensure HTML safety if titles/descriptions can come from user input elsewhere
            const titleText = ch.title || "Untitled Chapter";
            const descriptionText = ch.description || "";
            item.innerHTML = `<strong>${titleText.replace(/</g, "&lt;")} (${this._secondsToTime(ch.timestamp, showHours)})</strong><p>${descriptionText.replace(/</g, "&lt;")}</p>`;
            
            item.addEventListener('click', () => {
                if (this.video) {
                    this.video.currentTime = ch.timestamp;
                    if (this.video.paused) this.video.play().catch(e => console.error("play err", e));
                }
                // No need to call _setActiveChapterUI here, timeupdate will handle it
            });
            this.chapterListDiv.appendChild(item);
        });
        this._setActiveChapterUI(this.video ? this.video.currentTime : 0);
    }

    _setActiveChapterUI(currentTime) {
        if (!this.chapterListDiv || !this.chapters || this.chapters.length === 0) return;
        let activeChapterTimestamp = null;
        let activeChapterIndex = -1;
        let nextChapterTimestamp = null;

        // Find the chapter that is currently active or was the last one passed
        for (let i = this.chapters.length - 1; i >= 0; i--) {
            if (this.chapters[i].timestamp <= currentTime + 0.5) { // Add a small tolerance
                activeChapterTimestamp = this.chapters[i].timestamp;
                activeChapterIndex = i;
                break;
            }
        }
        
        // Find the next chapter timestamp for progress calculation
        if (activeChapterIndex !== -1 && activeChapterIndex < this.chapters.length - 1) {
            nextChapterTimestamp = this.chapters[activeChapterIndex + 1].timestamp;
        } else if (activeChapterIndex !== -1) {
            // If it's the last chapter, use video duration
            nextChapterTimestamp = this.video ? this.video.duration : null;
        }
        
        this.chapterListDiv.querySelectorAll('.chapter-item').forEach(item => {
            const itemTs = parseFloat(item.dataset.timestamp);
            const isActive = itemTs === activeChapterTimestamp;
            if (isActive) {
                if (!item.classList.contains('active')) {
                    item.classList.add('active');
                    item.classList.remove('active-progressing');
                    // Reset opacity when chapter first becomes active
                    item.style.opacity = '0.5';
                    
                    // Scroll into view if not visible
                    const itemRect = item.getBoundingClientRect();
                    const listRect = this.chapterListDiv.getBoundingClientRect();
                    if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
                
                // Calculate progress through current chapter and update opacity
                if (this.playerWrapper && this.playerWrapper.classList.contains('compact-mode') && 
                    nextChapterTimestamp !== null && activeChapterTimestamp !== null) {
                    
                    const chapterStartTime = activeChapterTimestamp;
                    const chapterEndTime = nextChapterTimestamp;
                    const chapterDuration = chapterEndTime - chapterStartTime;
                    
                    if (chapterDuration > 0) {
                        const elapsedInChapter = currentTime - chapterStartTime;
                        const progressThroughChapter = elapsedInChapter / chapterDuration;
                        
                        // Calculate opacity: start at 0.5, end at 0.2
                        const startOpacity = 0.5;
                        const endOpacity = 0.2;
                        const currentOpacity = startOpacity - (progressThroughChapter * (startOpacity - endOpacity));
                        
                        // Apply the calculated opacity
                        item.style.opacity = Math.max(endOpacity, Math.min(startOpacity, currentOpacity)).toString();
                        
                        // Also add the active-progressing class when reaching 50% to handle different styling if needed
                        if (progressThroughChapter > 0.5 && !item.classList.contains('active-progressing')) {
                            item.classList.add('active-progressing');
                        }
                    }
                }
            } else {
                item.classList.remove('active', 'active-progressing');
                item.style.opacity = ''; // Reset to default opacity for non-active items
            }
        });
    }
    
    // --- Timeline Segment Rendering & Interaction ---
    _renderTimelineSegments() {
        if (!this.seekBarWrapper || !this.video || !this.seekBarCustom) return;

        // Clear existing segments and gaps, but keep the main seek bar and tooltip
        Array.from(this.seekBarWrapper.children).forEach(child => {
            if (child !== this.seekBarCustom && child !== this.seekBarTooltip) {
                this.seekBarWrapper.removeChild(child);
            }
        });

        const totalDuration = this.video.duration;

        if (!totalDuration || isNaN(totalDuration) || totalDuration === 0) {
            // Show a single bar if duration is not known or zero
            const segment = document.createElement('div');
            segment.className = 'timeline-chapter-segment';
            segment.style.flexGrow = '1'; // Fill the whole bar
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'segment-progress';
            segment.appendChild(progressIndicator);
            this.seekBarWrapper.insertBefore(segment, this.seekBarCustom);
            this._updateSegmentProgress(); // Update its progress (likely 0%)
            return;
        }

        if (this.chapters.length === 0) {
            // Single segment for the whole video if no chapters
            const segment = document.createElement('div');
            segment.className = 'timeline-chapter-segment';
            segment.style.flexGrow = '1';
            segment.dataset.startTime = "0";
            segment.dataset.endTime = String(totalDuration);
            segment.dataset.title = "Full Video"; // Or from jsonData if available
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'segment-progress';
            segment.appendChild(progressIndicator);
            this._addSegmentEventListeners(segment);
            this.seekBarWrapper.insertBefore(segment, this.seekBarCustom);
        } else {
            // Sorted chapters ensure segments are in correct order
            const sortedChapters = [...this.chapters].sort((a, b) => a.timestamp - b.timestamp);

            sortedChapters.forEach((chapter, index) => {
                const chapterStart = chapter.timestamp;
                // For the last chapter, segment extends to video end. Otherwise, to the next chapter's start.
                const chapterEnd = (index + 1 < sortedChapters.length) ? sortedChapters[index + 1].timestamp : totalDuration;
                
                const segmentDuration = chapterEnd - chapterStart;

                // Avoid creating zero or negative length segments unless it's the very last segment filling up space.
                if (segmentDuration <= 0 && chapterEnd < totalDuration) return;


                const segment = document.createElement('div');
                segment.className = 'timeline-chapter-segment';
                // Calculate width as a percentage of total duration
                const segmentWidthPercent = (segmentDuration / totalDuration) * 100;
                segment.style.flexBasis = `${segmentWidthPercent}%`;
                
                segment.dataset.startTime = String(chapterStart);
                segment.dataset.endTime = String(chapterEnd);
                segment.dataset.title = chapter.title;
                segment.dataset.timestamp = String(chapter.timestamp); // Original chapter start for tooltip

                const progressIndicator = document.createElement('div');
                progressIndicator.className = 'segment-progress';
                segment.appendChild(progressIndicator);

                this._addSegmentEventListeners(segment);
                this.seekBarWrapper.insertBefore(segment, this.seekBarCustom); // Insert before the range input

                // Add a gap if not the last segment and there's another chapter after this one
                if (index < sortedChapters.length - 1) {
                    const nextChapterStart = sortedChapters[index+1].timestamp;
                    // Only add a gap if there's actual space between this segment's end and next chapter's start
                    // This check is mostly for sanity, as flexbox will handle small overlaps.
                    if (nextChapterStart > chapterEnd) { 
                        const gap = document.createElement('div');
                        gap.className = 'timeline-gap-segment'; // Style this in CSS
                        this.seekBarWrapper.insertBefore(gap, this.seekBarCustom);
                    }
                }
            });
        }
        this._updateSegmentProgress(); // Update progress for all newly rendered segments
    }

    _addSegmentEventListeners(segment) {
        segment.addEventListener('mouseover', (e) => {
            segment.classList.add('hovered');
            this._updateTooltipForSegment(segment, e); // Show chapter-specific tooltip
            if(this.seekBarTooltip) this.seekBarTooltip.style.display = 'none'; // Hide general tooltip
        });
        segment.addEventListener('mousemove', (e) => {
            this._updateTooltipForSegment(segment, e);
        });
        segment.addEventListener('mouseout', (e) => {
            segment.classList.remove('hovered');
            if(this.seekBarTooltip) this.seekBarTooltip.style.display = 'none'; // Hide chapter tooltip
        });
        
        segment.addEventListener('click', (e) => {
            if (!this.video || this.video.readyState < 1 || isNaN(this.video.duration)) return;
            e.stopPropagation(); // Prevent seekbarWrapper's click handler
            
            const segmentRect = segment.getBoundingClientRect();
            const clickX = e.clientX - segmentRect.left;
            const segmentWidth = segmentRect.width;
            // clickPercent is relative to the start of the segment
            const clickPercentWithinSegment = Math.max(0, Math.min(1, clickX / segmentWidth));
            
            const startTime = parseFloat(segment.dataset.startTime);
            const endTime = parseFloat(segment.dataset.endTime); // Not strictly needed for this calc but good to have
            const segmentDuration = endTime - startTime;
            
            const seekTime = startTime + (clickPercentWithinSegment * segmentDuration);
            
            this.video.currentTime = Math.max(0, Math.min(this.video.duration, seekTime));
            this._updateSegmentProgress(); // Immediate UI update
            this._updateTimeDisplay();
            if (this.video.paused) this.video.play().catch(err => console.error(err));
        });
    }
    
    _updateTooltipForSegment(segment, e) {
        if (!this.seekBarWrapper || !this.seekBarTooltip || !this.video || !segment.dataset.title) return;
        
        const chapterTitle = segment.dataset.title;
        const chapterTime = parseFloat(segment.dataset.timestamp); // Use original timestamp for display
        
        this.seekBarTooltip.innerHTML = `<span class="tooltip-title">${chapterTitle.replace(/</g, "&lt;")}</span><span class="tooltip-time">${this._secondsToTime(chapterTime, this.video.duration >= 3600)}</span>`;
        
        // Position the tooltip based on the mouse position relative to the entire seek bar wrapper
        const wrapperRect = this.seekBarWrapper.getBoundingClientRect();
        const mouseX = e.clientX - wrapperRect.left;
        let hoverPercent = (mouseX / wrapperRect.width) * 100;
        hoverPercent = Math.max(0, Math.min(100, hoverPercent));
        
        this._positionTooltip(hoverPercent); // Use the general positioning logic
        this.seekBarTooltip.style.display = 'block';
    }

    _positionTooltip(hoverPercent) { // Used by both segment tooltips and general seek tooltip
        if (!this.seekBarTooltip || !this.seekBarWrapper) return;
        
        const tooltipWidth = this.seekBarTooltip.offsetWidth;
        const seekBarWidth = this.seekBarWrapper.offsetWidth;
        
        // Calculate left position to center the tooltip over the hover point, clamped to bounds
        let tooltipLeftPercent = hoverPercent - (tooltipWidth / 2 / seekBarWidth) * 100;
        tooltipLeftPercent = Math.max(0, tooltipLeftPercent); // Clamp left edge
        tooltipLeftPercent = Math.min(100 - (tooltipWidth / seekBarWidth) * 100, tooltipLeftPercent); // Clamp right edge
        
        this.seekBarTooltip.style.left = `${tooltipLeftPercent}%`;
    }


    _updateSegmentProgress() {
        if (!this.video || this.video.readyState < 1 || isNaN(this.video.duration) || this.video.duration === 0 || !this.seekBarWrapper) return;
        
        const currentTime = this.video.currentTime;
        const segments = this.seekBarWrapper.querySelectorAll('.timeline-chapter-segment');
        
        let activeSegmentFound = false;
        segments.forEach((segment) => {
            const startTime = parseFloat(segment.dataset.startTime);
            const endTime = parseFloat(segment.dataset.endTime);
            const progressIndicator = segment.querySelector('.segment-progress');
            if (!progressIndicator) return;

            let progressWidth = '0%';
            if (currentTime >= endTime) { // Segment is fully passed
                progressWidth = '100%';
                segment.classList.remove('active');
            } else if (currentTime >= startTime && currentTime < endTime) { // Current segment
                const segmentDuration = endTime - startTime;
                const currentProgressInSegment = segmentDuration > 0 ? ((currentTime - startTime) / segmentDuration) * 100 : 0;
                progressWidth = `${Math.max(0, Math.min(100, currentProgressInSegment))}%`;
                segment.classList.add('active');
                activeSegmentFound = true;
            } else { // Segment is in the future or video hasn't reached it
                progressWidth = '0%';
                segment.classList.remove('active');
            }
            progressIndicator.style.width = progressWidth;
        });
         // If current time is before the first chapter, no segment is "active" in the traditional sense
        // but progress might still be shown in a "full video" segment if no chapters exist.
    }

    // --- Timeline Preview Logic ---
    _showTimelinePreview(e, hoverPercent) {
        if (!this.video || this.video.readyState < 1 || isNaN(this.video.duration) || 
            !this.timelinePreviewContainer || !this.previewTimeNoPreview || !this.previewChapterTitle || !this.seekBarWrapper) return;

        const hoverTime = (hoverPercent / 100) * this.video.duration;

        if (this.isPreviewEnabled && Math.abs(this.currentPreviewTime - hoverTime) > 0.5) {
            this.currentPreviewTime = hoverTime;
            clearTimeout(this.previewUpdateTimeout);
            this.previewUpdateTimeout = setTimeout(() => this._updatePreviewCanvas(hoverTime), 100); // Adjusted delay
        }
        
        this.previewTimeNoPreview.textContent = this._secondsToTime(hoverTime, this.video.duration >= 3600);
        let chapterForPreview = null;
        for (let i = this.chapters.length - 1; i >= 0; i--) {
            if (hoverTime >= this.chapters[i].timestamp) {
                chapterForPreview = this.chapters[i];
                break;
            }
        }
        this.previewChapterTitle.textContent = chapterForPreview ? chapterForPreview.title.replace(/</g, "&lt;") : "";
        
        this.timelinePreviewContainer.style.display = 'block';
        this.timelinePreviewContainer.classList.toggle('no-preview', !this.isPreviewEnabled || !this.previewCanvas);
        this.isPreviewVisible = true;

        const seekBarRect = this.seekBarWrapper.getBoundingClientRect();
        const previewContainerRect = this.timelinePreviewContainer.getBoundingClientRect();
        
        // Position the preview container: center it above the hover point on the seek bar
        let leftPosPx = (hoverPercent / 100) * seekBarRect.width - (previewContainerRect.width / 2);
        
        // Clamp position to be within the seek bar's bounds
        leftPosPx = Math.max(0, leftPosPx); // Don't go off the left edge
        leftPosPx = Math.min(seekBarRect.width - previewContainerRect.width, leftPosPx); // Don't go off the right edge
        
        this.timelinePreviewContainer.style.left = `${leftPosPx}px`;
    }

    _hideTimelinePreview() {
        if (this.isPreviewVisible && this.timelinePreviewContainer) {
            this.timelinePreviewContainer.style.display = 'none';
            this.isPreviewVisible = false;
            clearTimeout(this.previewUpdateTimeout);
        }
    }

    _updatePreviewCanvas(time) {
        if (!this.video || this.video.readyState < 1 || !this.previewCanvas || !this.previewCtx || !this.isPreviewEnabled) return;

        // Use a hidden video element for previews to avoid disrupting the main video
        if (!this.previewVideoElement) {
            this.previewVideoElement = document.createElement('video');
            this.previewVideoElement.muted = true;
            this.previewVideoElement.preload = 'metadata'; // Just need metadata and ability to seek
             // Same origin policy applies. Cross-origin videos need CORS headers for canvas drawing.
            this.previewVideoElement.crossOrigin = "anonymous"; 
        }
        // Ensure the preview video has the same source
        if (this.previewVideoElement.src !== this.video.src) {
            this.previewVideoElement.src = this.video.src;
        }
        
        // Set current time and wait for seeked event
        this.previewVideoElement.currentTime = time;

        const drawFrame = () => {
            if (this.previewCtx && this.previewCanvas) { // Check again in case it became null
                this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height); // Clear previous frame
                try {
                    this.previewCtx.drawImage(this.previewVideoElement, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
                } catch (e) {
                    console.error("Error drawing video frame to canvas for preview:", e);
                    // Potentially display a "preview unavailable" message on the canvas itself or hide it.
                    this.timelinePreviewContainer.classList.add('no-preview'); // Fallback to no image
                }
            }
            this.previewVideoElement.removeEventListener('seeked', drawFrame); // Clean up
            this.previewVideoElement.removeEventListener('error', previewError);
        };
        
        const previewError = (e) => {
            console.error("Error with preview video element:", e);
            this.timelinePreviewContainer.classList.add('no-preview');
            this.previewVideoElement.removeEventListener('seeked', drawFrame);
            this.previewVideoElement.removeEventListener('error', previewError);
        };

        this.previewVideoElement.addEventListener('seeked', drawFrame, { once: true });
        this.previewVideoElement.addEventListener('error', previewError, { once: true });

        // If the video is not loaded yet, it might need a load() call.
        // However, if src is already set and metadata loaded, seek should work.
        if (this.previewVideoElement.readyState < 2) { // HAVE_METADATA or more needed
            this.previewVideoElement.load(); // This might be redundant if src hasn't changed
        }
    }


    // --- Public Methods for Builder Interaction ---
    updateChapters(newChaptersData = []) {
        this.chapters = (newChaptersData || []).map((ch, index) => ({
            ...ch,
            id: ch.id || `cp-ch-${Date.now()}-u${index}` // Ensure unique IDs
        })).sort((a, b) => a.timestamp - b.timestamp); // Always keep chapters sorted

        this._renderChapterListInternal();
        this._renderTimelineSegments();
        this._setActiveChapterUI(this.video ? this.video.currentTime : 0); // Update active chapter in list
    }

    updateChapterListTitle(newTitle, hideTitle) {
        this.currentChapterListTitle = newTitle || "Chapters 📖";
        if (hideTitle !== undefined) {
            this.hideChapterListTitle = !!hideTitle;
        }
        
        if (this.chapterListTitleElement) {
            this.chapterListTitleElement.textContent = this.currentChapterListTitle;
            this.chapterListTitleElement.style.display = this.hideChapterListTitle ? 'none' : '';
        }
    }
    
    // Called by builder to enable/disable the visual preview on timeline hover
    setTimelinePreviewEnabled(enabled) {
        this.isPreviewEnabled = !!enabled;
        if (this.timelinePreviewContainer) {
            this.timelinePreviewContainer.classList.toggle('no-preview', !this.isPreviewEnabled || !this.previewCanvas);
            if (!this.isPreviewEnabled) {
                this._hideTimelinePreview(); // Hide it if disabled
            }
        }
    }

    // Allows builder to get current time (e.g., for "Get Timestamp" button)
    getCurrentVideoTime() {
        return this.video ? this.video.currentTime : 0;
    }

    getVideoDuration() {
        return (this.video && this.video.duration && !isNaN(this.video.duration)) ? this.video.duration : 0;
    }

    // Expose basic controls if builder needs them, though mostly internal
    playVideo() { if (this.video && this.video.paused) this.video.play().catch(e => console.error("Player play:", e)); }
    pauseVideo() { if (this.video && !this.video.paused) this.video.pause(); }

    destroy() {
        // Cleanup: remove event listeners, clear timeouts, etc.
        this._removeAllEventListeners();
        
        // Clear any ongoing timeouts
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
            this.previewUpdateTimeout = null;
        }
        
        // Disconnect resize observer if it exists
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // If a shadow root was created, remove it
        if (this.container) {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            if (this.container.shadowRoot) {
                // Note: There's no direct way to remove a shadow root,
                // but we can empty its content
                while (this.container.shadowRoot.firstChild) {
                    this.container.shadowRoot.removeChild(this.container.shadowRoot.firstChild);
                }
            }
        }
    }

    _setupResponsiveLayout() {
        // Check if ResizeObserver is available in the browser
        if (typeof ResizeObserver !== 'undefined') {
            // Create a resize observer to monitor container width changes
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const width = entry.contentRect.width;
                    this._handleContainerResize(width);
                }
            });
            
            // Start observing the container
            if (this.container) {
                this.resizeObserver.observe(this.container);
                
                // Also check initial size
                const width = this.container.offsetWidth;
                this._handleContainerResize(width);
            }
        } else {
            // Fallback for browsers without ResizeObserver
            window.addEventListener('resize', () => {
                if (this.container) {
                    const width = this.container.offsetWidth;
                    this._handleContainerResize(width);
                }
            });
            
            // Initial check
            if (this.container) {
                const width = this.container.offsetWidth;
                this._handleContainerResize(width);
            }
        }
    }
    
    _handleContainerResize(width) {
        // Don't apply compact mode on mobile devices - use media queries instead
        if (this.isMobileDevice) return;
        
        // Apply or remove compact mode based on container width
        if (width <= this.compactModeThreshold) {
            // Apply compact mode
            if (this.playerWrapper) {
                this.playerWrapper.classList.add('compact-mode');
            }
        } else {
            // Remove compact mode
            if (this.playerWrapper) {
                this.playerWrapper.classList.remove('compact-mode');
            }
        }
    }
}

// Note: The actual instantiation and usage (like the commented-out example) 
// will be handled by playerbuilder.js, which will load the necessary JSON. 

// Export the class if using module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ChapterPlayer;
} 