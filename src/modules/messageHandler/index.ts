import { config } from '../../config'
import { downloadImageFileById, handlePhoto } from './photo'

export async function handleSingleMessage (msgWrapper): Promise<number> {
  const { update_id, message } = msgWrapper
  if (!message) {
    return update_id
  }
  const { from, photo, document } = message

  const isDocumentImage = document && document.mime_type.indexOf('image/') === 0

  if (!from || from.id !== config.myId) {
    return update_id
  }
  if (isDocumentImage) {
    await downloadImageFileById(document.file_id)
  } else if (photo) {
    await handlePhoto(photo)
  } else {
    console.log(message)
  }

  return update_id
}
