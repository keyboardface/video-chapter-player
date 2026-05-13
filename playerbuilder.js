document.addEventListener('DOMContentLoaded', () => {
    // Builder-specific Modal Elements (moved from original script.js)
    const customModalOverlay = document.getElementById('customModalOverlay');
    const customModalMessage = document.getElementById('customModalMessage');
    const customModalCloseBtn = document.getElementById('customModalCloseBtn');

    // Builder-specific showAlert function
    function showAlert(message) {
        if (customModalMessage && customModalOverlay) {
            customModalMessage.textContent = message;
            customModalOverlay.style.display = 'flex';
        } else {
            console.warn('PlayerBuilder: Modal elements not found for showAlert.');
            alert(message); // Fallback to browser alert
        }
    }

    if (customModalCloseBtn && customModalOverlay) {
        customModalCloseBtn.addEventListener('click', () => {
            customModalOverlay.style.display = 'none';
        });
    }

    // Player Instance Container ID (must match the div in index.html)
    const playerContainerId = 'playerInstanceContainer'; 

    // Builder UI Elements (references from original script.js)
    const videoUrlInput = document.getElementById('videoUrl');
    const loadVideoBtn = document.getElementById('loadVideoBtn');
    
    // Chapter List Title editing for the player
    const customChapterTitleInput = document.getElementById('customChapterTitleInput'); 
    const hideChapterTitleCheckbox = document.getElementById('hideChapterTitleCheckbox');

    // Chapter Editor Modal Elements and Form Inputs
    const chapterEditorModal = document.getElementById('chapterEditorModal');
    const openAddChapterBtn = document.getElementById('openAddChapterBtn');
    const closeModalBtn = chapterEditorModal ? chapterEditorModal.querySelector('.close-modal-btn') : null;
    const cancelChapterBtn = document.getElementById('cancelChapterBtn');

    const chapterIdInput = document.getElementById('chapterId');
    const chapterTimestampInput = document.getElementById('chapterTimestamp');
    const getTimestampBtn = document.getElementById('getTimestampBtn');
    const chapterTitleInput = document.getElementById('chapterTitle');
    const chapterDescriptionInput = document.getElementById('chapterDescription');
    const addChapterBtn = document.getElementById('addChapterBtn');
    // const clearChapterFormBtn = document.getElementById('clearChapterFormBtn'); // This button might be dynamically handled or removed

    // JSON Output Elements
    const jsonOutputTextarea = document.getElementById('jsonOutput');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    // Import Chapters Modal Elements
    const importChaptersBtn = document.getElementById('importChaptersBtn');
    const importChaptersModal = document.getElementById('importChaptersModal');
    const chaptersImportText = document.getElementById('chaptersImportText');
    const processImportBtn = document.getElementById('processImportBtn');
    const cancelImportBtn = importChaptersModal ? importChaptersModal.querySelector('#cancelImportBtn') : null; // Corrected selector
    const importCloseModalBtn = importChaptersModal ? importChaptersModal.querySelector('.close-modal-btn') : null;

    // Timeline Preview Toggle
    const previewToggle = document.getElementById('previewToggle');

    // Chapters Preview Area (for the builder UI, distinct from player's list)
    const chaptersPreviewDiv = document.getElementById('chaptersPreview');

    // --- Initialize ChapterPlayer ---
    // We need to ensure the container div (e.g., playerInstanceContainer) exists in index.html
    let chapterPlayer = null;
    const playerContainerElement = document.getElementById(playerContainerId);

    if (!playerContainerElement) {
        console.error(`PlayerBuilder: Container element with ID '${playerContainerId}' not found. Player cannot be initialized.`);
        showAlert(`Critical Error: Player container missing. Please check HTML structure.`);
        return; // Stop further execution if player container is missing
    }
    
    // Instantiate the player. Initially, it might not have JSON data.
    // The ChapterPlayer class itself handles default state if jsonData is null/undefined.
    try {
        chapterPlayer = new ChapterPlayer(playerContainerId, null);
    } catch (e) {
        console.error("PlayerBuilder: Error instantiating ChapterPlayer:", e);
        showAlert("Critical Error: Could not create the video player. " + e.message);
        return;
    }

    // --- Utility Functions (some might be adapted from original script.js or ChapterPlayer if they are general) ---
    // Time conversion utilities - these are also in ChapterPlayer, so we can use player's instance methods or duplicate for builder logic if preferred.
    // For now, assume ChapterPlayer methods are not directly exposed for this, or we prefer builder having its own.
    function timeToSeconds(timeStr) {
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

    function secondsToTime(totalSeconds, showHoursForce = false) {
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

    // --- Builder Functionality ---
    let currentBuilderChapters = []; // Local cache for builder's chapter data
    let currentBuilderVideoUrl = "";
    let currentBuilderChapterListTitle = "Chapters 📖";
    let currentBuilderHideChapterTitle = false;

    // Function to load video into the ChapterPlayer instance
    function loadVideoInPlayer() {
        const url = videoUrlInput.value.trim();
        if (url && chapterPlayer) {
            currentBuilderVideoUrl = url;
            currentBuilderChapters = []; // Reset chapters when a new video is loaded
            
            // Prepare data for player's init method
            const playerData = {
                videoUrl: currentBuilderVideoUrl,
                chapters: currentBuilderChapters, // Initially empty or load from a source
                chapterListTitle: customChapterTitleInput.value || "Chapters 📖",
                hideChapterListTitle: hideChapterTitleCheckbox ? hideChapterTitleCheckbox.checked : false,
                isPreviewEnabled: previewToggle.checked
            };
            chapterPlayer.init(playerData);
            
            // Update builder UI
            updateBuilderJsonOutput();
            renderBuilderChaptersPreview();
            clearChapterEditForm();
            if (customChapterTitleInput) customChapterTitleInput.value = playerData.chapterListTitle;
            if (hideChapterTitleCheckbox) hideChapterTitleCheckbox.checked = playerData.hideChapterListTitle;

            console.log("PlayerBuilder: Video load initiated for:", url);
        } else if (!chapterPlayer) {
            showAlert("Player is not initialized.");
        } else {
            showAlert("Please enter a valid MP4 URL.");
        }
    }

    if (loadVideoBtn) {
        loadVideoBtn.addEventListener('click', loadVideoInPlayer);
    }
    if (videoUrlInput) {
        videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loadVideoInPlayer();
        });
    }

    // Update player's chapter list title
    if (customChapterTitleInput && chapterPlayer) {
        customChapterTitleInput.addEventListener('input', (e) => {
            currentBuilderChapterListTitle = e.target.value || "Chapters 📖";
            const hideTitle = hideChapterTitleCheckbox ? hideChapterTitleCheckbox.checked : false;
            chapterPlayer.updateChapterListTitle(currentBuilderChapterListTitle, hideTitle);
            updateBuilderJsonOutput();
        });
    }

    // Handle Timeline Preview Toggle
    if (previewToggle && chapterPlayer) {
        // Set initial player state based on toggle
        chapterPlayer.setTimelinePreviewEnabled(previewToggle.checked);
        localStorage.setItem('videoPreviewEnabled', previewToggle.checked);

        previewToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            chapterPlayer.setTimelinePreviewEnabled(isEnabled);
            localStorage.setItem('videoPreviewEnabled', isEnabled);
            updateBuilderJsonOutput(); // Update JSON when preview toggle changes
        });
        // Load user preference
        const savedPreviewPreference = localStorage.getItem('videoPreviewEnabled');
        if (savedPreviewPreference !== null) {
            const isEnabled = savedPreviewPreference === 'true';
            previewToggle.checked = isEnabled;
            chapterPlayer.setTimelinePreviewEnabled(isEnabled); 
        }
    }

    // Handle chapter title visibility toggle
    if (hideChapterTitleCheckbox && chapterPlayer) {
        hideChapterTitleCheckbox.addEventListener('change', (e) => {
            currentBuilderHideChapterTitle = e.target.checked;
            chapterPlayer.updateChapterListTitle(currentBuilderChapterListTitle, currentBuilderHideChapterTitle);
            updateBuilderJsonOutput();
        });
    }

    // --- Chapter Editor Modal Logic (from original script.js, adapted for builder) ---
    function openChapterEditModal(isEdit = false, chapterData = null) {
        if (!chapterPlayer || !chapterPlayer.getVideoDuration()) { // Check if player has a video loaded
            showAlert("Load a video first and ensure it has loaded correctly.");
            return;
        }
        if (chapterPlayer.video && !chapterPlayer.video.paused) {
            chapterPlayer.pauseVideo();
        }

        if (chapterEditorModal) {
            chapterEditorModal.style.display = 'flex';
            if (isEdit && chapterData) {
                chapterIdInput.value = chapterData.id;
                chapterTimestampInput.value = secondsToTime(chapterData.timestamp, chapterPlayer.getVideoDuration() >= 3600);
                chapterTitleInput.value = chapterData.title;
                chapterDescriptionInput.value = chapterData.description || '';
                addChapterBtn.textContent = "Update Chapter";
            } else {
                clearChapterEditForm();
                addChapterBtn.textContent = "Add Chapter";
                const currentTime = chapterPlayer.getCurrentVideoTime();
                chapterTimestampInput.value = secondsToTime(currentTime, chapterPlayer.getVideoDuration() >= 3600);
            }
            setTimeout(() => chapterTitleInput.focus(), 100); 
        } else {
            console.error("PlayerBuilder: Chapter editor modal not found.");
        }
    }

    function closeChapterEditModal() {
        if (chapterEditorModal) chapterEditorModal.style.display = 'none';
        // clearChapterEditForm(); // Clearing form is handled by open/add logic
    }

    if (openAddChapterBtn) {
        openAddChapterBtn.addEventListener('click', () => openChapterEditModal(false));
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeChapterEditModal);
    }
    if (cancelChapterBtn) {
        cancelChapterBtn.addEventListener('click', closeChapterEditModal);
    }
    if (chapterEditorModal) {
        chapterEditorModal.addEventListener('click', (e) => {
            if (e.target === chapterEditorModal) closeChapterEditModal();
        });
    }

    function clearChapterEditForm() {
        if(chapterIdInput) chapterIdInput.value = "";
        if(chapterTimestampInput) chapterTimestampInput.value = "";
        if(chapterTitleInput) chapterTitleInput.value = "";
        if(chapterDescriptionInput) chapterDescriptionInput.value = "";
        if(addChapterBtn) addChapterBtn.textContent = "Add Chapter"; 
    }

    if (getTimestampBtn && chapterPlayer) {
        getTimestampBtn.addEventListener('click', () => {
            if (chapterPlayer.getVideoDuration() > 0) { 
                 chapterTimestampInput.value = secondsToTime(chapterPlayer.getCurrentVideoTime(), chapterPlayer.getVideoDuration() >= 3600);
            } else {
                showAlert("Video not loaded or duration is zero."); chapterTimestampInput.value = "00:00";
            }
        });
    }

    // Add/Update Chapter Logic
    if (addChapterBtn && chapterPlayer) {
        addChapterBtn.addEventListener('click', () => {
            if (!chapterPlayer.getVideoDuration()) {
                showAlert("Load a video first."); return;
            }

            const id = chapterIdInput.value || `ch-${Date.now()}`;
            const tsStr = chapterTimestampInput.value.trim();
            const title = chapterTitleInput.value.trim();
            const desc = chapterDescriptionInput.value.trim();

            if (!tsStr || !title) {
                showAlert("Timestamp and Title are required."); return;
            }

            const ts = timeToSeconds(tsStr);
            const dur = chapterPlayer.getVideoDuration();

            if (isNaN(ts) || ts < 0 || (dur > 0 && ts > dur)) {
                showAlert(`Invalid timestamp. Must be 0 to ${secondsToTime(dur, dur >= 3600)}.`);
                return;
            }
            
            const existingChapterIndexById = currentBuilderChapters.findIndex(ch => ch.id === id);
            const existingChapterIndexByTs = currentBuilderChapters.findIndex(ch => Math.abs(ch.timestamp - ts) < 0.1 && ch.id !== id);

            if (existingChapterIndexByTs > -1) {
                 const confirmReplace = confirm(
                    `A chapter already exists near ${secondsToTime(currentBuilderChapters[existingChapterIndexByTs].timestamp)}: "${currentBuilderChapters[existingChapterIndexByTs].title}"\n\nThis new chapter is at ${secondsToTime(ts)}. Do you want to overwrite the existing chapter or add this as a new one? Press OK to overwrite, Cancel to add as new (potentially creating a duplicate timestamp).`
                );
                 if (confirmReplace) {
                    currentBuilderChapters.splice(existingChapterIndexByTs, 1);
                    // If we were editing, and the timestamp changed to an existing one, we need to ensure the original ID is also removed if it's different.
                    if (existingChapterIndexById > -1 && currentBuilderChapters[existingChapterIndexById] && currentBuilderChapters[existingChapterIndexById].id === id && existingChapterIndexById !== existingChapterIndexByTs) {
                        currentBuilderChapters.splice(existingChapterIndexById, 1);
                    }
                } else {
                    // User chose not to replace, so we add as new. If we were editing an existing chapter (id exists), 
                    // we effectively create a new chapter here and the old one remains unless its id was the one being replaced.
                }
            }

            const chapterData = { id, timestamp: ts, title, description: desc };

            if (existingChapterIndexById > -1) { // Editing existing chapter
                currentBuilderChapters[existingChapterIndexById] = chapterData;
            } else { // Adding new chapter
                currentBuilderChapters.push(chapterData);
            }

            currentBuilderChapters.sort((a, b) => a.timestamp - b.timestamp);
            chapterPlayer.updateChapters(currentBuilderChapters);
            updateBuilderJsonOutput();
            renderBuilderChaptersPreview();
            closeChapterEditModal();
        });
    }
    
    // --- Render Builder's Chapter Preview List ---
    function renderBuilderChaptersPreview() {
        if (!chaptersPreviewDiv) return;
        chaptersPreviewDiv.innerHTML = '<h3>Current Chapters</h3>'; // Keep header consistent with original
        if (!currentBuilderVideoUrl || !chapterPlayer.getVideoDuration()) {
            chaptersPreviewDiv.innerHTML += "<p>Load a video to manage chapters.</p>"; return;
        }
        if (currentBuilderChapters.length === 0) {
            chaptersPreviewDiv.innerHTML += "<p>No chapters to preview/edit.</p>"; return;
        }
        const showHours = chapterPlayer.getVideoDuration() >= 3600;
        currentBuilderChapters.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'chapter-preview-item'; // From original styles.css
            item.innerHTML = `<div><strong>${escapeHTML(ch.title)}</strong> <small>(${secondsToTime(ch.timestamp, showHours)})</small><p>${escapeHTML(ch.description||'No desc.')}</p></div><div class="chapter-actions"><button class="edit-btn" data-id="${ch.id}">Edit</button><button class="delete-btn" data-id="${ch.id}">Delete</button></div>`;
            chaptersPreviewDiv.appendChild(item);
        });

        // Add event listeners for new Edit/Delete buttons in builder UI
        chaptersPreviewDiv.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const chapterToEdit = currentBuilderChapters.find(c => c.id === id);
                if (chapterToEdit) {
                    openChapterEditModal(true, chapterToEdit);
                }
            });
        });
        chaptersPreviewDiv.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chapterIdToDelete = e.target.dataset.id;
                // Custom confirmation dialog (re-implementing simple version)
                const chapterToDelete = currentBuilderChapters.find(c => c.id === chapterIdToDelete);
                if (confirm(`Are you sure you want to delete chapter: "${chapterToDelete ? chapterToDelete.title : 'this chapter'}"?`)) {
                    currentBuilderChapters = currentBuilderChapters.filter(c => c.id !== chapterIdToDelete);
                    chapterPlayer.updateChapters(currentBuilderChapters);
                    updateBuilderJsonOutput();
                    renderBuilderChaptersPreview();
                    if (chapterIdInput.value === chapterIdToDelete) clearChapterEditForm(); 
                }
            });
        });
    }

    // --- JSON Output ---
    function updateBuilderJsonOutput() {
        if (jsonOutputTextarea) {
            // Get the base URL of the current page
            const baseUrl = window.location.origin + 
                window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            
            // Convert relative video URL to absolute if needed
            let videoUrlAbsolute = currentBuilderVideoUrl;
            if (videoUrlAbsolute && !videoUrlAbsolute.startsWith('http://') && 
                !videoUrlAbsolute.startsWith('https://') && !videoUrlAbsolute.startsWith('//')) {
                videoUrlAbsolute = baseUrl + videoUrlAbsolute;
            }
            
            const outputData = {
                videoUrl: videoUrlAbsolute,
                chapterListTitle: currentBuilderChapterListTitle,
                hideChapterListTitle: currentBuilderHideChapterTitle,
                isPreviewEnabled: previewToggle ? previewToggle.checked : true,
                chapters: currentBuilderChapters.map(({ id, ...rest }) => rest) // Exclude builder-specific ID from final JSON
            };
            
            // First convert JSON to string with double quotes
            const jsonString = JSON.stringify(outputData, null, 2);
            
            // Convert to single quotes for better HTML embedding
            const singleQuotedJson = jsonString.replace(/"/g, "'");
            
            // Flatten the JSON to a single line for the data-config attribute
            const flattenedJson = singleQuotedJson.replace(/\n\s*/g, '');
            
            // Create the full embed code with div and script using absolute URL for embed.js
            const embedJsUrl = baseUrl + 'embed.js';
            const embedCode = `<div class="video-chapter-player" data-config="${flattenedJson}"></div>
<!-- The embed.js script will automatically handle single-quoted JSON -->
<script src="${embedJsUrl}"></script>`;
            
            jsonOutputTextarea.value = embedCode;
        }
    }

    if (copyJsonBtn && jsonOutputTextarea) {
        copyJsonBtn.addEventListener('click', () => {
            if (!jsonOutputTextarea.value || jsonOutputTextarea.value.trim().length < 30) { 
                showAlert("Nothing to copy."); return;
            }
            jsonOutputTextarea.select();
            try { 
                document.execCommand('copy'); 
                showAlert('JSON copied!'); 
            }
            catch (err) { 
                showAlert('Failed to copy JSON.'); 
                console.error('PlayerBuilder: JSON copy failed', err);
            }
            window.getSelection().removeAllRanges(); // Deselect
        });
    }

    // --- Import Chapters Modal & Logic ---
    function openImportModal() {
        if (!chapterPlayer || !chapterPlayer.getVideoDuration()) {
            showAlert("Load a video first."); return;
        }
        if (chapterPlayer.video && !chapterPlayer.video.paused) {
            chapterPlayer.pauseVideo();
        }
        if (importChaptersModal) {
            importChaptersModal.style.display = 'flex';
            if(chaptersImportText) setTimeout(() => chaptersImportText.focus(), 100);
        } else {
            console.error("PlayerBuilder: Import chapters modal not found.");
        }
    }
    function closeImportModal() {
        if (importChaptersModal) importChaptersModal.style.display = 'none';
        if (chaptersImportText) chaptersImportText.value = '';
    }

    if (importChaptersBtn) importChaptersBtn.addEventListener('click', openImportModal);
    if (importCloseModalBtn) importCloseModalBtn.addEventListener('click', closeImportModal);
    if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);
    if (importChaptersModal) {
        importChaptersModal.addEventListener('click', (e) => {
            if (e.target === importChaptersModal) closeImportModal();
        });
    }

    if (processImportBtn && chapterPlayer) {
        processImportBtn.addEventListener('click', () => {
            if (!chapterPlayer.getVideoDuration()) {
                showAlert("Load a video first."); return;
            }
            const importText = chaptersImportText.value.trim();
            if (!importText) {
                showAlert("Please paste chapter data to import."); return;
            }
            try {
                const parsedChapters = parseImportedChapters(importText, chapterPlayer.getVideoDuration());
                if (parsedChapters.length === 0) {
                    showAlert("No valid chapters found or chapters exceed video duration. Please check format and timestamps."); return;
                }
                if (currentBuilderChapters.length > 0) {
                    if (confirm(`You have ${currentBuilderChapters.length} existing chapters. Replace them with ${parsedChapters.length} imported chapters? (Cancel to merge)`)) {
                        currentBuilderChapters = parsedChapters;
                    } else {
                        // Merge: Add new, replace if timestamp is very close
                        parsedChapters.forEach(newCh => {
                            const existingIdx = currentBuilderChapters.findIndex(oldCh => Math.abs(oldCh.timestamp - newCh.timestamp) < 0.5);
                            if (existingIdx > -1) currentBuilderChapters[existingIdx] = newCh; // Replace
                            else currentBuilderChapters.push(newCh); // Add new
                        });
                    }
                } else {
                    currentBuilderChapters = parsedChapters;
                }
                currentBuilderChapters.sort((a, b) => a.timestamp - b.timestamp);
                chapterPlayer.updateChapters(currentBuilderChapters);
                updateBuilderJsonOutput();
                renderBuilderChaptersPreview();
                closeImportModal();
            } catch (error) {
                console.error("PlayerBuilder: Import error:", error);
                showAlert("Error importing chapters: " + error.message);
            }
        });
    }

    function parseImportedChapters(text, videoDuration) {
        const lines = text.split('\n');
        const newChapters = [];
        lines.forEach((line, index) => {
            line = line.trim();
            if (!line) return;
            const timestampMatch = line.match(/^((\d+:)?\d+:\d+|\d+(\.\d+)?)\s+(.+)$/);
            if (timestampMatch) {
                const timestampStr = timestampMatch[1];
                const title = timestampMatch[4].trim(); // Corrected index for title
                const timestamp = timeToSeconds(timestampStr);
                if (!isNaN(timestamp) && timestamp >= 0 && (!videoDuration || timestamp <= videoDuration)) {
                    newChapters.push({
                        id: `imported-${Date.now()}-${index}`,
                        timestamp,
                        title,
                        description: ''
                    });
                }
            }
        });
        return newChapters;
    }
    
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // --- Load from Embed Functionality ---
    const loadFromEmbedBtn = document.getElementById('loadFromEmbedBtn');
    const loadFromEmbedModal = document.getElementById('loadFromEmbedModal');
    const embedCodeText = document.getElementById('embedCodeText');
    const processEmbedBtn = document.getElementById('processEmbedBtn');
    const cancelEmbedBtn = document.getElementById('cancelEmbedBtn');

    if (loadFromEmbedBtn) {
        loadFromEmbedBtn.addEventListener('click', openEmbedModal);
    }
    
    if (loadFromEmbedModal) {
        const closeEmbedModalBtn = loadFromEmbedModal.querySelector('.close-modal-btn');
        if (closeEmbedModalBtn) {
            closeEmbedModalBtn.addEventListener('click', closeEmbedModal);
        }
        
        loadFromEmbedModal.addEventListener('click', (e) => {
            if (e.target === loadFromEmbedModal) {
                closeEmbedModal();
            }
        });
    }
    
    if (cancelEmbedBtn) {
        cancelEmbedBtn.addEventListener('click', closeEmbedModal);
    }
    
    if (processEmbedBtn) {
        processEmbedBtn.addEventListener('click', processEmbedCode);
    }

    function openEmbedModal() {
        if (!chapterPlayer) {
            showAlert("Player not initialized.");
            return;
        }
        
        if (loadFromEmbedModal) {
            // Pause the video if it's playing
            if (chapterPlayer.video && !chapterPlayer.video.paused) {
                chapterPlayer.pauseVideo();
            }
            
            loadFromEmbedModal.style.display = 'flex';
            if (embedCodeText) {
                setTimeout(() => embedCodeText.focus(), 100);
            }
        } else {
            console.error("PlayerBuilder: Embed modal not found");
        }
    }

    function closeEmbedModal() {
        if (loadFromEmbedModal) {
            loadFromEmbedModal.style.display = 'none';
            if (embedCodeText) {
                embedCodeText.value = '';
            }
        }
    }

    function processEmbedCode() {
        if (!embedCodeText || !chapterPlayer) return;
        
        const embedCode = embedCodeText.value.trim();
        if (!embedCode) {
            showAlert("Please paste embed code to load.");
            return;
        }
        
        try {
            // Extract the data-config attribute
            const configMatch = embedCode.match(/data-config=['"]([^]*?)['"](?:\s|>)/);
            if (!configMatch || !configMatch[1]) {
                showAlert("Could not find valid configuration in the embed code. Make sure it contains a data-config attribute.");
                return;
            }
            
            const configStr = configMatch[1];
            console.log("PlayerBuilder: Extracted config string:", configStr);
            
            // Decode HTML entities if present
            const decodedConfigStr = decodeHtmlEntities(configStr);
            
            // Try to parse using Function constructor for more flexibility with quotes
            // This is safer than eval() but can handle both single and double-quoted JSON
            let config;
            try {
                // Convert to proper JSON first by replacing single quotes with double quotes,
                // but being careful about nested quotes
                config = JSON.parse(convertSingleQuotedJson(decodedConfigStr));
                console.log("PlayerBuilder: Successfully parsed JSON:", config);
            } catch (parseError) {
                console.log("PlayerBuilder: Initial parsing failed, trying alternative approach:", parseError);
                
                try {
                    // Try using Function constructor (safer than eval)
                    config = Function('return ' + decodedConfigStr)();
                    console.log("PlayerBuilder: Function constructor parsing succeeded:", config);
                } catch (funcError) {
                    console.log("PlayerBuilder: Function constructor parsing failed:", funcError);
                    
                    // Last resort: fallback parsing method using regex
                    config = extractConfigManually(decodedConfigStr);
                    console.log("PlayerBuilder: Manual extraction result:", config);
                    
                    if (!config) {
                        throw new Error("All parsing methods failed for embed configuration");
                    }
                }
            }
            
            // Extract the data
            if (config) {
                // Set video URL
                if (config.videoUrl) {
                    if (videoUrlInput) {
                        videoUrlInput.value = config.videoUrl;
                    }
                    currentBuilderVideoUrl = config.videoUrl;
                }
                
                // Set chapter list title
                if (config.chapterListTitle) {
                    currentBuilderChapterListTitle = config.chapterListTitle;
                    if (customChapterTitleInput) {
                        customChapterTitleInput.value = config.chapterListTitle;
                    }
                }
                
                // Set hide chapter list title option
                if (config.hasOwnProperty('hideChapterListTitle')) {
                    currentBuilderHideChapterTitle = !!config.hideChapterListTitle;
                    if (hideChapterTitleCheckbox) {
                        hideChapterTitleCheckbox.checked = currentBuilderHideChapterTitle;
                    }
                }
                
                // Set preview enabled option
                if (config.hasOwnProperty('isPreviewEnabled') && previewToggle) {
                    previewToggle.checked = !!config.isPreviewEnabled;
                }
                
                // Set chapters
                if (config.chapters && Array.isArray(config.chapters)) {
                    currentBuilderChapters = config.chapters.map((ch, index) => ({
                        ...ch,
                        id: ch.id || `ch-${Date.now()}-${index}`
                    }));
                    
                    // Initialize player with the configuration
                    const playerData = {
                        videoUrl: currentBuilderVideoUrl,
                        chapters: currentBuilderChapters,
                        chapterListTitle: currentBuilderChapterListTitle,
                        hideChapterListTitle: currentBuilderHideChapterTitle,
                        isPreviewEnabled: previewToggle ? previewToggle.checked : true
                    };
                    
                    // Initialize the player with this configuration
                    chapterPlayer.init(playerData);
                    
                    // Update builder UI
                    updateBuilderJsonOutput();
                    renderBuilderChaptersPreview();
                    
                    showAlert("Configuration loaded successfully!");
                }
                
                closeEmbedModal();
            } else {
                showAlert("Invalid configuration format.");
            }
        } catch (error) {
            console.error("PlayerBuilder: Error processing embed code:", error);
            showAlert("Error processing embed code: " + error.message);
        }
    }
    
    // Helper function to decode HTML entities
    function decodeHtmlEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
    
    // Helper function to convert single-quoted JSON to valid double-quoted JSON
    function convertSingleQuotedJson(json) {
        // This is a more sophisticated method to handle nested quotes
        let inString = false;
        let escaped = false;
        let stringChar = '';
        let result = '';
        
        for (let i = 0; i < json.length; i++) {
            const char = json[i];
            
            if (!inString) {
                // Outside of a string, replace single quotes with double quotes for property names and string values
                if (char === "'") {
                    result += '"';
                    inString = true;
                    stringChar = "'";
                } else if (char === '"') {
                    result += char;
                    inString = true;
                    stringChar = '"';
                } else {
                    result += char;
                }
            } else {
                // Inside a string
                if (escaped) {
                    // This character is escaped, add it as is
                    result += char;
                    escaped = false;
                } else if (char === '\\') {
                    // This is an escape character
                    result += char;
                    escaped = true;
                } else if (char === stringChar) {
                    // End of the string
                    result += '"'; // Always use double quotes to close
                    inString = false;
                } else {
                    // Regular character in a string
                    result += char;
                }
            }
        }
        
        return result;
    }
    
    // Fallback method to extract config values directly
    function extractConfigManually(configStr) {
        try {
            // Create a basic configuration object
            const config = {
                videoUrl: '',
                chapterListTitle: 'Chapters 📖',
                hideChapterListTitle: false,
                isPreviewEnabled: true,
                chapters: []
            };
            
            // Try to extract the video URL
            const videoUrlMatch = configStr.match(/videoUrl['"]?\s*:\s*['"]([^'"]+)['"]/);
            if (videoUrlMatch && videoUrlMatch[1]) {
                config.videoUrl = videoUrlMatch[1];
            }
            
            // Try to extract chapter list title
            const titleMatch = configStr.match(/chapterListTitle['"]?\s*:\s*['"]([^'"]+)['"]/);
            if (titleMatch && titleMatch[1]) {
                config.chapterListTitle = titleMatch[1];
            }
            
            // Try to extract hide chapter list title option
            const hideMatch = configStr.match(/hideChapterListTitle['"]?\s*:\s*(['"]?)(true|false)\1/);
            if (hideMatch && hideMatch[2]) {
                config.hideChapterListTitle = hideMatch[2] === 'true';
            }
            
            // Try to extract preview enabled option
            const previewMatch = configStr.match(/isPreviewEnabled['"]?\s*:\s*(['"]?)(true|false)\1/);
            if (previewMatch && previewMatch[2]) {
                config.isPreviewEnabled = previewMatch[2] === 'true';
            }
            
            // Try to extract chapters
            const chaptersMatch = configStr.match(/chapters['"]?\s*:\s*\[(.*)\]/s);
            if (chaptersMatch && chaptersMatch[1]) {
                const chaptersStr = chaptersMatch[1];
                
                // Extract each chapter object
                const chapterMatches = [...chaptersStr.matchAll(/\{([^{}]+)\}/g)];
                
                config.chapters = chapterMatches.map((match, index) => {
                    const chapterStr = match[1];
                    
                    // Extract timestamp
                    const timestampMatch = chapterStr.match(/timestamp['"]?\s*:\s*(['"]?)(\d+(?:\.\d+)?)\1/);
                    const timestamp = timestampMatch ? parseFloat(timestampMatch[2]) : 0;
                    
                    // Extract title
                    const titleMatch = chapterStr.match(/title['"]?\s*:\s*['"]([^'"]+)['"]/);
                    const title = titleMatch ? titleMatch[1] : `Chapter ${index + 1}`;
                    
                    // Extract description
                    const descMatch = chapterStr.match(/description['"]?\s*:\s*['"]([^'"]*)['"]/);
                    const description = descMatch ? descMatch[1] : '';
                    
                    return {
                        id: `ch-${Date.now()}-${index}`,
                        timestamp,
                        title,
                        description
                    };
                });
            }
            
            return config;
        } catch (e) {
            console.error("Manual extraction failed:", e);
            return null;
        }
    }

    // --- Initial UI Setup for Builder ---
    renderBuilderChaptersPreview(); // Initial render (will show 'Load video')
    updateBuilderJsonOutput(); // Initial render (will be empty or default)
    if (customChapterTitleInput) customChapterTitleInput.value = currentBuilderChapterListTitle;
    if (hideChapterTitleCheckbox) hideChapterTitleCheckbox.checked = currentBuilderHideChapterTitle;

    console.log("PlayerBuilder initialized.");
}); 