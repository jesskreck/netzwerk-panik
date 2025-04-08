<script lang="ts">
	import { DEFAULT_MESSAGES, HEADINGS } from '$lib/prompts';
	import ChatUi from '../../components/ChatCompletion/ChatUI.svelte';
	import { goalStore, proceedToNextStage } from '$lib/stores/goalStore.svelte';
</script>

{#if goalStore.isComplete}
	<div class="fixed bottom-20 left-0 right-0 z-50 flex justify-center">
		<button 
			class="btn btn-primary" 
			on:click={proceedToNextStage}
		>
			Weiter zu Gesprächsthemen
		</button>
	</div>
{/if}

<ChatUi
heading={HEADINGS.goals} 
defaultMessages={DEFAULT_MESSAGES.goals} 
/>