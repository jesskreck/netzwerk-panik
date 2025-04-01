import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { messages } = body;

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(JSON.stringify({ error: 'Keine gültigen Nachrichten übermittelt' }), { 
				status: 400, 
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// OpenAI SDK initialisieren
		const openai = new OpenAI({
			apiKey: OPENAI_API_KEY
		});

		// Chat Completion API mit SDK aufrufen und streamen
		const stream = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: messages,
			stream: true,
		});

		// Stream-Antwort vorbereiten
		const encoder = new TextEncoder();
		const readable = new ReadableStream({
			async start(controller) {
				try {
					let fullResponse = '';
					
					// Chunks durchlaufen
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || '';
						fullResponse += content;
						
						// Chunk an den Client senden
						const data = encoder.encode(JSON.stringify({ 
							chunk: content,
							fullText: fullResponse 
						}) + '\n');
						
						controller.enqueue(data);
					}
					
					// Stream beenden
					controller.close();
				} catch (error) {
					console.error('Stream-Fehler:', error);
					controller.error(error);
				}
			}
		});

		// Stream zurückgeben
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