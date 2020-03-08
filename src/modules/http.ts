import { IncomingHttpHeaders } from 'http'
import { request, RequestOptions } from 'https'
import { config } from '../config'

export interface IRequestOptions {
  [key: string]: string | number
}

export interface IHttpRawResponse {
  statusCode: number,
  headers: IncomingHttpHeaders,
  data: string
}

export abstract class Http {
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
      const req = request(url, options)
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

  public static async requestTelegramApi (methodName: string, appKey: string, options: IRequestOptions, httpOptions?: RequestOptions) {
    if (!appKey) {
      throw new Error('Invalid AppKey!')
    }
    const url = this._getTelegramApiUrl(appKey, methodName, options)
    let triedTimes = 0
    let isSucceed = false
    let data
    while (!isSucceed) {
      try {
        data = await this._doRequest(
            url,
            httpOptions || {}
        )
        isSucceed = true
      } catch (e) {
        triedTimes++
        if (triedTimes >= config.apiRetryLimit) {
          throw e
        }
        console.warn(`Request to ${url} fail. Retrying (${triedTimes}/${config.apiRetryLimit})`)
      }
    }
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
}
