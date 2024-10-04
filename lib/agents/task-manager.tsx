// file: lib/agents/task-manager.tsx
import { CoreMessage, generateObject } from 'ai'
import { nextActionSchema } from '../schema/next-action'
import { getModel } from '../utils'
import { SYSTEM_PROMPT_TASK_MANAGER } from '../prompts'

const SYSTEM_PROMPT = SYSTEM_PROMPT_TASK_MANAGER

// Decide whether inquiry is required for the user input
export async function taskManager(messages: CoreMessage[]) {
  console.log('[INFO] Task Manager function invoked')
  try {
    const result = await generateObject({
      model: getModel(),
      system: SYSTEM_PROMPT,
      messages,
      schema: nextActionSchema
    })

    return result
  } catch (error) {
    console.error(error)
    return null
  }
}