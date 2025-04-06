<script lang="ts">
	import { onMount } from 'svelte';
	import { initChat } from '$lib/services/chatService';
	import { PROMPTS } from '$lib/prompts';
	import ChatLayout from '../../components/ChatCompletion/ChatLayout.svelte';

	let { children } = $props();

	onMount(() => {
		initChat(PROMPTS.themen);
	});
</script>

<ChatLayout>
	{@render children()}
</ChatLayout>