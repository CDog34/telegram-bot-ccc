import { config } from '../../config'
import { handlePhoto } from './photo'

export async function handleSingleMessage (msgWrapper): Promise<number> {
  const { update_id, message } = msgWrapper
  if (!message) {
    return update_id
  }
  const { from, text, entities, photo } = message
  if (!from || from.id !== config.myId) {
    return update_id
  }
  if (photo) {
    await handlePhoto(photo)
  } else {
    console.log(text, entities)
  }

  return update_id
}
