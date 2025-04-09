import { store, trimChatHistory } from '$lib/stores/chatStore.svelte';
import { handleGoalCompletion } from '$lib/stores/goalStore.svelte';
import { sendToGPT, createSummary } from './audioService';
import { v4 as uuidv4 } from 'uuid';

// Funktion zum Senden eines vordefinierten Texts
export async function sendDefaultMessage(text: string) {
  // Chat-Historie vorbereiten
  trimChatHistory();
  store.chatHistory.push({ role: 'user', content: text });

  // Eine temporäre Message-ID erstellen für das Streaming
  const streamingMessageId = uuidv4();
  const summary = createSummary(text);

  // Initiale leere Nachricht zum Store hinzufügen
  const tempMessage = {
    transcript: text,
    summary: summary,
    response: '',
    timestamp: new Date(),
    id: streamingMessageId
  };
  store.messages.unshift(tempMessage);

  try {
    // Starte Streaming und hole GPT-Antwort
    const stream = await sendToGPT(text);
    processGptStream(stream, streamingMessageId);
  } catch (error) {
    console.error('Fehler beim Senden der Nachricht:', error);
  }
}

// Verarbeite den GPT Stream
export async function processGptStream(stream: ReadableStream<Uint8Array>, msgId: string) {
  let currentResponse = '';
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          // Text zur Antwort hinzufügen
          currentResponse = data.fullText;

          // Wenn toolCallResult im Stream vorhanden ist, verarbeite es
          if (data.toolCallResult && Object.keys(data.toolCallResult).length > 0) {
            console.log('Tool call result empfangen:', data.toolCallResult);
            // Hier den goalStore aktualisieren
            handleGoalCompletion(
              data.toolCallResult.goals,
              data.toolCallResult.isComplete
            );
          }

          // Message im Store aktualisieren
          const messageIndex = store.messages.findIndex(m => m.id === msgId);
          if (messageIndex !== -1) {
            store.messages[messageIndex].response = currentResponse;
          }
        } catch (e) {
          console.error('Fehler beim Verarbeiten des Streams:', e);
        }
      }
    }
  } catch (error) {
    console.error('Stream-Fehler:', error);
  } finally {
    // Speichere das Ergebnis in der Chat-Historie
    const messageIndex = store.messages.findIndex(m => m.id === msgId);
    if (messageIndex !== -1) {
      store.chatHistory.push({
        role: 'assistant',
        content: store.messages[messageIndex].response
      });
    }
  }
}