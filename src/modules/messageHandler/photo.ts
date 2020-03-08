import { Api } from '../api'
import { config } from '../../config'

export async function handlePhoto (photos) {
  if (!photos || !photos.length) {
    return
  }
  const photo = photos.reduce((pi, ci) => pi.width > ci.width ? pi : ci)
  const file = await handleSinglePhoto(photo.file_id)
  console.log(file)
}

async function handleSinglePhoto (photoId: string) {
  try {
    const file = await Api.getFile({ fileId: photoId })
    return `https://api.telegram.org/file/bot${config.appKey}/${file.file_path}`
  } catch (e) {
    console.error('getFileError', e)
    return null
  }
}
