<script lang="ts">
	import { goto } from '$app/navigation';
	import Heading from '../components/Heading.svelte';
	import animation from '$lib/assets/animation.gif';

	function navigateForward() {
		goto('/talk');
	}
</script>

<div class="m-auto flex h-screen flex-col items-center justify-center py-12 text-center mx-4">
	<Heading level="h1">Netzwerk-Panik?</Heading>
	<Heading level="h2">Klarheit wächst nicht durch Denken, sondern durch Sprechen.</Heading>

	<p class="mt-10 max-w-xl">
		Du stehst vor dem Event. Deine Gedanken fahren Karussell, dein Körper spielt Alarm - so geht es
		allen! Lass deine Panik raus und gewinne Klarheit.
	</p>

	<div class="m-10">
		<img src={animation} alt="Animation showing Chandler from Friend's being nervous.">
	</div>

	<Heading level="h3">Hol dir was du brauchst.</Heading>
	<button class="btn btn-primary btn-xl m-5 shadow transition duration-300 hover:-translate-y-1.1 hover:scale-110 hover:bg-secondary" onclick={navigateForward}>Pep-Talk</button>
</div>
