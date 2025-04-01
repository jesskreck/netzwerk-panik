import { store } from '$lib/stores/chatStore.svelte';

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Transkription fehlgeschlagen');
  }
  
  return await response.json();
}


export async function sendToGPT(transcript: string, prompt?: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('/api/respond', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: store.chatHistory
    })
  });
  
  if (!response.ok) {
    throw new Error('GPT-Anfrage fehlgeschlagen');
  }
  
  return response.body!;
}

export function createSummary(text: string): string {
  if (!text) return '';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (sentences.length <= 2) {
    return text;
  } else {
    const first = sentences[0].trim();
    const last = sentences[sentences.length - 1].trim();
    return `${first} [...] ${last}`;
  }
}