import { ref } from 'vue'

export interface Chapter {
  id: string
  title: string
  timestamp: number
  description?: string
}

export interface VideoSettings {
  videoUrl: string
  posterUrl: string
  chapterListTitle: string
  hideChapterListTitle: boolean
  enablePreview: boolean
  chapters: Chapter[]
}

const defaultSettings: VideoSettings = {
  videoUrl: '',
  posterUrl: '',
  chapterListTitle: 'Chapters 📖',
  hideChapterListTitle: false,
  enablePreview: true,
  chapters: []
}

export default function useStore() {
  const settings = ref<VideoSettings>({ ...defaultSettings })
  const videoElement = ref<HTMLVideoElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const playbackRate = ref(1)
  const isFullscreen = ref(false)
  const isPiPActive = ref(false)

  const updateSettings = (newSettings: Partial<VideoSettings>) => {
    settings.value = {
      ...settings.value,
      ...newSettings
    }
  }

  const getCurrentChapter = () => {
    if (!settings.value.chapters.length) return null
    const time = currentTime.value
    return [...settings.value.chapters]
      .reverse()
      .find(chapter => time >= chapter.timestamp)
  }

  return {
    settings,
    videoElement,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    isPiPActive,
    updateSettings,
    getCurrentChapter
  }
}