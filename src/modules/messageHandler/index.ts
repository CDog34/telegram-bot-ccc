import { config } from '../../config'
import { downloadTelegramImageFileById, HandlePixivImage, handleTelegramPhoto, handleTwitterImages } from './photo'
import { getPixivId, twitterStatusRegExp } from '../../modules/clawer'
import { AsyncQueue } from 'src/modules/asyncQueue'

const asyncQueue = new AsyncQueue()

export async function handleSingleMessage (msgWrapper): Promise<number> {
  const { update_id, message } = msgWrapper
  if (!message) {
    return update_id
  }
  const { from, photo, document, text, caption } = message

  const isDocumentImage = document && document.mime_type.indexOf('image/') === 0
  const urlText = caption || text

  if (!from || from.id !== config.myId) {
    return update_id
  }
  if (urlText && getPixivId(urlText)) {
    asyncQueue.addTask(() => HandlePixivImage(urlText))
  } else if (twitterStatusRegExp.test(urlText)) {
    asyncQueue.addTask(() => handleTwitterImages(urlText))
  } else if (isDocumentImage) {
    asyncQueue.addTask(() => downloadTelegramImageFileById(document.file_id))
  } else if (photo) {
    asyncQueue.addTask(() => handleTelegramPhoto(photo))
  } else {
    console.log(message)
  }

  return update_id
}
