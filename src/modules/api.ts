import { Http } from './http'
import { config } from '../config'

export abstract class Api {
  static async getTelegramUpdate ({
                                    timeout,
                                    offset
                                  }: { timeout?: number, offset?: number }): Promise<any> {
    return Http.requestTelegramApi('getUpdates',
        config.appKey,
        { timeout: timeout || 0, offset },
        { timeout: timeout ? (timeout + 1) * 1000 : 5000 }
    )
  }

  static async getFile ({
                          fileId
                        }: { fileId: string }) {
    return Http.requestTelegramApi('getFile', config.appKey, { file_id: fileId })
  }
}
