import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const eventGoalTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'complete_goal_definition',
      description: 'Markiert die Zielsetzung als abgeschlossen',
      parameters: {
        type: 'object',
        properties: {
          goals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Liste der definierten Ziele'
          },
          isComplete: {
            type: 'boolean',
            description: 'Flag zur Markierung der Zielsetzung als abgeschlossen'
          }
        },
        required: ['goals', 'isComplete']
      }
    }
  }
];