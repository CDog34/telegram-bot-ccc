export const config = {
  appKey: process.env.BOT_KEY as string,
  myId: parseInt(process.env.MY_ID, 0) || 0,
  pollingTimeout: parseInt(process.env.POLLING_TIMEOUT) || 20,
  apiRetryLimit: parseInt(process.env.API_RETRY_LIMIT) || 1,
  fileStoragePrefix: process.env.FILE_STORAGE || './storage'
}
