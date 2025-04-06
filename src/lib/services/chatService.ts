import { store, resetChat } from '$lib/stores/chatStore.svelte';


export function initChat(systemPrompt: string): void {
  resetChat();
  store.chatHistory.push({ role: 'system', content: systemPrompt });
}