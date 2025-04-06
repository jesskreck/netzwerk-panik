<script lang="ts">
	import { onMount } from 'svelte';
	import { initChat } from '$lib/services/chatService';
	import { PROMPTS } from '$lib/prompts';
	import ChatLayout from '../../components/ChatCompletion/ChatLayout.svelte';

	let { children } = $props();

	onMount(() => {
		// Initialisiere Chat im "goals" Modus
		initChat(PROMPTS.goals);
	});
</script>

<ChatLayout>
	{@render children()}
</ChatLayout>