// file: lib/agents/task-manager.tsx
import { CoreMessage, generateObject } from 'ai'
import { nextActionSchema } from '../schema/next-action'
import { getModel } from '../utils'
import { SYSTEM_PROMPT_TASK_MANAGER } from '../prompts'

const SYSTEM_PROMPT = SYSTEM_PROMPT_TASK_MANAGER

// Decide whether inquiry is required for the user input
export async function taskManager(messages: CoreMessage[]) {
  console.log('[INFO] Task Manager function invoked')
  console.log('[DEBUG] Initial messages:', messages)
  console.log('[DEBUG] System prompt:', SYSTEM_PROMPT)

  try {
    const result = await generateObject({
      model: getModel(),
      system: SYSTEM_PROMPT,
      messages,
      schema: nextActionSchema
    })

    console.log('[INFO] Generate object result received')
    console.log('[DEBUG] Result:', result)
    return result
  } catch (error) {
    console.error('[ERROR] Error in taskManager:', error)
    return null
  } finally {
    console.log('[INFO] Task Manager function execution completed')
  }
}