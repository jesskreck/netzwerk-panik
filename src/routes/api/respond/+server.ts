import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { eventGoalTools } from '$lib/types/eventGoalTools';
import { handleGoalCompletion } from '$lib/stores/goalStore.svelte';

export async function POST({ request }) {
	try {
	  const body = await request.json();
	  const { messages } = body;
  
	  const openai = new OpenAI({
		apiKey: OPENAI_API_KEY
	  });
  
	  const stream = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: messages,
		tools: eventGoalTools,
		tool_choice: 'auto',
		stream: true,
	  });
  
	  const encoder = new TextEncoder();
	  const readable = new ReadableStream({
		async start(controller) {
		  let fullResponse = '';
		  let completeToolCallArguments = '';
		  let toolCallResult: { 
			goals?: string[], 
			isComplete?: boolean 
		  } = {};
  
		  try {
			for await (const chunk of stream) {
			  const content = chunk.choices[0]?.delta?.content || '';
			  const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
  
			  fullResponse += content;
  
			  // Sammle Tool Call Argumente über alle Chunks
			  if (toolCall?.function?.arguments) {
				completeToolCallArguments += toolCall.function.arguments;
			  }
  
			  // Prüfe auf vollständigen Tool Call
			  if (chunk.choices[0]?.finish_reason === 'tool_calls') {
				try {
				  const parsedArgs = JSON.parse(completeToolCallArguments);
				  
				  toolCallResult = {
					goals: parsedArgs.goals,
					isComplete: parsedArgs.isComplete
				  };
  
				  console.log('Geparste Argumente als toolCallResult:', toolCallResult);

				
				} catch (parseError) {
				  console.error('Fehler beim finalen Parsen:', parseError);
				  console.error('Rohe Argumentzeichenkette:', completeToolCallArguments);
				}
			  }
  
			  const data = encoder.encode(JSON.stringify({ 
				chunk: content,
				fullText: fullResponse,
				toolCallResult
			  }) + '\n');
			  
			  controller.enqueue(data);
			}
			
			controller.close();
		  } catch (error) {
			console.error('Stream-Fehler:', error);
			controller.error(error);
		  }
		}
	  });
  
	  return new Response(readable, {
		headers: {
		  'Content-Type': 'text/event-stream',
		  'Cache-Control': 'no-cache',
		  'Connection': 'keep-alive'
		}
	  });
	} catch (error) {
	  console.error('Serverfehler bei Chat-Anfrage:', error);
	  return new Response(JSON.stringify({ error: 'Serverfehler bei der Verarbeitung' }), { 
		status: 500, 
		headers: { 'Content-Type': 'application/json' }
	  });
	}
  }