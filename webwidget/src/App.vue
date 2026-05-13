`<template>
  <n-config-provider :theme="darkTheme">
    <div class="app">
      <div class="video-section">
        <VideoPlayer />
      </div>
      <div class="chapters-section">
        <ChapterList />
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { darkTheme } from 'naive-ui'
import VideoPlayer from './components/VideoPlayer.vue'
import ChapterList from './components/ChapterList.vue'
import { usePostmate } from './composition/usePostmate'

const { handshake, emitCode } = usePostmate()

onMounted(() => {
  // Initialize Postmate communication
  handshake.then(() => {
    emitCode()
  })
})
</script>

<style>
.app {
  display: flex;
  gap: 24px;
  padding: 24px;
  min-height: 100vh;
  background: #f8f9fa;
}

.video-section {
  flex: 2;
  min-width: 0;
}

.chapters-section {
  flex: 1;
  min-width: 300px;
}

@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }
  
  .chapters-section {
    min-width: 0;
  }
}
</style>`