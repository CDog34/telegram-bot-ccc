import { Api } from '../api'
import { config } from '../../config'
import { join } from 'path'
import { Http } from '../../modules/http'
import { promisify } from 'util'
import { access, mkdir } from 'fs'
import { getPixivId, getTwitterStatusImages } from '../../modules/clawer'
import { callWithRetry } from '../../utils'

export async function handleTelegramPhoto (photos) {
  if (!photos || !photos.length) {
    return
  }
  const photo = photos.reduce((pi, ci) => pi.width > ci.width ? pi : ci)
  downloadTelegramImageFileById(photo.file_id).catch(console.error)
}

export async function handleTwitterImages (message: string) {
  try {
    let imgs = []
    await callWithRetry(async () => {
      imgs = await getTwitterStatusImages(message)
    })
    if (!imgs || !imgs.length) {
      return
    }
    return await Promise.all(imgs.map(i => downloadTwitterImage(i)))
  } catch (e) {
    console.warn(e)
  }
}


export async function HandlePixivImage (message: string) {
  try {
    const id = getPixivId(message)
    const url = await callWithRetry<string>(() => getPixivImageUrl(id))
    if (!url) {
      console.warn('Empty Pixiv image url for: ' + message)
      return
    }
    await downloadPixivImage(url, `https://pixiv.net/i/${id}`)
  } catch (e) {
    console.warn(e)
  }
}

export async function getPixivImageUrl (id: number) {
  const { statusCode, data } = await Http.browserGet(`https://www.pixiv.net/ajax/illust/${id}`)
  if (statusCode !== 200) {
    throw new Error('Pixiv Server return code: ' + statusCode)
  }
  const json = JSON.parse(data)
  return json.body.urls.original
}

export async function downloadTelegramImageFileById (fileId: string) {
  const file = await getTelegramDownloadUrl(fileId)
  await downloadImage(file)
}

async function getTelegramDownloadUrl (fileId: string): Promise<string> {
  try {
    const file = await Api.getFile({ fileId })
    return `https://api.telegram.org/file/bot${config.appKey}/${file.file_path}`
  } catch (e) {
    console.error('getFileError', e)
    return null
  }
}

async function downloadImage (targetUrl, filenamePrefix: string = config.appKey.substr(-8), referer: string = '') {
  const urlPath = targetUrl.split('/')
  const localDir = join(config.fileStoragePrefix, 'tg-bot', 'image')
  await chkAndMkDir(localDir)
  const localPath = join(localDir, `${filenamePrefix}_${urlPath[urlPath.length - 1]}`)
  await callWithRetry(async ({ current, limit }) => {
    console.log(`Saving file ${targetUrl} to ${localPath}. (${current}/${limit})`)
    await Http.downloadFile(targetUrl, localPath, referer)
  })
}

async function chkAndMkDir (dir: string) {
  try {
    await promisify(access)(dir)
  } catch (e) {
    await promisify(mkdir)(dir, { recursive: true })
  }
}


function downloadTwitterImage (targetUrl) {
  return downloadImage(targetUrl, 'twi')
}

async function downloadPixivImage (targetUrl, referer: string = '') {
  return downloadImage(targetUrl, 'pix', referer)
}
