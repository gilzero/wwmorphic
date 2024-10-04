// file: lib/agents/inquire.tsx
import { Copilot } from '@/components/copilot'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamObject } from 'ai'
import { PartialInquiry, inquirySchema } from '@/lib/schema/inquiry'
import { getModel } from '../utils'
import { SYSTEM_PROMPT_INQUIRE } from '../prompts'

const SYSTEM_PROMPT = SYSTEM_PROMPT_INQUIRE

export async function inquire(
    uiStream: ReturnType<typeof createStreamableUI>,
    messages: CoreMessage[]
) {
  console.log('[INFO] Inquire function invoked')
  const objectStream = createStreamableValue<PartialInquiry>()
  uiStream.update(<Copilot inquiry={objectStream.value} />)

  let finalInquiry: PartialInquiry = {}
  await streamObject({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages,
    schema: inquirySchema
  })
      .then(async result => {
        for await (const obj of result.partialObjectStream) {
          if (obj) {
            objectStream.update(obj)
            finalInquiry = obj
          }
        }
      })
      .finally(() => {
        objectStream.done()
      })

  return finalInquiry
}