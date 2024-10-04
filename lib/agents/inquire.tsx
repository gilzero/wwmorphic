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
    console.log('[DEBUG] Initial messages:', messages)
    console.log('[DEBUG] System prompt:', SYSTEM_PROMPT)

    await streamObject({
        model: getModel(),
        system: SYSTEM_PROMPT,
        messages,
        schema: inquirySchema
    })
        .then(async result => {
            console.log('[INFO] Stream object result received')
            for await (const obj of result.partialObjectStream) {
                // console.log('[DEBUG] Partial object received:', obj)
                if (obj) {
                    objectStream.update(obj)
                    finalInquiry = obj
                }
            }
        })
        .catch(error => {
            console.error('[ERROR] Error while streaming object:', error)
        })
        .finally(() => {
            console.log('[INFO] Stream object processing completed')
            objectStream.done()
        })

    console.log('[DEBUG] Final inquiry:', finalInquiry)
    return finalInquiry
}