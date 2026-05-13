import Postmate from 'postmate'
import { cloneDeep } from 'lodash-es'
import useStore from '../store'
import { useTranspiler } from './useTranspiler'

const handshake = new Postmate.Model({})

export const usePostmate = () => {
  const store = useStore()
  const { htmlPreview, js } = useTranspiler()

  const emitCode = () => {
    if (!handshake) return
    handshake?.then(async (parent: any) => {
      console.info('Emitting code to parent')
      parent?.emit('code', {
        html: htmlPreview.value,
        js: js.value,
        elementStore: cloneDeep({
          videoUrl: store.settings.value.videoUrl,
          posterUrl: store.settings.value.posterUrl,
          chapterListTitle: store.settings.value.chapterListTitle,
          hideChapterListTitle: store.settings.value.hideChapterListTitle,
          enablePreview: store.settings.value.enablePreview,
          chapters: store.settings.value.chapters
        })
      })
    })
  }

  return {
    handshake,
    emitCode
  }
}
