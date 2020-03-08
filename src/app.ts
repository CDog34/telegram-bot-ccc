import { Api } from './modules/api'
import { handleSingleMessage } from './modules/messageHandler'

async function main () {
  let loopCallUpdate = async id => {
    let nextId = id
    try {
      const res = await Api.getTelegramUpdate({
        timeout: 20,
        offset: id || 0
      })
      const updateIds = await Promise.all<number>(res.map(handleSingleMessage))
      if (updateIds.length) {
        nextId = updateIds.reduce((pv, cv) => cv > pv ? cv : pv) + 1
      }
    } catch (e) {
      console.error(e)
    }
    await loopCallUpdate(nextId)
  }
  await loopCallUpdate(0)
}


main().catch(console.error)
