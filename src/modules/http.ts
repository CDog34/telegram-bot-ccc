import { get as httpGet, IncomingHttpHeaders } from 'http'
import { get, RequestOptions } from 'https'
import { createWriteStream, unlink } from 'fs'
import { callWithRetry } from '../utils'

export interface IRequestOptions {
  [key: string]: string | number
}

export interface IHttpRawResponse {
  statusCode: number,
  headers: IncomingHttpHeaders,
  data: string
}


export abstract class Http {
  public static downloadFile (url: string, localFilePath: string, referer: string = '') {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const handleFunction = urlObj.protocol.indexOf('https') !== -1 ? get : httpGet
      const file = createWriteStream(localFilePath)
      const req = handleFunction(url, { headers: { referer } }, (res) => {
        res.pipe(file)
        file.once('finish', () => {
          file.close()
          resolve()
        })
      })
      req.once('error', (e) => {
        unlink(localFilePath, () => reject(e))
      })
    })
  }

  public static async requestTelegramApi (methodName: string, appKey: string, options: IRequestOptions, httpOptions?: RequestOptions) {
    if (!appKey) {
      throw new Error('Invalid AppKey!')
    }
    const url = this._getTelegramApiUrl(appKey, methodName, options)
    let data = {} as IHttpRawResponse
    await callWithRetry(async ({ current, limit }) => {
      if (current > 1) {
        console.log(`Calling ${url}. (${current}/${limit})`)
      }
      data = await this._doRequest(
          url,
          httpOptions || {}
      )
    })
    if (data.statusCode !== 200) {
      throw new Error('Server return invalid status code: ' + data.statusCode + '\n' + data.data)
    }
    let dataObj
    try {
      dataObj = JSON.parse(data.data)
    } catch (e) {
      throw new Error('Response parse fail: ' + e)
    }
    if (!dataObj.ok) {
      throw new Error('Telegram business fail: ' + data.data)
    }
    return dataObj.result
  }

  public static browserGet (url, options: RequestOptions = {}): Promise<IHttpRawResponse> {
    const finalOptions = Object.assign<{}, RequestOptions, RequestOptions>({}, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
      }
    }, options)
    return this._doRequest(url, finalOptions)
  }

  private static _getTelegramApiUrl (appKey: string,
                                     methodName: string,
                                     options: { [key: string]: string | number } = {}
  ): string {
    return `https://api.telegram.org/bot${appKey}/${methodName}?${Object.keys(options)
        .map(key => `${key}=${options[key]}`)
        .join('&')}`
  }

  private static _doRequest (url, options: RequestOptions = {}): Promise<IHttpRawResponse> {
    return new Promise<IHttpRawResponse>((resolve, reject) => {
      const urlObj = new URL(url)
      const handleFunction = urlObj.protocol.indexOf('https') !== -1 ? get : httpGet
      const req = handleFunction(url, options)
      const responseEventHandler = res => {
        let dataChunk = ''
        const resChunkHandler = (chunk) => dataChunk += chunk
        res.setTimeout(0)
        res.setEncoding('utf8')
        res.once('error', (e) => {
          res.off('data', resChunkHandler)
          reject(e)
        })
        res.on('data', resChunkHandler)
        res.once('end', () => {
          res.off('data', resChunkHandler)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: dataChunk
          })
        })
      }
      req.once('response', responseEventHandler)
      req.once('error', (e) => {
        req.off('response', responseEventHandler)
        reject(e)
      })
      req.end()
    })
  }
}
