`<template>
  <div class="video-player">
    <video
      ref="videoRef"
      :src="store.settings.value.videoUrl"
      :poster="store.settings.value.posterUrl"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @loadedmetadata="onLoadedMetadata"
      @volumechange="onVolumeChange"
      @ratechange="onRateChange"
      @enterpictureinpicture="onEnterPiP"
      @leavepictureinpicture="onLeavePiP"
    >
      Your browser does not support the video tag.
    </video>

    <!-- Big play button overlay -->
    <div class="big-play-button" v-show="!store.isPlaying.value" @click="togglePlay">
      <n-icon size="48">
        <PlayCircleOutline />
      </n-icon>
    </div>

    <!-- Video controls -->
    <div class="video-controls">
      <div class="timeline">
        <div class="progress" :style="{ width: progressPercent + '%' }"></div>
        <input
          type="range"
          min="0"
          :max="store.duration.value"
          :value="store.currentTime.value"
          @input="onSeek"
          step="0.1"
        >
      </div>

      <div class="controls-bar">
        <div class="left-controls">
          <n-button quaternary circle @click="togglePlay">
            <n-icon>
              <component :is="store.isPlaying.value ? PauseOutline : PlayOutline" />
            </n-icon>
          </n-button>
          <n-button quaternary circle @click="skipToNextChapter">
            <n-icon><PlaySkipForwardOutline /></n-icon>
          </n-button>
          <span class="time-display">
            {{ formatTime(store.currentTime.value) }} / {{ formatTime(store.duration.value) }}
          </span>
        </div>

        <div class="right-controls">
          <n-button quaternary circle @click="toggleMute">
            <n-icon>
              <component :is="store.isMuted.value ? VolumeOffOutline : VolumeHighOutline" />
            </n-icon>
          </n-button>
          <n-slider
            v-model:value="store.volume.value"
            :min="0"
            :max="1"
            :step="0.1"
            style="width: 80px"
          />
          <n-dropdown
            trigger="click"
            :options="speedOptions"
            @select="setPlaybackRate"
          >
            <n-button quaternary>{{ store.playbackRate.value }}x</n-button>
          </n-dropdown>
          <n-button
            v-if="isPiPSupported"
            quaternary
            circle
            @click="togglePiP"
          >
            <n-icon><PlayOutline /></n-icon>
          </n-button>
          <n-button quaternary circle @click="toggleFullscreen">
            <n-icon>
              <component :is="store.isFullscreen.value ? ContractOutline : ExpandOutline" />
            </n-icon>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  PlayCircleOutline,
  PlayOutline,
  PauseOutline,
  PlaySkipForwardOutline,
  VolumeHighOutline,
  VolumeOffOutline,
  ExpandOutline,
  ContractOutline
} from '@vicons/ionicons5'
import useStore from '../store'

const store = useStore()
const videoRef = ref<HTMLVideoElement | null>(null)

const isPiPSupported = computed(() => 'pictureInPictureEnabled' in document)

const progressPercent = computed(() => {
  if (!store.duration.value) return 0
  return (store.currentTime.value / store.duration.value) * 100
})

const speedOptions = [
  { label: '0.5x', key: 0.5 },
  { label: '0.75x', key: 0.75 },
  { label: '1x', key: 1 },
  { label: '1.25x', key: 1.25 },
  { label: '1.5x', key: 1.5 },
  { label: '2x', key: 2 }
]

onMounted(() => {
  if (videoRef.value) {
    store.videoElement.value = videoRef.value
  }
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
  } else {
    videoRef.value.pause()
  }
}

const onPlay = () => {
  store.isPlaying.value = true
}

const onPause = () => {
  store.isPlaying.value = false
}

const onTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  store.currentTime.value = video.currentTime
}

const onLoadedMetadata = (event: Event) => {
  const video = event.target as HTMLVideoElement
  store.duration.value = video.duration
}

const onVolumeChange = (event: Event) => {
  const video = event.target as HTMLVideoElement
  store.volume.value = video.volume
  store.isMuted.value = video.muted
}

const onRateChange = (event: Event) => {
  const video = event.target as HTMLVideoElement
  store.playbackRate.value = video.playbackRate
}

const onEnterPiP = () => {
  store.isPiPActive.value = true
}

const onLeavePiP = () => {
  store.isPiPActive.value = false
}

const onSeek = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (videoRef.value) {
    videoRef.value.currentTime = Number(input.value)
  }
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
}

const setPlaybackRate = (rate: number) => {
  if (!videoRef.value) return
  videoRef.value.playbackRate = rate
}

const togglePiP = async () => {
  if (!videoRef.value) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await videoRef.value.requestPictureInPicture()
    }
  } catch (error) {
    console.error('PiP error:', error)
  }
}

const toggleFullscreen = async () => {
  if (!videoRef.value) return
  try {
    if (!document.fullscreenElement) {
      await videoRef.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error('Fullscreen error:', error)
  }
}

const onFullscreenChange = () => {
  store.isFullscreen.value = !!document.fullscreenElement
}

const skipToNextChapter = () => {
  if (!videoRef.value) return
  const currentTime = videoRef.value.currentTime
  const nextChapter = store.settings.value.chapters.find(
    chapter => chapter.timestamp > currentTime
  )
  if (nextChapter) {
    videoRef.value.currentTime = nextChapter.timestamp
  }
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

video {
  width: 100%;
  display: block;
}

.big-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  color: white;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.big-play-button:hover {
  opacity: 1;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.video-player:hover .video-controls {
  opacity: 1;
}

.timeline {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  margin-bottom: 10px;
}

.progress {
  position: absolute;
  height: 100%;
  background: #2196f3;
  pointer-events: none;
}

.timeline input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-display {
  font-family: monospace;
  margin: 0 8px;
}
</style>`