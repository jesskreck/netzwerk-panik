<script lang="ts">
	import { formatTime } from '$lib/utils/audioUtils';
	import AudioVisualizer from '../../layout/AudioVisualizer.svelte';

	type RecordingControlsProps = {
		isRecording: boolean;
		isTranscribing: boolean;
		recordingTime: number;
		onCancel: () => void;
		onFinish: () => void;
	};

	let { 
		isRecording, 
		isTranscribing, 
		recordingTime, 
		onCancel, 
		onFinish
	}: RecordingControlsProps = $props();
</script>

	<!-- Recording Controls -->
	<button
		class="btn btn-circle btn-primary btn-outline btn-xl"
		onclick={onCancel}
		aria-label={isTranscribing ? "Transkription abbrechen" : "Aufnahme abbrechen"}
	>
		✕
	</button>

	<AudioVisualizer animated={isRecording && !isTranscribing} />

	<!-- Timer -->
	<div class="font-mono text-lg" aria-live="polite" aria-label="Aufnahmezeit">
		{formatTime(recordingTime)}
	</div>

	<!-- Finish Button -->
	<button
		class="btn btn-circle btn-primary btn-xl relative"
		onclick={onFinish}
		disabled={isTranscribing}
		aria-label="Aufnahme beenden und senden"
	>
		{#if isTranscribing}
			<span class="loading loading-spinner loading-xs absolute"></span>
		{:else}
			↑
		{/if}
	</button>