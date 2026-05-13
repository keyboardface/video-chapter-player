/**
 * Video Chapter Player Embed Script
 * This script finds all .video-chapter-player elements and initializes them with their config.
 */
(function() {
    // Get the base URL for resource loading
    function getBaseUrl() {
        let scripts = document.getElementsByTagName('script');
        let scriptUrl = '';
        
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.includes('embed.js')) {
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

    // Convert single-quoted JSON to valid double-quoted JSON for parsing
    function fixJsonFormat(jsonStr) {
        // Replace single quotes with double quotes, but only where appropriate
        return jsonStr.replace(/'/g, '"');
    }
    
    // Load required scripts. CSS is loaded per-instance by ChapterPlayer
    // (shadow root or `<style id="vcp-styles">` in <head>), so no document-
    // level <link> is injected here — that would duplicate the stylesheet.
    function loadDependencies(baseUrl, callback) {
        const jsScript = document.createElement('script');
        jsScript.src = baseUrl + 'chapterplayer.js';
        jsScript.onload = callback;
        jsScript.onerror = () => console.error('Failed to load ChapterPlayer script');
        document.head.appendChild(jsScript);
    }
    
    // Initialize players when dependencies are loaded
    function initPlayers() {
        const baseUrl = getBaseUrl();
        const playerElements = document.querySelectorAll('.video-chapter-player');
        
        playerElements.forEach((element, index) => {
            const containerId = 'video-chapter-player-' + (index + 1);
            element.id = containerId;
            
            let config = null;
            
            // Check for data-config attribute
            if (element.dataset.config) {
                try {
                    const fixedJson = fixJsonFormat(element.dataset.config);
                    config = JSON.parse(fixedJson);
                    // Add the base URL to the config for resource loading
                    config.baseUrl = baseUrl;
                    
                    // Initialize the player
                    new ChapterPlayer(containerId, config);
                } catch (error) {
                    console.error('Error parsing player configuration:', error);
                    element.innerHTML = '<p>Error: Invalid player configuration</p>';
                }
            } else {
                element.innerHTML = '<p>Error: No configuration provided</p>';
            }
        });
    }
    
    // Main entry point
    function main() {
        const baseUrl = getBaseUrl();
        loadDependencies(baseUrl, initPlayers);
    }
    
    // Execute main function when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})(); 