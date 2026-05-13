const customModalOverlay = document.getElementById('customModalOverlay');
const customModalMessage = document.getElementById('customModalMessage');
const customModalCloseBtn = document.getElementById('customModalCloseBtn');

function showAlert(message) {
    customModalMessage.textContent = message;
    customModalOverlay.style.display = 'flex';
}

customModalCloseBtn.addEventListener('click', () => {
    customModalOverlay.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    // Remove any .preview-time elements that may exist
    document.querySelectorAll('.preview-time').forEach(el => el.remove());

    const videoWrapper = document.querySelector('.video-wrapper');
    const video = document.getElementById('mainVideo');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadVideoBtn = document.getElementById('loadVideoBtn');
    
    const chapterListDiv = document.getElementById('chapterList');
    const chapterListTitleElement = document.getElementById('chapterListTitle'); 
    const customChapterTitleInput = document.getElementById('customChapterTitleInput'); 
    const hideChapterTitleCheckbox = document.getElementById('hideChapterTitleCheckbox');

    const chaptersPreviewDiv = document.getElementById('chaptersPreview');
    const chapterIdInput = document.getElementById('chapterId');
    const chapterTimestampInput = document.getElementById('chapterTimestamp');
    const getTimestampBtn = document.getElementById('getTimestampBtn');
    const chapterTitleInput = document.getElementById('chapterTitle');
    const chapterDescriptionInput = document.getElementById('chapterDescription');
    const addChapterBtn = document.getElementById('addChapterBtn');
    const clearChapterFormBtn = document.getElementById('clearChapterFormBtn');
    const jsonOutputTextarea = document.getElementById('jsonOutput');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    // Import Chapters Elements
    const importChaptersBtn = document.getElementById('importChaptersBtn');
    const importChaptersModal = document.getElementById('importChaptersModal');
    const chaptersImportText = document.getElementById('chaptersImportText');
    const processImportBtn = document.getElementById('processImportBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');

    // Transcription Elements
    const transcribeVideoBtn = document.getElementById('transcribeVideoBtn');
    const transcriptionModal = document.getElementById('transcriptionModal');
    const transcriptionFrame = document.getElementById('transcriptionFrame');
    const closeTranscriptionBtn = document.getElementById('closeTranscriptionBtn');

    const timelineContainer = document.getElementById('timelineContainer'); 
    // Initialize timeline container in bottom position
    timelineContainer.classList.add('bottom-position');
    
    const videoControlsCustom = document.getElementById('videoControlsCustom');
    const playPauseBtnCustom = document.getElementById('playPauseBtnCustom');
    const nextChapterBtnCustom = document.getElementById('nextChapterBtnCustom'); 
    
    const bigPlayButtonOverlay = document.getElementById('bigPlayButtonOverlay');
    const bigPlayPauseBtn = document.getElementById('bigPlayPauseBtn'); 

    const seekBarWrapper = document.getElementById('seekBarWrapper'); 
    const seekBarCustom = document.getElementById('seekBarCustom');

    const currentChapterTitleDisplay = document.getElementById('currentChapterTitleDisplay'); 
    const timeDisplayCustom = document.getElementById('timeDisplayCustom');
    
    const muteBtnCustom = document.getElementById('muteBtnCustom');
    const volumeBarCustom = document.getElementById('volumeBarCustom');

    const speedBtnCustom = document.getElementById('speedBtnCustom');
    const speedMenuCustom = document.getElementById('speedMenuCustom');
    const pipBtnCustom = document.getElementById('pipBtnCustom');
    const fullscreenBtnCustom = document.getElementById('fullscreenBtnCustom');

    const previewContainer = document.getElementById('timelinePreviewContainer');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const previewTimeNoPreview = document.querySelector('.preview-time-no-preview');
    const previewChapterTitle = document.querySelector('.preview-chapter-title');
    
    const previewToggle = document.getElementById('previewToggle');
    
    const chapterEditorModal = document.getElementById('chapterEditorModal');
    const openAddChapterBtn = document.getElementById('openAddChapterBtn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const cancelChapterBtn = document.getElementById('cancelChapterBtn');

    let chapters = [];
    let currentVideoSrc = ""; 
    let transcriptionVideoUrl = "";
    let isSeeking = false;
    let currentChapterListTitle = "Chapters 📖";
    let hideChapterListTitle = false;
    const GAP_WIDTH_PIXELS = 4;

    // Set canvas size
    previewCanvas.width = 320;  // Twice the display size for better quality
    previewCanvas.height = 180;

    let isPreviewEnabled = previewToggle.checked;

    previewToggle.addEventListener('change', (e) => {
        isPreviewEnabled = e.target.checked;
        if (isPreviewVisible) {
            previewContainer.classList.toggle('no-preview', !isPreviewEnabled);
        }
        // Store preference in localStorage
        localStorage.setItem('videoPreviewEnabled', isPreviewEnabled);
        // Update the JSON output
        updateJsonOutput();
    });

    // Load user preference
    const savedPreviewPreference = localStorage.getItem('videoPreviewEnabled');
    if (savedPreviewPreference !== null) {
        isPreviewEnabled = savedPreviewPreference === 'true';
        previewToggle.checked = isPreviewEnabled;
    }

    // Initialize the hide chapter title checkbox
    if (hideChapterTitleCheckbox) {
        // Check if there's a saved preference
        const savedHideTitlePreference = localStorage.getItem('hideChapterListTitle');
        if (savedHideTitlePreference !== null) {
            hideChapterListTitle = savedHideTitlePreference === 'true';
            hideChapterTitleCheckbox.checked = hideChapterListTitle;
            
            // Apply the setting if the element exists
            if (chapterListTitleElement) {
                chapterListTitleElement.style.display = hideChapterListTitle ? 'none' : '';
            }
        }
        
        // Set up listener to save preference
        hideChapterTitleCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('hideChapterListTitle', e.target.checked);
        });
    }
    
    // Initialize the title input with current value
    if (customChapterTitleInput) {
        customChapterTitleInput.value = currentChapterListTitle;
    }

    function setActiveIcon(button, activeIconClass) {
        button.querySelectorAll('.icon').forEach(icon => {
            icon.classList.toggle('active', icon.classList.contains(activeIconClass));
        });
    }
    
    loadVideoBtn.addEventListener('click', loadVideoFromInput);
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadVideoFromInput();
    });

    customChapterTitleInput.addEventListener('input', (e) => {
        currentChapterListTitle = e.target.value || "Chapters 📖";
        if (chapterListTitleElement) {
            chapterListTitleElement.textContent = currentChapterListTitle;
            chapterListTitleElement.style.display = hideChapterListTitle ? 'none' : '';
        }
        updateJsonOutput();
    });

    // Chapter List Title Visibility
    if (hideChapterTitleCheckbox) {
        hideChapterTitleCheckbox.addEventListener('change', (e) => {
            hideChapterListTitle = e.target.checked;
            if (chapterListTitleElement) {
                chapterListTitleElement.style.display = hideChapterListTitle ? 'none' : '';
            }
            updateJsonOutput();
        });
    }

    // Time conversion utilities
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
    
    function updateTimeDisplay() {
        const duration = video.duration;
        if (isNaN(duration)) {
             timeDisplayCustom.textContent = `${secondsToTime(video.currentTime)} / --:--`;
             return;
        }
        const showHours = duration >= 3600;
        timeDisplayCustom.textContent = `${secondsToTime(video.currentTime, showHours)} / ${secondsToTime(duration, showHours)}`;
    }

    function loadVideoFromInput() {
        const url = videoUrlInput.value.trim();
        const posterUrl = document.getElementById('posterUrl').value.trim(); // Get poster URL
        if (!url) {
            showAlert("Please enter a valid MP4 URL.");
            return;
        }

        // Make sure we're using an absolute URL for currentVideoSrc
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            currentVideoSrc = url;
        } else {
            // Convert relative URL to absolute
            const baseUrl = window.location.origin + 
                window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            currentVideoSrc = baseUrl + url;
        }
        
        console.log("Setting video source to:", currentVideoSrc);
        
        // Set the video source
        video.src = url; // Can use the original URL since the video element resolves relative paths
        
        if (posterUrl) {
            video.poster = posterUrl; // Set poster if available
        } else {
            video.removeAttribute('poster'); // Remove poster if not provided
        }
        video.load();

        // Reset chapters
        chapters = [];
        renderChapterList();
        renderChaptersPreview();
        updateJsonOutput();
        clearChapterForm();

        // Reset and update chapter list title
        currentChapterListTitle = customChapterTitleInput.value || "Chapters 📖"; 
        hideChapterListTitle = hideChapterTitleCheckbox ? hideChapterTitleCheckbox.checked : false;
        
        if (chapterListTitleElement) {
            chapterListTitleElement.textContent = currentChapterListTitle;
            chapterListTitleElement.style.display = hideChapterListTitle ? 'none' : '';
        }

        console.log(`Video loaded: ${url}`);

        setActiveIcon(playPauseBtnCustom, 'icon-play');
        setActiveIcon(bigPlayPauseBtn, 'icon-play');
        bigPlayButtonOverlay.classList.remove('hidden'); 

        seekBarCustom.value = 0; 
        timeDisplayCustom.textContent = "00:00 / 00:00"; 
        currentChapterTitleDisplay.textContent = ""; 
        video.playbackRate = 1; 
        speedBtnCustom.textContent = "1x";
        speedMenuCustom.querySelectorAll('button').forEach(btn => btn.classList.remove('active-speed'));
        speedMenuCustom.querySelector('button[data-speed="1"]').classList.add('active-speed');
    }

    getTimestampBtn.addEventListener('click', () => {
        if (video.src && video.readyState >= 1) { 
             chapterTimestampInput.value = secondsToTime(video.currentTime, video.duration >= 3600);
        } else {
            showAlert("Load a video first."); chapterTimestampInput.value = "00:00";
        }
    });

    function openModal(isEdit = false) {
        if (!video.src || video.readyState < 1) {
            showAlert("Load a video first.");
            return;
        }

        // Pause the video if it's playing
        if (!video.paused) {
            video.pause();
        }

        // Store current timestamp before opening modal
        const currentTime = video.currentTime;
        
        chapterEditorModal.style.display = 'flex';
        if (!isEdit) {
            clearChapterForm();
            addChapterBtn.textContent = "Add Chapter";
            // Set current timestamp
            chapterTimestampInput.value = secondsToTime(currentTime, video.duration >= 3600);
            // Focus the title input after a short delay to ensure modal transition is complete
            setTimeout(() => chapterTitleInput.focus(), 100);
        }
    }

    function closeModal() {
        chapterEditorModal.style.display = 'none';
        clearChapterForm();
    }

    openAddChapterBtn.addEventListener('click', () => openModal(false));
    closeModalBtn.addEventListener('click', closeModal);
    cancelChapterBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    chapterEditorModal.addEventListener('click', (e) => {
        if (e.target === chapterEditorModal) {
            closeModal();
        }
    });

    // Update the addChapterBtn click handler
    addChapterBtn.addEventListener('click', () => {
        if (!video.src || video.readyState < 1) {
            showAlert("Load a video first.");
            return;
        }

        const id = chapterIdInput.value || `ch-${Date.now()}`; 
        const tsStr = chapterTimestampInput.value.trim();
        const title = chapterTitleInput.value.trim();
        const desc = chapterDescriptionInput.value.trim();

        if (!tsStr || !title) {
            showAlert("Timestamp and Title are required.");
            return;
        }

        const ts = timeToSeconds(tsStr);
        const dur = video.duration;

        if (isNaN(ts) || ts < 0 || (!isNaN(dur) && dur > 0 && ts > dur)) {
            let durMsg = (!isNaN(dur) && dur > 0) ? `(${secondsToTime(dur, dur >= 3600)})` : "(duration unknown)";
            showAlert(`Invalid timestamp. Must be 0 to ${durMsg}.`);
            return;
        }

        // Check for existing chapter with same timestamp
        const existingChapterIndex = chapters.findIndex(ch => Math.abs(ch.timestamp - ts) < 0.1);
        if (existingChapterIndex > -1 && chapters[existingChapterIndex].id !== id) {
            const existingChapter = chapters[existingChapterIndex];
            const confirmReplace = confirm(
                `A chapter already exists at ${secondsToTime(existingChapter.timestamp)}: "${existingChapter.title}"\n\nDo you want to replace it?`
            );
            if (confirmReplace) {
                chapters.splice(existingChapterIndex, 1);
            } else {
                return;
            }
        }

        const chapterData = { id, timestamp: ts, title, description: desc };
        const exIdx = chapters.findIndex(ch => ch.id === id);
        if (exIdx > -1) {
            chapters[exIdx] = chapterData;
        } else {
            chapters.push(chapterData);
        }

        chapters.sort((a, b) => a.timestamp - b.timestamp);
        renderChapterList();
        renderChaptersPreview();
        updateJsonOutput();
        renderTimelineSegments();
        closeModal();
    });

    // Update the edit button click handler in renderChaptersPreview
    chaptersPreviewDiv.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const chEdit = chapters.find(ch => ch.id === id);
            if (chEdit) {
                chapterIdInput.value = chEdit.id;
                chapterTimestampInput.value = secondsToTime(chEdit.timestamp, video.duration >= 3600);
                chapterTitleInput.value = chEdit.title;
                chapterDescriptionInput.value = chEdit.description || '';
                addChapterBtn.textContent = "Update Chapter";
                openModal(true);
            }
        });
    });

    function clearChapterForm() {
        chapterIdInput.value = ""; chapterTimestampInput.value = "";
        chapterTitleInput.value = ""; chapterDescriptionInput.value = "";
        addChapterBtn.textContent = "Add/Update Chapter";
        if (clearChapterFormBtn) {
            clearChapterFormBtn.style.display = "none";
        }
    }

    function renderChapterList() {
        chapterListTitleElement.textContent = currentChapterListTitle; 
        const listContent = chapterListDiv.querySelector('p') || document.createElement('div'); 
        if (chapterListDiv.querySelector('p')) chapterListDiv.querySelector('p').remove(); 
        
        Array.from(chapterListDiv.children).forEach(child => {
            if (child.tagName !== 'H2') child.remove();
        });

        if (!currentVideoSrc || !video.src || video.readyState < 1 ) { 
            const p = document.createElement('p');
            p.textContent = "Load a video to see chapters.";
            chapterListDiv.appendChild(p);
            return;
        }
        if (chapters.length === 0) {
             const p = document.createElement('p');
            p.textContent = "No chapters added for this video.";
            chapterListDiv.appendChild(p);
            return;
        }
        const showHours = video.duration >= 3600;
        chapters.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'chapter-item'; item.dataset.timestamp = ch.timestamp;
            item.innerHTML = `<strong>${ch.title} (${secondsToTime(ch.timestamp, showHours)})</strong><p>${ch.description||''}</p>`;
            item.addEventListener('click', () => {
                video.currentTime = ch.timestamp;
                if (video.paused) video.play().catch(e=>console.error("play err", e)); 
                setActiveChapterUI(ch.timestamp); 
            });
            chapterListDiv.appendChild(item);
        });
        setActiveChapterUI(video.currentTime); 
    }

    function renderChaptersPreview() {
        chaptersPreviewDiv.innerHTML = '<h3>Current Chapters</h3>';
        if (!currentVideoSrc || !video.src || video.readyState < 1 ) {
            chaptersPreviewDiv.innerHTML += "<p>Load a video to manage chapters.</p>"; return;
        }
        if (chapters.length === 0) {
            chaptersPreviewDiv.innerHTML += "<p>No chapters to preview/edit.</p>"; return;
        }
        const showHours = video.duration >= 3600;
        chapters.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'chapter-preview-item';
            item.innerHTML = `<div><strong>${ch.title}</strong> <small>(${secondsToTime(ch.timestamp, showHours)})</small><p>${ch.description||'No desc.'}</p></div><div class="chapter-actions"><button class="edit-btn" data-id="${ch.id}">Edit</button><button class="delete-btn" data-id="${ch.id}">Delete</button></div>`;
            chaptersPreviewDiv.appendChild(item);
        });
        chaptersPreviewDiv.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const chEdit = chapters.find(ch => ch.id === id);
                if (chEdit) {
                    chapterIdInput.value = chEdit.id;
                    chapterTimestampInput.value = secondsToTime(chEdit.timestamp, video.duration >= 3600);
                    chapterTitleInput.value = chEdit.title;
                    chapterDescriptionInput.value = chEdit.description;
                    addChapterBtn.textContent = "Update Chapter";
                    openModal(true);
                }
            });
        });
        chaptersPreviewDiv.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = document.getElementById('customModalOverlay');
                const msg = document.getElementById('customModalMessage');
                const container = document.querySelector('.custom-modal');
                container.querySelectorAll('.confirm-action-btn').forEach(b => b.remove());
                msg.textContent = "Delete this chapter?";
                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = "Delete"; confirmBtn.className = "confirm-action-btn";
                confirmBtn.style.cssText = "background-color:#dc3545;color:white;margin-right:10px;";
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = "Cancel"; cancelBtn.className = "confirm-action-btn";
                cancelBtn.style.cssText = "background-color:#6c757d;color:white;";
                container.appendChild(confirmBtn); container.appendChild(cancelBtn);
                modal.style.display = 'flex';
                document.getElementById('customModalCloseBtn').style.display = 'none';
                confirmBtn.onclick = () => {
                    const id = e.target.dataset.id;
                    chapters = chapters.filter(ch => ch.id !== id);
                    renderChapterList(); renderChaptersPreview(); updateJsonOutput(); renderTimelineSegments();
                    if (chapterIdInput.value === id) clearChapterForm();
                    modal.style.display = 'none'; confirmBtn.remove(); cancelBtn.remove();
                    document.getElementById('customModalCloseBtn').style.display = 'inline-block';
                };
                cancelBtn.onclick = () => {
                    modal.style.display = 'none'; confirmBtn.remove(); cancelBtn.remove();
                    document.getElementById('customModalCloseBtn').style.display = 'inline-block';
                };
            });
        });
    }

    function updateJsonOutput() {
        if (jsonOutputTextarea) {
            // Get the base URL of the current page
            const baseUrl = window.location.origin + 
                window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            
            // Convert relative video URL to absolute if needed
            let videoUrlAbsolute = currentVideoSrc;
            if (videoUrlAbsolute && !videoUrlAbsolute.startsWith('http://') && 
                !videoUrlAbsolute.startsWith('https://') && !videoUrlAbsolute.startsWith('//')) {
                videoUrlAbsolute = baseUrl + videoUrlAbsolute;
            }
            
            const jsonData = {
                videoUrl: videoUrlAbsolute,
                posterUrl: document.getElementById('posterUrl').value.trim(), // Get poster URL
                chapterListTitle: currentChapterListTitle,
                hideChapterListTitle: hideChapterListTitle,
                isPreviewEnabled: isPreviewEnabled,
                chapters: chapters
            };
            
            // First convert JSON to string with double quotes
            const jsonString = JSON.stringify(jsonData, null, 2);
            
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

    copyJsonBtn.addEventListener('click', () => {
        if (!jsonOutputTextarea.value || jsonOutputTextarea.value.trim().length < 30) { 
            showAlert("Nothing to copy."); return;
        }
        jsonOutputTextarea.select();
        try { document.execCommand('copy'); showAlert('JSON copied!'); }
        catch (err) { showAlert('Failed to copy.'); console.error('Copy fail', err); }
        window.getSelection().removeAllRanges();
    });

    function renderTimelineSegments() {
        seekBarWrapper.innerHTML = ''; 
        
        // Add seek bar but no continuous progress or thumb
        seekBarWrapper.appendChild(seekBarCustom); 

        if (!video.duration || isNaN(video.duration) || video.duration === 0) {
            const segment = document.createElement('div');
            segment.className = 'timeline-chapter-segment';
            segment.style.flexGrow = '1';
            
            // Add progress indicator div inside the segment
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'segment-progress';
            progressIndicator.style.width = '0%';
            segment.appendChild(progressIndicator);
            
            seekBarWrapper.insertBefore(segment, seekBarCustom);
            updateSegmentProgress();
            return;
        }

        if (chapters.length === 0) {
            const segment = document.createElement('div');
            segment.className = 'timeline-chapter-segment';
            segment.style.flexGrow = '1';
            segment.dataset.startTime = 0;
            segment.dataset.endTime = video.duration;
            segment.dataset.title = "Full Video";
            
            // Add progress indicator div inside the segment
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'segment-progress';
            progressIndicator.style.width = '0%';
            segment.appendChild(progressIndicator);
            
            addSegmentEventListeners(segment);
            seekBarWrapper.insertBefore(segment, seekBarCustom);
            updateSegmentProgress();
            return;
        }

        let currentPosition = 0;
        const totalDuration = video.duration;

        chapters.forEach((chapter, index) => {
            const chapterStart = chapter.timestamp;
            const chapterEnd = (index + 1 < chapters.length) ? chapters[index + 1].timestamp : totalDuration;
            
            const segmentDuration = chapterEnd - chapterStart;
            if (segmentDuration <= 0 && chapterEnd < totalDuration) return;

            const segment = document.createElement('div');
            segment.className = 'timeline-chapter-segment';
            const segmentWidthPercent = (segmentDuration / totalDuration) * 100;
            segment.style.flexBasis = `${segmentWidthPercent}%`;
            
            segment.dataset.startTime = chapterStart;
            segment.dataset.endTime = chapterEnd;
            segment.dataset.title = chapter.title;
            segment.dataset.timestamp = chapter.timestamp;
            
            // Add progress indicator div inside the segment
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'segment-progress';
            progressIndicator.style.width = '0%';
            segment.appendChild(progressIndicator);
            
            addSegmentEventListeners(segment);
            seekBarWrapper.insertBefore(segment, seekBarCustom);

            if (index < chapters.length - 1) {
                const gap = document.createElement('div');
                gap.className = 'timeline-gap-segment';
                seekBarWrapper.insertBefore(gap, seekBarCustom);
            }
            currentPosition = chapterEnd;
        });

        updateSegmentProgress();
    }

    function addSegmentEventListeners(segment) {
        // Simple mouse hover events
        segment.addEventListener('mouseover', (e) => {
            segment.classList.add('hovered');
            updateTooltipForSegment(segment, e);
        });

        segment.addEventListener('mousemove', (e) => {
            updateTooltipForSegment(segment, e);
        });

        segment.addEventListener('mouseout', (e) => {
            segment.classList.remove('hovered');
        });
        
        // Add click handler to each segment
        segment.addEventListener('click', (e) => {
            if (!video.src || video.readyState < 1 || isNaN(video.duration)) return;
            
            // Prevent event bubbling
            e.stopPropagation();
            
            // Get the click position within the segment
            const segmentRect = segment.getBoundingClientRect();
            const clickX = e.clientX - segmentRect.left;
            const segmentWidth = segmentRect.width;
            const clickPercentWithinSegment = clickX / segmentWidth;
            
            // Get the segment's time range
            const startTime = parseFloat(segment.dataset.startTime);
            const endTime = parseFloat(segment.dataset.endTime);
            const segmentDuration = endTime - startTime;
            
            // Calculate the time to seek to based on click position within the segment
            const seekTime = startTime + (clickPercentWithinSegment * segmentDuration);
            
            // Update video time
            video.currentTime = Math.max(0, Math.min(video.duration, seekTime));
            
            // Update UI immediately
            updateSegmentProgress();
            updateTimeDisplay();
            
            // Play if paused
            if (video.paused) video.play().catch(err => console.error(err));
        });
    }

    function updateTooltipForSegment(segment, e) {
        const wrapperRect = seekBarWrapper.getBoundingClientRect();
        const chapterTitle = segment.dataset.title || "Video";
        const chapterTime = parseFloat(segment.dataset.timestamp);
        
        seekBarTooltip.innerHTML = `<span class="tooltip-title">${chapterTitle}</span><span class="tooltip-time">${secondsToTime(chapterTime, video.duration >= 3600)}</span>`;
        
        const mouseX = e.clientX - wrapperRect.left;
        let hoverPercent = (mouseX / wrapperRect.width) * 100;
        hoverPercent = Math.max(0, Math.min(100, hoverPercent));
        
        positionTooltip(hoverPercent);
        seekBarTooltip.style.display = 'block';
    }

    function positionTooltip(hoverPercent) {
        let tooltipLeftPercent = hoverPercent;
        const tooltipWidth = seekBarTooltip.offsetWidth;
        const seekBarWidth = seekBarWrapper.offsetWidth;

        if (seekBarWidth > 0 && tooltipWidth > 0) {
            const minLeftPercent = (tooltipWidth / 2 / seekBarWidth) * 100;
            const maxLeftPercent = 100 - minLeftPercent;
            tooltipLeftPercent = Math.max(minLeftPercent, Math.min(tooltipLeftPercent, maxLeftPercent));
        } else {
            tooltipLeftPercent = hoverPercent;
        }
        
        seekBarTooltip.style.left = `${tooltipLeftPercent}%`;
    }

    let currentPreviewTime = 0;
    let isPreviewVisible = false;

    function updatePreview(time) {
        if (!video.src || video.readyState < 1) return;
        
        // Store current time
        const currentVideoTime = video.currentTime;
        
        // Create a temporary video element for preview
        if (!window.previewVideo) {
            window.previewVideo = document.createElement('video');
            window.previewVideo.src = video.src;
            window.previewVideo.preload = 'auto';
        }
        
        // Use the preview video for thumbnails
        window.previewVideo.currentTime = time;
        window.previewVideo.addEventListener('seeked', () => {
            previewCtx.drawImage(window.previewVideo, 0, 0, previewCanvas.width, previewCanvas.height);
        }, { once: true });
    }

    let previewUpdateTimeout;

    function showPreview(e, hoverPercent) {
        if (!video.src || video.readyState < 1 || isNaN(video.duration)) return;
        const rect = seekBarWrapper.getBoundingClientRect();
        const hoverTime = (hoverPercent / 100) * video.duration;
        if (isPreviewEnabled && Math.abs(currentPreviewTime - hoverTime) > 0.5) {
            currentPreviewTime = hoverTime;
            clearTimeout(previewUpdateTimeout);
            previewUpdateTimeout = setTimeout(() => updatePreview(hoverTime), 100);
        }
        // Always show time in preview-time-no-preview
        previewTimeNoPreview.textContent = secondsToTime(hoverTime, video.duration >= 3600);
        let previewChapter = null;
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (hoverTime >= chapters[i].timestamp) {
                previewChapter = chapters[i];
                break;
            }
        }
        previewChapterTitle.textContent = previewChapter ? previewChapter.title : "";
        previewContainer.style.display = 'block';
        previewContainer.classList.toggle('no-preview', !isPreviewEnabled);
        isPreviewVisible = true;
        const previewRect = previewContainer.getBoundingClientRect();
        let leftPos = (hoverPercent / 100) * rect.width;
        leftPos = Math.max(previewRect.width / 2, Math.min(rect.width - previewRect.width / 2, leftPos));
        previewContainer.style.left = `${leftPos}px`;
    }

    function hidePreview() {
        if (isPreviewVisible) {
            previewContainer.style.display = 'none';
            isPreviewVisible = false;
            clearTimeout(previewUpdateTimeout);
        }
    }

    function updateSegmentProgress() {
        if (!video.src || video.readyState < 1 || isNaN(video.duration) || video.duration === 0) return;
        
        const currentTime = video.currentTime;
        const segments = seekBarWrapper.querySelectorAll('.timeline-chapter-segment');
        
        // First, sort segments by their startTime to ensure proper ordering
        const sortedSegments = Array.from(segments).sort((a, b) => {
            return parseFloat(a.dataset.startTime) - parseFloat(b.dataset.startTime);
        });
        
        // Find the current active segment index
        let activeSegmentIndex = -1;
        for (let i = 0; i < sortedSegments.length; i++) {
            const startTime = parseFloat(sortedSegments[i].dataset.startTime);
            const endTime = parseFloat(sortedSegments[i].dataset.endTime);
            
            if (currentTime >= startTime && currentTime < endTime) {
                activeSegmentIndex = i;
                break;
            }
        }
        
        // Update progress for each segment
        sortedSegments.forEach((segment, index) => {
            const startTime = parseFloat(segment.dataset.startTime);
            const endTime = parseFloat(segment.dataset.endTime);
            
            // Mark segment as active if current time falls within it
            const isActive = currentTime >= startTime && currentTime < endTime;
            segment.classList.toggle('active', isActive);
            
            // Get progress indicator element
            let progressIndicator = segment.querySelector('.segment-progress');
            if (!progressIndicator) return;
            
            let progressWidth = '0%';
            // If this segment is before the active segment, fill 100% immediately
            if (index < activeSegmentIndex) {
                progressWidth = '100%';
            } 
            // If this segment is after the active segment, set to 0% immediately
            else if (index > activeSegmentIndex || activeSegmentIndex === -1) {
                progressWidth = '0%';
            }
            // This is the active segment, calculate the progress
            else {
                const segmentDuration = endTime - startTime;
                const segmentProgress = segmentDuration > 0 ? 
                    ((currentTime - startTime) / segmentDuration) * 100 : 0;
                progressWidth = `${segmentProgress}%`;
            }
            
            progressIndicator.style.width = progressWidth;
        });
    }

    // Update seekBarWrapper mousemove event
    seekBarWrapper.addEventListener('mousemove', (e) => { 
        const rect = seekBarWrapper.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        let hoverPercent = (hoverX / rect.width) * 100;
        hoverPercent = Math.max(0, Math.min(100, hoverPercent));

        showPreview(e, hoverPercent);
    });

    // Modify existing seekBarWrapper mouseout event
    seekBarWrapper.addEventListener('mouseout', (e) => {
        // Only trigger if we're actually leaving the wrapper
        if (e.relatedTarget && (seekBarWrapper.contains(e.relatedTarget) || 
                               seekBarWrapper === e.relatedTarget)) {
            return;
        }
        
        hidePreview();
        seekBarTooltip.style.display = 'none';
        
        // Remove hovered class from all segments
        seekBarWrapper.querySelectorAll('.timeline-chapter-segment.hovered').forEach(seg => {
            seg.classList.remove('hovered');
        });
    });

    // Store current time before seeking for preview
    let currentTime = 0;
    video.addEventListener('timeupdate', () => {
        if (!isSeeking) {
            seekBarCustom.value = video.currentTime;
            updateSegmentProgress();
        }
        updateTimeDisplay(); 
        
        let currentChapter = null;
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (video.currentTime >= chapters[i].timestamp - 0.1) { 
                currentChapter = chapters[i];
                break;
            }
        }
        currentChapterTitleDisplay.textContent = currentChapter ? currentChapter.title : "";
        currentChapterTitleDisplay.title = currentChapter ? currentChapter.title : "";

        setActiveChapterUI(video.currentTime); 
    });

    video.addEventListener('play', () => {
        setActiveIcon(playPauseBtnCustom, 'icon-pause');
        setActiveIcon(bigPlayPauseBtn, 'icon-pause'); 
        bigPlayButtonOverlay.classList.add('hidden'); 
    });
    video.addEventListener('pause', () => {
        setActiveIcon(playPauseBtnCustom, 'icon-play');
        setActiveIcon(bigPlayPauseBtn, 'icon-play'); 
        if (video.readyState >= 1 && !video.ended) { 
            bigPlayButtonOverlay.classList.remove('hidden'); 
        }
    });
    video.addEventListener('ended', () => {
        setActiveIcon(playPauseBtnCustom, 'icon-replay');
        setActiveIcon(bigPlayPauseBtn, 'icon-replay'); 
        bigPlayButtonOverlay.classList.remove('hidden'); 
    });
    
    video.addEventListener('click', (e) => {
        if (e.target === video && bigPlayButtonOverlay.classList.contains('hidden')) {
             togglePlayPause();
        }
    });
    bigPlayButtonOverlay.addEventListener('click', togglePlayPause);
    playPauseBtnCustom.addEventListener('click', togglePlayPause);

    function togglePlayPause() {
        if (!video.src || video.readyState < 1) { showAlert("Load a video first."); return; }
        if (video.paused || video.ended) {
            video.play().catch(e => { console.error("Play error:", e); showAlert("Could not play: " + e.message); });
        } else {
            video.pause();
        }
    }

    nextChapterBtnCustom.addEventListener('click', () => {
        if (!video.src || video.readyState < 1 || chapters.length === 0) return;
        const currentTime = video.currentTime;
        let nextChapterTimestamp = -1;
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].timestamp > currentTime + 0.1) { 
                nextChapterTimestamp = chapters[i].timestamp;
                break;
            }
        }
        if (nextChapterTimestamp !== -1) {
            video.currentTime = nextChapterTimestamp;
            if (video.paused) video.play().catch(e => console.error("Play error on next chapter:", e));
        } else {
            console.log("Already at or past the last chapter.");
        }
    });

    // Update the seekbar click handling
    seekBarWrapper.addEventListener('click', (e) => {
        if (!video.src || video.readyState < 1 || isNaN(video.duration)) return;
        
        // Check if the click was on a chapter segment (which has its own click handler)
        if (e.target.classList.contains('timeline-chapter-segment') ||
            e.target.classList.contains('segment-progress')) {
            // Let the segment's click handler manage this
            return;
        }
        
        // Get the click position relative to the seekbar wrapper
        const rect = seekBarWrapper.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercent = (clickX / rect.width);
        const clickTime = clickPercent * video.duration;
        
        // Update video time
        video.currentTime = Math.max(0, Math.min(video.duration, clickTime));
        
        // Update UI immediately
        updateSegmentProgress();
        updateTimeDisplay();
        
        // Play if paused
        if (video.paused) video.play().catch(err => console.error(err));
    });

    // Update the seek bar input handling
    seekBarCustom.addEventListener('input', (e) => {
        if (!video.src || video.readyState < 1 || isNaN(video.duration)) return;
        
        const seekValue = parseFloat(e.target.value);
        video.currentTime = seekValue;
        
        // Update UI immediately
        updateSegmentProgress();
        updateTimeDisplay();
    });

    video.addEventListener('loadedmetadata', () => {
        if (isNaN(video.duration)) {
            seekBarCustom.max = 0; 
        } else {
            seekBarCustom.max = video.duration;
        }
        updateTimeDisplay(); 
        renderChapterList(); 
        renderChaptersPreview(); 
        updateJsonOutput(); 
        renderTimelineSegments(); 
        bigPlayButtonOverlay.classList.remove('hidden'); 
        setActiveIcon(bigPlayPauseBtn, 'icon-play');
        setActiveIcon(playPauseBtnCustom, 'icon-play');
    });

    function setActiveChapterUI(currentTime) {
        let activeTs = null;
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (chapters[i].timestamp <= currentTime + 0.5) { activeTs = chapters[i].timestamp; break; }
        }
        document.querySelectorAll('.chapter-list .chapter-item').forEach(item => {
            const itemTs = parseFloat(item.dataset.timestamp);
            if (itemTs === activeTs) {
                if (!item.classList.contains('active')) {
                    item.classList.add('active');
                    const itemRect = item.getBoundingClientRect();
                    const listRect = chapterListDiv.getBoundingClientRect();
                    if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            } else {
                item.classList.remove('active');
            }
        });
    }

    chapterListTitleElement.textContent = currentChapterListTitle;
    customChapterTitleInput.value = currentChapterListTitle;
    renderChapterList(); renderChaptersPreview(); updateJsonOutput(); renderTimelineSegments();
    setActiveIcon(playPauseBtnCustom, 'icon-play'); 
    setActiveIcon(bigPlayPauseBtn, 'icon-play'); 
    bigPlayButtonOverlay.classList.remove('hidden'); 

    setActiveIcon(muteBtnCustom, video.muted || video.volume === 0 ? 'icon-volume-muted' : 'icon-volume-high');
    volumeBarCustom.value = video.muted ? 0 : video.volume;
    setActiveIcon(fullscreenBtnCustom, 'icon-fullscreen');

    if (video.src && video.readyState >=1 && !isNaN(video.duration)) { 
         updateTimeDisplay();
         seekBarCustom.max = video.duration;
    } else {
         timeDisplayCustom.textContent = "00:00 / 00:00";
         seekBarCustom.max = 0; 
    }

    // Import Chapters Modal Functionality
    importChaptersBtn.addEventListener('click', () => openImportModal());
    importChaptersModal.querySelector('.close-modal-btn').addEventListener('click', closeImportModal);
    cancelImportBtn.addEventListener('click', closeImportModal);

    // Close modal when clicking outside
    importChaptersModal.addEventListener('click', (e) => {
        if (e.target === importChaptersModal) {
            closeImportModal();
        }
    });

    function openImportModal() {
        if (!video.src || video.readyState < 1) {
            showAlert("Load a video first.");
            return;
        }

        // Pause the video if it's playing
        if (!video.paused) {
            video.pause();
        }

        importChaptersModal.style.display = 'flex';
        setTimeout(() => chaptersImportText.focus(), 100);
    }

    function closeImportModal() {
        importChaptersModal.style.display = 'none';
        chaptersImportText.value = '';
    }

    processImportBtn.addEventListener('click', () => {
        if (!video.src || video.readyState < 1) {
            showAlert("Load a video first.");
            return;
        }

        const importText = chaptersImportText.value.trim();
        if (!importText) {
            showAlert("Please paste chapter data to import.");
            return;
        }

        try {
            const newChapters = parseImportedChapters(importText);
            
            if (newChapters.length === 0) {
                showAlert("No valid chapters found. Please check the format.");
                return;
            }

            // Ask for confirmation if chapters already exist
            if (chapters.length > 0) {
                const modal = document.getElementById('customModalOverlay');
                const msg = document.getElementById('customModalMessage');
                const container = document.querySelector('.custom-modal');
                
                container.querySelectorAll('.confirm-action-btn').forEach(b => b.remove());
                
                msg.textContent = `You already have ${chapters.length} chapter(s). Do you want to replace them or merge with the ${newChapters.length} imported chapter(s)?`;
                
                const replaceBtn = document.createElement('button');
                replaceBtn.textContent = "Replace All";
                replaceBtn.className = "confirm-action-btn";
                replaceBtn.style.cssText = "background-color:#dc3545;color:white;margin-right:10px;";
                
                const mergeBtn = document.createElement('button');
                mergeBtn.textContent = "Merge";
                mergeBtn.className = "confirm-action-btn";
                mergeBtn.style.cssText = "background-color:#28a745;color:white;margin-right:10px;";
                
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = "Cancel";
                cancelBtn.className = "confirm-action-btn";
                cancelBtn.style.cssText = "background-color:#6c757d;color:white;";
                
                container.appendChild(replaceBtn);
                container.appendChild(mergeBtn);
                container.appendChild(cancelBtn);
                
                modal.style.display = 'flex';
                document.getElementById('customModalCloseBtn').style.display = 'none';
                
                replaceBtn.onclick = () => {
                    chapters = [...newChapters];
                    chapters.sort((a, b) => a.timestamp - b.timestamp);
                    updateAfterImport();
                    modal.style.display = 'none';
                    container.querySelectorAll('.confirm-action-btn').forEach(b => b.remove());
                    document.getElementById('customModalCloseBtn').style.display = 'inline-block';
                };
                
                mergeBtn.onclick = () => {
                    // Merge chapters, avoiding duplicates based on timestamp proximity
                    newChapters.forEach(newChapter => {
                        // Check if there's an existing chapter very close to this timestamp
                        const existingIndex = chapters.findIndex(ch => 
                            Math.abs(ch.timestamp - newChapter.timestamp) < 0.5);
                        
                        if (existingIndex >= 0) {
                            // Replace the existing chapter
                            chapters[existingIndex] = newChapter;
                        } else {
                            // Add as a new chapter
                            chapters.push(newChapter);
                        }
                    });
                    
                    chapters.sort((a, b) => a.timestamp - b.timestamp);
                    updateAfterImport();
                    modal.style.display = 'none';
                    container.querySelectorAll('.confirm-action-btn').forEach(b => b.remove());
                    document.getElementById('customModalCloseBtn').style.display = 'inline-block';
                };
                
                cancelBtn.onclick = () => {
                    modal.style.display = 'none';
                    container.querySelectorAll('.confirm-action-btn').forEach(b => b.remove());
                    document.getElementById('customModalCloseBtn').style.display = 'inline-block';
                };
            } else {
                // No existing chapters, just add the new ones
                chapters = [...newChapters];
                updateAfterImport();
            }
        } catch (error) {
            console.error("Import error:", error);
            showAlert("Error importing chapters: " + error.message);
        }
    });

    function parseImportedChapters(text) {
        const lines = text.split('\n');
        const newChapters = [];
        
        lines.forEach((line, index) => {
            line = line.trim();
            if (!line) return; // Skip empty lines
            
            // Try to match timestamp and title
            // Match formats like "0:00", "00:00", "0:00:00", or just seconds
            const timestampMatch = line.match(/^((\d+:)?\d+:\d+|\d+)\s+(.+)$/);
            
            if (timestampMatch) {
                const timestampStr = timestampMatch[1];
                const title = timestampMatch[3].trim();
                
                const timestamp = timeToSeconds(timestampStr);
                
                if (!isNaN(timestamp) && timestamp >= 0 && (!video.duration || timestamp <= video.duration)) {
                    newChapters.push({
                        id: `import-${Date.now()}-${index}`,
                        timestamp,
                        title,
                        description: ''
                    });
                }
            }
        });
        
        return newChapters;
    }

    function updateAfterImport() {
        renderChapterList();
        renderChaptersPreview();
        updateJsonOutput();
        renderTimelineSegments();
        closeImportModal();
        showAlert(`Successfully imported ${chapters.length} chapters.`);
    }

    // Add missing event listeners for video controls
    
    // Mute button functionality
    muteBtnCustom.addEventListener('click', () => {
        if (!video.src || video.readyState < 1) return;
        video.muted = !video.muted;
        setActiveIcon(muteBtnCustom, video.muted ? 'icon-volume-muted' : 'icon-volume-high');
    });

    // Volume control
    volumeBarCustom.addEventListener('input', () => {
        if (!video.src || video.readyState < 1) return;
        video.volume = volumeBarCustom.value;
        video.muted = video.volume === 0;
        setActiveIcon(muteBtnCustom, video.volume === 0 ? 'icon-volume-muted' : 'icon-volume-high');
    });
    
    // Playback speed button and menu
    speedBtnCustom.addEventListener('click', (e) => {
        e.stopPropagation(); 
        speedMenuCustom.style.display = speedMenuCustom.style.display === 'block' ? 'none' : 'block';
    });
    
    speedMenuCustom.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            const speed = parseFloat(e.target.dataset.speed);
            video.playbackRate = speed;
            speedBtnCustom.textContent = `${speed}x`;
            speedMenuCustom.querySelectorAll('button').forEach(btn => btn.classList.remove('active-speed'));
            e.target.classList.add('active-speed');
            speedMenuCustom.style.display = 'none';
        });
    });
    
    // Close speed menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!speedBtnCustom.contains(e.target) && !speedMenuCustom.contains(e.target)) {
            speedMenuCustom.style.display = 'none';
        }
    });
    
    // Picture-in-Picture functionality
    if ('pictureInPictureEnabled' in document) {
        pipBtnCustom.addEventListener('click', async () => {
            if (!video.src || video.readyState < 1) { 
                showAlert("Load a video first."); 
                return; 
            }
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await video.requestPictureInPicture();
                }
            } catch (error) {
                console.error("PiP Error:", error);
                showAlert("Picture-in-Picture not supported or an error occurred.");
            }
        });
    } else {
        pipBtnCustom.style.display = 'none'; // Hide PiP button if not supported
    }
    
    // Fullscreen functionality
    fullscreenBtnCustom.addEventListener('click', () => {
        if (!video.src || video.readyState < 1) { 
            showAlert("Load a video first."); 
            return; 
        }
        
        const videoWrapper = document.querySelector('.video-wrapper');
        
        if (!document.fullscreenElement) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) { /* Safari */
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) { /* IE11 */
                videoWrapper.msRequestFullscreen();
            }
            setActiveIcon(fullscreenBtnCustom, 'icon-fullscreen-exit');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
            setActiveIcon(fullscreenBtnCustom, 'icon-fullscreen');
        }
    });
    
    // Update fullscreen button icon when fullscreen state changes
    document.addEventListener('fullscreenchange', () => {
        setActiveIcon(fullscreenBtnCustom, document.fullscreenElement ? 'icon-fullscreen-exit' : 'icon-fullscreen');
    });

    // Add event listeners to show/hide controls
    videoWrapper.addEventListener('mouseenter', () => {
        videoControlsCustom.classList.add('visible');
        timelineContainer.classList.remove('bottom-position');
    });
    
    videoWrapper.addEventListener('mouseleave', () => {
        videoControlsCustom.classList.remove('visible');
        timelineContainer.classList.add('bottom-position');
    });

    // Load from Embed Code Functionality
    const loadFromEmbedBtn = document.getElementById('loadFromEmbedBtn');
    const loadFromEmbedModal = document.getElementById('loadFromEmbedModal');
    const embedCodeText = document.getElementById('embedCodeText');
    const processEmbedBtn = document.getElementById('processEmbedBtn');
    const cancelEmbedBtn = document.getElementById('cancelEmbedBtn');

    if (loadFromEmbedBtn) {
        loadFromEmbedBtn.addEventListener('click', openEmbedModal);
    }
    
    if (loadFromEmbedModal) {
        loadFromEmbedModal.querySelector('.close-modal-btn').addEventListener('click', closeEmbedModal);
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
        if (loadFromEmbedModal) {
            // Pause the video if it's playing
            if (video && !video.paused) {
                video.pause();
            }
            
            loadFromEmbedModal.style.display = 'flex';
            if (embedCodeText) {
                setTimeout(() => embedCodeText.focus(), 100);
            }
        } else {
            console.error("Embed modal not found");
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
        const embedCode = embedCodeText.value.trim();
        if (!embedCode) {
            showAlert("Please paste the embed code.");
            return;
        }
        
        // Try to extract data-config attribute
        const configMatch = embedCode.match(/data-config=['"](.+?)['"]/);
        if (!configMatch || !configMatch[1]) {
            showAlert("Could not find data-config in the embed code.");
            return;
        }
        
        try {
            // Fix single quotes to be valid JSON
            const configJsonFixed = configMatch[1].replace(/'/g, '"');
            const config = JSON.parse(configJsonFixed);
            
            // Populate form fields
            if (config.videoUrl) document.getElementById('videoUrl').value = config.videoUrl;
            if (config.posterUrl) document.getElementById('posterUrl').value = config.posterUrl; // Set poster URL
            if (config.chapterListTitle) document.getElementById('customChapterTitleInput').value = config.chapterListTitle;
            if (config.hasOwnProperty('hideChapterListTitle')) {
                document.getElementById('hideChapterTitleCheckbox').checked = config.hideChapterListTitle;
            }
            if (config.hasOwnProperty('isPreviewEnabled')) {
                document.getElementById('previewToggle').checked = config.isPreviewEnabled;
            }
            
            // Import chapters
            if (config.chapters && Array.isArray(config.chapters)) {
                chapters = [...config.chapters];
                renderChapterList();
            }
            
            // Load the video
            loadVideoFromInput();
            
            // Close modal
            document.getElementById('loadFromEmbedModal').style.display = 'none';
            
            showAlert("Configuration loaded successfully!");
        } catch (e) {
            console.error("Error parsing embed configuration:", e);
            showAlert("Error parsing configuration: " + e.message);
        }
    }

    // Transcription Modal Handlers
    if (transcribeVideoBtn) {
        transcribeVideoBtn.addEventListener('click', openTranscriptionModal);
    }

    if (closeTranscriptionBtn) {
        closeTranscriptionBtn.addEventListener('click', closeTranscriptionModal);
    }

    // Close the transcription modal when the X button is clicked
    if (transcriptionModal) {
        transcriptionModal.querySelector('.close-modal-btn').addEventListener('click', closeTranscriptionModal);
    }

    // Initialize the transcription functionality
    if (typeof window.initTranscription === 'function') {
        window.initTranscription();
    }

    function openTranscriptionModal() {
        // Check if we have a valid video source
        if (!currentVideoSrc || currentVideoSrc === "") {
            // If currentVideoSrc is empty, try to get it from video.src
            if (video.src && video.src !== "" && video.src !== "about:blank") {
                currentVideoSrc = video.src;
                console.log("Retrieved video URL from video element:", currentVideoSrc);
            } else {
                showAlert("Please load a video first before attempting to transcribe.");
                return;
            }
        }

        console.log("Opening transcription modal with video:", currentVideoSrc);
        
        // Display the transcription modal
        transcriptionModal.style.display = 'flex';
        
        // Start the transcription process
        if (typeof window.startTranscriptionProcess === 'function') {
            // Make sure we're using an absolute URL
            let videoUrl = currentVideoSrc;
            if (videoUrl && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('//')) {
                // If it's a relative URL, convert to absolute
                const baseUrl = window.location.origin + 
                    window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                videoUrl = baseUrl + videoUrl;
            }
            
            window.startTranscriptionProcess(videoUrl);
        } else {
            console.error("startTranscriptionProcess function not found");
        }
    }

    function closeTranscriptionModal() {
        transcriptionModal.style.display = 'none';
    }

    // Provide the function for the transcription.js to call
    window.importChaptersFromTranscription = function(transcriptionChapters) {
        // Filter out any chapters that would be too close to existing ones
        const minTimeDiff = 5; // Minimum 5 seconds between chapters
        
        // Convert existing chapters to timestamps for comparison
        const existingTimestamps = chapters.map(ch => timeToSeconds(ch.timestamp));
        
        // Add the transcription chapters if they don't overlap with existing ones
        let addedCount = 0;
        
        transcriptionChapters.forEach(chapter => {
            const timestamp = chapter.timestamp;
            
            // Check if this timestamp is too close to an existing one
            const isTooClose = existingTimestamps.some(existing => 
                Math.abs(existing - timestamp) < minTimeDiff
            );
            
            if (!isTooClose) {
                // Add the chapter
                chapters.push({
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    timestamp: timestamp,
                    time: secondsToTime(timestamp),
                    title: chapter.title,
                    description: chapter.description || ''
                });
                
                addedCount++;
                
                // Add this timestamp to our comparison array
                existingTimestamps.push(timestamp);
            }
        });
        
        // Sort chapters by timestamp
        chapters.sort((a, b) => timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp));
        
        // Update the UI
        renderChapterList();
        renderChaptersPreview();
        renderTimelineSegments();
        updateJsonOutput();
        
        // Show a confirmation
        showAlert(`Added ${addedCount} new chapters from transcription.`);
        
        // Close the modal
        closeTranscriptionModal();
    };
}); 