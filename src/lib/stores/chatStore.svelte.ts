import { type Message } from '$lib/types/chat';
import { v4 as uuidv4 } from 'uuid'; // UUID-Bibliothek hinzufügen

// Wir verwenden Nested State für mehr Flexibilität
const store = $state({
  messages: [] as Message[],
  chatHistory: [] as Array<{ role: string, content: string }>
});

const MAX_TOKENS_ESTIMATE = 4000; // Konservative Schätzung für gpt-4o-mini

/**
 * Fügt eine neue Nachricht hinzu
 */
function addMessage(transcript: string, summary: string, response: string): void {
  const newMessage: Message = {
    transcript,
    summary,
    response,
    timestamp: new Date(),
    id: uuidv4()
  };

  store.messages.unshift(newMessage);
}

/**
 * Begrenzt die Chathistorie, um das Kontextfenster nicht zu überschreiten
 */
function trimChatHistory(): void {
  // System-Nachricht immer behalten
  const systemMessage = store.chatHistory[0];
  let tokens = 0;
  let trimmedHistory = [systemMessage];

  // Von hinten nach vorne durchgehen (neuere Nachrichten priorisieren)
  for (let i = store.chatHistory.length - 1; i > 0; i--) {
    // Grobe Schätzung: 1 Token ≈ 4 Zeichen
    const messageTokens = store.chatHistory[i].content.length / 4;

    if (tokens + messageTokens < MAX_TOKENS_ESTIMATE) {
      tokens += messageTokens;
      trimmedHistory.unshift(store.chatHistory[i]);
    } else {
      break;
    }
  }

  // Statt Neuzuweisung der exportierten Variable, aktualisieren wir den Inhalt
  store.chatHistory.length = 0;
  store.chatHistory.push(...trimmedHistory);
}

/**
 * Setzt den Chat zurück
 */
function resetChat(): void {
  // Arrays leeren statt neu zuweisen
  store.messages.length = 0;
  store.chatHistory.length = 0;
  store.chatHistory.push({
    role: 'system',
    content: 'Du bist ein hilfreicher Assistent, der Netzwerkprobleme löst. Achte auf kurze, prägnante Antworten.'
  });
}

// Exportiere den Store und die Funktionen
export { store, addMessage, trimChatHistory, resetChat };