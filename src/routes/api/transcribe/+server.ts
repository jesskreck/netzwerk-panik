import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { TRANSCRIBE_PROMPT } from '$lib/prompts.js';

/**
 * Haupt-Endpunkt für die Transkription von Audiodateien
 */
export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as File;
    const language = formData.get('language') as string || 'de';

    if (!audioBlob) {
      return json({ error: 'Keine Audiodatei erhalten' }, { status: 400 });
    }

    // OpenAI SDK initialisieren
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    // API mit SDK aufrufen    
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'gpt-4o-mini-transcribe',
      language,
    });

    return json({
      text: transcription.text
    });
  } catch (error) {
    console.error('Fehler bei der Audio-Transkription:', error);
    return json({
      error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    }, { status: 500 });
  }
}