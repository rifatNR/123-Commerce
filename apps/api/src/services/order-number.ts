import { collections } from '../db/collections'

const START_AT = 10000

/** Short, sequential, easy to read over the phone (e.g. "10042"). */
export const nextOrderNumber = async () => {
  const doc = await collections
    .counters()
    .findOneAndUpdate(
      { _id: 'order' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    )
  return String(START_AT + (doc?.seq ?? 1))
}
