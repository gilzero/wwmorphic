// file: lib/agents/query-suggestor.tsx
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamObject } from 'ai'
import { PartialRelated, relatedSchema } from '@/lib/schema/related'
import SearchRelated from '@/components/search-related'
import { getModel } from '../utils'
import { SYSTEM_PROMPT_QUERY_SUGGESTOR } from '../prompts'

const SYSTEM_PROMPT = SYSTEM_PROMPT_QUERY_SUGGESTOR

export async function querySuggestor(
    uiStream: ReturnType<typeof createStreamableUI>,
    messages: CoreMessage[]
) {
  console.log('[INFO] Query Suggestor function invoked')
  const objectStream = createStreamableValue<PartialRelated>()
  uiStream.append(<SearchRelated relatedQueries={objectStream.value} />)

  const lastMessages = messages.slice(-1).map(message => {
    return {
      ...message,
      role: 'user'
    }
  }) as CoreMessage[]

  let finalRelatedQueries: PartialRelated = {}
  await streamObject({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: lastMessages,
    schema: relatedSchema
  })
      .then(async result => {
        for await (const obj of result.partialObjectStream) {
          if (obj.items) {
            objectStream.update(obj)
            finalRelatedQueries = obj
          }
        }
      })
      .finally(() => {
        objectStream.done()
      })

  return finalRelatedQueries
}