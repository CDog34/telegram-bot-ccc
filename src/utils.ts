import { config } from './config'

interface IExecutorParams {
  limit: number,
  current: number
}

export async function callWithRetry<T> (
    executor: (param: IExecutorParams) => Promise<T>, retryTimes: number = config.apiRetryLimit
): Promise<T> {
  let isSucceed = false
  let tryCount = 0
  let result = null
  while (!isSucceed) {
    try {
      tryCount++
      result = await executor({ current: tryCount, limit: retryTimes })
      isSucceed = true
    } catch (e) {
      console.warn('Error Occur:', e)
      if (tryCount >= config.apiRetryLimit) {
        throw e
      }
    }
  }
  return result
}
