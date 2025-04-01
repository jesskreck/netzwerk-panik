<script lang="ts">
	// Props für die Komponente
	type TranscriptToggleProps = {
		text: string;
		summary: string;
	};

	let { text, summary }: TranscriptToggleProps = $props();

	// State
	let expanded = $state(false);

	// Toggle-Funktion
	function toggle() {
		expanded = !expanded;
	}

	// Taste-Handler für Barrierefreiheit
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}
</script>

<button
	type="button"
	class="easy-in w-full text-left bg-base-200 p-4 rounded-lg transition-all hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary"
	onclick={toggle}
	onkeydown={handleKeyDown}
	aria-expanded={expanded}
	aria-controls="transcript-content"
>
	<span id="transcript-content" class="text-sm">
		{expanded ? text : summary}
	</span>
	{#if text !== summary}
		<span class="text-xs ml-4 opacity-50">
			{expanded ? '▲ einklappen' : '▼ ausklappen'}
		</span>
	{/if}
</button>