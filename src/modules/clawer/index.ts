import { Browser, launch } from 'puppeteer'

let browser: Browser = null
let browserCloseTimeoutTimer = null
export const twitterStatusRegExp = /twitter.com\/.+\/status\/(\d+)/
export const pixivUrlArtworkRegExp = /pixiv.net\/artworks\/(\d+)/
export const pixivUrlIRegExp = /pixiv.net\/i\/(\d+)/
export const pixivHashTagRegExp = /#pixiv id=(\d+)/

const pixivRegExps = [
  pixivUrlArtworkRegExp,
  pixivUrlIRegExp,
  pixivHashTagRegExp
]

export function getPixivId (data: string): number {
  let id = 0
  pixivRegExps.some(regExp => {
    const match = data.match(regExp)
    if (match && match.length > 1) {
      id = parseInt(match[1], 0)
      return true
    }
    return false
  })
  return id
}

function closeBrowser () {
  clearTimeout(browserCloseTimeoutTimer)
  browserCloseTimeoutTimer = setTimeout(async () => {
    await browser.close()
    browser = null
  }, 60000)
}

async function createBrowser () {
  clearTimeout(browserCloseTimeoutTimer)
  if (!browser) {
    browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions', '--disable-dev-shm-usage', '--disable-gpu'] })
  }
}

export async function getTwitterStatusImages (url: string): Promise<string[]> {
  const match = url.match(twitterStatusRegExp)
  if (!match || match.length < 2) {
    return []
  }
  const id = match[1]
  await createBrowser()
  const p = await browser.newPage()
  let resolve
  let reject
  const pro = new Promise<string[]>((res, rej) => {
    resolve = (...args) => {
      closeBrowser()
      res.apply(null, args)
    }
    reject = (...args) => {
      closeBrowser()
      rej.apply(null, args)
    }
  })
  const timeoutTimer = setTimeout(async () => {
    await p.close()
    resolve([])
  }, 60000)
  p.on('response', async res => {
    if (res.url().indexOf(`${id}.json`) !== -1 && res.request().method() === 'GET') {
      clearTimeout(timeoutTimer)
      try {
        const json = await res.json()
        const targetTweet = json['globalObjects'].tweets[id]
        const media = targetTweet.entities.media
        const result: string[] = media
            .filter(item => item.media_url_https || item.media_url)
            .map(item => `${item.media_url_https || item.media_url}?name=orig`)
        console.log('Get twitter images:', result)
        resolve(result)
      } catch (e) {
        console.warn(`Data grab fail for (${p.url()}) failed: `, e)
        reject(e)
      }
      await p.close()
    }
  })
  p.on('error', async e => {
    console.error('PPTR Error:', e)
    clearTimeout(timeoutTimer)
    await p.close()
    reject(e)
  })
  const urlObj = new URL(url)
  urlObj.search = ''
  await p.goto(urlObj.href)

  return pro
}
