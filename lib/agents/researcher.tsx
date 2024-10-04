// file: lib/agents/researcher.tsx
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, generateText, streamText } from 'ai'
import { getTools } from './tools'
import { getModel } from '../utils'
import { AnswerSection } from '@/components/answer-section'
import { SYSTEM_PROMPT_RESEARCHER } from '../prompts'

const SYSTEM_PROMPT = SYSTEM_PROMPT_RESEARCHER

export async function researcher(
    uiStream: ReturnType<typeof createStreamableUI>,
    messages: CoreMessage[]
) {
  console.log('[INFO] Researcher function invoked')
  try {
    let fullResponse = ''
    const streamableText = createStreamableValue<string>()
    let toolResults: any[] = []

    const currentDate = new Date().toLocaleString()
    const systemPrompt = `${SYSTEM_PROMPT} Current date and time: ${currentDate}`
    console.log('[DEBUG] Updated System Prompt:', systemPrompt)
    console.log('[DEBUG] Initial messages:', messages)

    const result = await streamText({
      model: getModel(),
      system: systemPrompt,
      messages: messages,
      tools: getTools({
        uiStream,
        fullResponse
      }),
      maxSteps: 5,
      onStepFinish: async event => {
        console.log('[INFO] Step finished:', event.stepType)
        if (event.stepType === 'initial') {
          if (event.toolCalls && event.toolCalls.length > 0) {
            console.log('[DEBUG] Tool calls:', event.toolCalls)
            uiStream.append(<AnswerSection result={streamableText.value} />)
            toolResults = event.toolResults
          } else {
            uiStream.update(<AnswerSection result={streamableText.value} />)
          }
        }
      }
    })

    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta' && delta.textDelta) {
        // console.log('[DEBUG] Text delta received:', delta.textDelta)
        fullResponse += delta.textDelta
        streamableText.update(fullResponse)
      }
    }

    console.log('[INFO] Full response received')
    streamableText.done(fullResponse)

    console.log('[DEBUG] Final response:', fullResponse)
    console.log('[DEBUG] Tool results:', toolResults)
    return { text: fullResponse, toolResults }
  } catch (error) {
    console.error('[ERROR] Error in researcher:', error)
    return {
      text: 'An error has occurred. Please try again.',
      toolResults: []
    }
  }
}