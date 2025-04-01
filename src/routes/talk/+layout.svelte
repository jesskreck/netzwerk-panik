<script lang="ts">
	import AudioRecorder from "../../components/AudioRecorder.svelte";

	let { children } = $props();
</script>

<div class="h-screen">

	
	<main>
		{@render children()}
		
	</main>
	
	
	<footer class="w-full bg-white rounded-t-xl absolute bottom-0">
		<AudioRecorder/>
	</footer>
</div>