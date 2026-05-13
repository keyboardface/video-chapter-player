`<template>
  <div class="chapter-list">
    <h2 v-if="!store.settings.value.hideChapterListTitle">
      {{ store.settings.value.chapterListTitle }}
    </h2>
    
    <div v-if="!store.settings.value.chapters.length" class="empty-state">
      <p>No chapters added for this video.</p>
    </div>
    
    <div v-else class="chapters">
      <div
        v-for="chapter in store.settings.value.chapters"
        :key="chapter.id"
        class="chapter-item"
        :class="{ active: isChapterActive(chapter) }"
        @click="seekToChapter(chapter)"
      >
        <div class="chapter-header">
          <h3>{{ chapter.title }}</h3>
          <span class="timestamp">{{ formatTime(chapter.timestamp) }}</span>
        </div>
        <p v-if="chapter.description" class="description">
          {{ chapter.description }}
        </p>
        <div
          v-if="isChapterActive(chapter)"
          class="progress-bar"
          :style="{ width: getChapterProgress(chapter) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useStore from '../store'
import type { Chapter } from '../store'

const store = useStore()

const isChapterActive = (chapter: Chapter) => {
  const currentTime = store.currentTime.value
  const nextChapter = store.settings.value.chapters.find(
    ch => ch.timestamp > chapter.timestamp
  )
  const endTime = nextChapter ? nextChapter.timestamp : store.duration.value
  
  return currentTime >= chapter.timestamp && currentTime < endTime
}

const getChapterProgress = (chapter: Chapter) => {
  if (!isChapterActive(chapter)) return 0
  
  const currentTime = store.currentTime.value
  const nextChapter = store.settings.value.chapters.find(
    ch => ch.timestamp > chapter.timestamp
  )
  const endTime = nextChapter ? nextChapter.timestamp : store.duration.value
  const duration = endTime - chapter.timestamp
  
  return ((currentTime - chapter.timestamp) / duration) * 100
}

const seekToChapter = (chapter: Chapter) => {
  if (!store.videoElement.value) return
  store.videoElement.value.currentTime = chapter.timestamp
  if (store.videoElement.value.paused) {
    store.videoElement.value.play()
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
.chapter-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

h2 {
  margin: 0 0 20px;
  font-size: 1.5rem;
  color: #2c3e50;
}

.empty-state {
  color: #666;
  text-align: center;
  padding: 20px;
}

.chapters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  position: relative;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  overflow: hidden;
}

.chapter-item:hover {
  background: #f1f3f5;
  border-left-color: #2196f3;
}

.chapter-item.active {
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

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #2196f3;
  transition: width 0.2s;
}
</style>`