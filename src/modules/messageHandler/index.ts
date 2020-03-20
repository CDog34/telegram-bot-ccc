import { config } from '../../config'
import { downloadTelegramImageFileById, HandlePixivImage, handleTelegramPhoto, handleTwitterImages } from './photo'
import { getPixivId, twitterStatusRegExp } from '../../modules/clawer'

export async function handleSingleMessage (msgWrapper): Promise<number> {
  const { update_id, message } = msgWrapper
  if (!message) {
    return update_id
  }
  const { from, photo, document, text, caption } = message

  const isDocumentImage = document && document.mime_type.indexOf('image/') === 0

  if (!from || from.id !== config.myId) {
    return update_id
  }
  if (caption && getPixivId(caption)) {
    await HandlePixivImage(caption)
  } else if (text && getPixivId(text)) {
    await HandlePixivImage(text)
  } else if (twitterStatusRegExp.test(text)) {
    await handleTwitterImages(text)
  } else if (isDocumentImage) {
    await downloadTelegramImageFileById(document.file_id)
  } else if (photo) {
    await handleTelegramPhoto(photo)
  } else {
    console.log(message)
  }

  return update_id
}
