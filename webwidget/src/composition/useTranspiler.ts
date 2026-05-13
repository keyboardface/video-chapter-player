import { computed } from 'vue'
import useStore from '../store'

export const useTranspiler = () => {
  const store = useStore()

  const htmlPreview = computed(() => {
    const config = {
      videoUrl: store.settings.value.videoUrl,
      posterUrl: store.settings.value.posterUrl,
      chapterListTitle: store.settings.value.chapterListTitle,
      hideChapterListTitle: store.settings.value.hideChapterListTitle,
      enablePreview: store.settings.value.enablePreview,
      chapters: store.settings.value.chapters
    }
    const configStr = JSON.stringify(config).replace(/"/g, '&quot;')
    return `
      <style>
        .video-chapter-player {
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          margin-bottom: 35px;
          position: relative;
          max-width: 100%;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .video-wrapper {
          flex: 2;
          min-width: 300px;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .video-wrapper video {
          width: 100%;
          display: block;
        }

        .chapter-list {
          flex: 1;
          min-width: 250px;
          max-height: 400px;
          background: white;
          border-radius: 8px;
          padding: 20px;
          overflow-y: auto;
        }

        .chapter-list h2 {
          margin: 0 0 20px;
          font-size: 1.5rem;
          color: #2c3e50;
        }

        .chapters {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chapter {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .chapter:hover {
          background: #f1f3f5;
          border-left-color: #2196f3;
        }

        .chapter.active {
          background: #e3f2fd;
          border-left-color: #2196f3;
        }

        .chapter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .chapter-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #2c3e50;
        }

        .timestamp {
          font-family: monospace;
          color: #666;
        }

        .description {
          margin: 4px 0 0;
          font-size: 0.875rem;
          color: #666;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .video-chapter-player {
            flex-direction: column;
          }
          
          .video-wrapper,
          .chapter-list {
            flex: none;
            width: 100%;
          }
        }
      </style>
      <div class="video-chapter-player" id="chapter-player-${Date.now()}" data-config="${configStr}"></div>
    `
  })

  const js = computed(() => {
    return `
    // Video Chapter Player Widget
    (function() {
      // First, include the entire VideoChapterPlayer class implementation
      class VideoChapterPlayer {
        constructor(elementId, config) {
          this.container = document.getElementById(elementId);
          this.config = config;
          this.videoElement = null;
          this.chapterList = null;
          this.currentTime = 0;
          this.duration = 0;
          this.isPlaying = false;
          
          this.init();
        }

        init() {
          // Create video player HTML
          this.container.innerHTML = \`
            <div class="video-wrapper">
              <video src="\${this.config.videoUrl}" poster="\${this.config.posterUrl || ''}" controls>
                Your browser does not support the video tag.
              </video>
            </div>
            <div class="chapter-list">
              <h2 style="display: \${this.config.hideChapterListTitle ? 'none' : 'block'}">\${this.config.chapterListTitle}</h2>
              <div class="chapters">
                \${this.renderChapters()}
              </div>
            </div>
          \`;

          // Get elements
          this.videoElement = this.container.querySelector('video');
          this.chapterList = this.container.querySelector('.chapter-list');

          // Add event listeners
          this.addEventListeners();
        }

        renderChapters() {
          if (!this.config.chapters || !this.config.chapters.length) {
            return '<p>No chapters available</p>';
          }

          return this.config.chapters
            .map(chapter => \`
              <div class="chapter" data-time="\${chapter.timestamp}">
                <div class="chapter-header">
                  <h3>\${chapter.title}</h3>
                  <span class="timestamp">\${this.formatTime(chapter.timestamp)}</span>
                </div>
                \${chapter.description ? \`<p class="description">\${chapter.description}</p>\` : ''}
              </div>
            \`)
            .join('');
        }

        addEventListeners() {
          if (!this.videoElement) return;

          // Video events
          this.videoElement.addEventListener('timeupdate', () => {
            this.currentTime = this.videoElement.currentTime;
            this.updateActiveChapter();
          });

          this.videoElement.addEventListener('loadedmetadata', () => {
            this.duration = this.videoElement.duration;
          });

          // Chapter click events
          this.container.querySelectorAll('.chapter').forEach(chapter => {
            chapter.addEventListener('click', () => {
              const time = parseFloat(chapter.dataset.time);
              if (this.videoElement) {
                this.videoElement.currentTime = time;
                if (this.videoElement.paused) {
                  this.videoElement.play();
                }
              }
            });
          });
        }

        updateActiveChapter() {
          const chapters = this.container.querySelectorAll('.chapter');
          chapters.forEach(chapter => {
            const time = parseFloat(chapter.dataset.time);
            const isActive = this.currentTime >= time;
            chapter.classList.toggle('active', isActive);
          });
        }

        formatTime(seconds) {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          if (h > 0) {
            return \`\${h}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
          }
          return \`\${m}:\${s.toString().padStart(2, '0')}\`;
        }
      }

      // Initialize players
      function initPlayer(element) {
        if (!element.id) {
          element.id = 'chapter-player-' + Date.now();
        }
        
        let config = null;
        if (element.dataset.config) {
          try {
            config = JSON.parse(element.dataset.config.replace(/&quot;/g, '"'));
            new VideoChapterPlayer(element.id, config);
          } catch (error) {
            console.error('Error initializing video chapter player:', error);
            element.innerHTML = '<p>Error: Invalid player configuration</p>';
          }
        }
      }

      function initializePlayers() {
        document.querySelectorAll('.video-chapter-player').forEach(initPlayer);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlayers);
      } else {
        initializePlayers();
      }
    })();
    `
  })

  return {
    htmlPreview,
    js
  }
}