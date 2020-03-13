import { Api } from '../api'
import { config } from '../../config'
import { join } from 'path'
import { Http } from '../../modules/http'
import { promisify } from 'util'
import { access, mkdir } from 'fs'

export async function handlePhoto (photos) {
  if (!photos || !photos.length) {
    return
  }
  const photo = photos.reduce((pi, ci) => pi.width > ci.width ? pi : ci)
  downloadImageFileById(photo.file_id).catch(console.error)
}

export async function downloadImageFileById (fileId: string) {
  const file = await getDownloadUrl(fileId)
  await downloadImage(file)
}

async function getDownloadUrl (fileId: string): Promise<string> {
  try {
    const file = await Api.getFile({ fileId })
    return `https://api.telegram.org/file/bot${config.appKey}/${file.file_path}`
  } catch (e) {
    console.error('getFileError', e)
    return null
  }
}

async function downloadImage (targetUrl) {
  const urlPath = targetUrl.split('/')
  const localDir = join(config.fileStoragePrefix, 'tg-bot', 'image')
  await chkAndMkDir(localDir)
  const localPath = join(localDir, `${config.appKey.substr(-8)}_${urlPath[urlPath.length - 1]}`)
  let isSucceed = false
  let tryCount = 0
  while (!isSucceed) {
    try {
      console.log(`Saving file ${targetUrl} to ${localPath}.`)
      await Http.downloadFile(targetUrl, localPath)
      isSucceed = true
    } catch (e) {
      tryCount++
      if (tryCount >= config.apiRetryLimit) {
        throw e
      }
      console.warn(`Request to ${targetUrl} fail. Retrying (${tryCount}/${config.apiRetryLimit})`)
    }
  }
}

async function chkAndMkDir (dir: string) {
  try {
    await promisify(access)(dir)
  } catch (e) {
    await promisify(mkdir)(dir, { recursive: true })
  }
}
