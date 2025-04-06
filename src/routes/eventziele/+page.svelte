<script lang="ts">
	import { DEFAULT_MESSAGES, HEADINGS } from '$lib/prompts';
	import ChatUi from '../../components/ChatCompletion/ChatUI.svelte';
</script>

<ChatUi
	heading={HEADINGS.goals} 
	defaultMessages={DEFAULT_MESSAGES.goals} 
/>