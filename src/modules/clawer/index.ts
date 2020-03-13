import { Browser, launch } from 'puppeteer'

let browser: Browser = null
export const twitterStatusRegExp = /twitter.com\/.+\/status\/(\d+)/

export async function getTwitterStatusImages (url: string): Promise<string[]> {
  const match = url.match(twitterStatusRegExp)
  if (!match || match.length < 2) {
    return []
  }
  const id = match[1]
  if (!browser) {
    browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions', '--disable-dev-shm-usage', '--disable-gpu'] })
  }
  const p = await browser.newPage()
  let resolve
  let reject
  const pro = new Promise<string[]>((res, rej) => {
    resolve = res
    reject = rej
  })
  const timeout = setTimeout(async () => {
    await p.close()
    resolve([])
  }, 60000)
  p.on('response', async res => {
    if (res.url().indexOf(`${id}.json`) !== -1 && res.request().method() === 'GET') {
      try {
        const json = await res.json()
        clearTimeout(timeout)
        const targetTweet = json['globalObjects'].tweets[id]
        const media = targetTweet.entities.media
        const result: string[] = media
            .filter(item => item.media_url_https || item.media_url)
            .map(item => `${item.media_url_https || item.media_url}?name=orig`)
        console.log('Get twitter images:', result)
        resolve(result)
      } catch (e) {
        console.warn(e)
        reject(e)
      }
      await p.close()
    }
  })
  const urlObj = new URL(url)
  urlObj.search=''
  await p.goto(urlObj.href)

  return pro
}
