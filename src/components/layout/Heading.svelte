<script lang="ts">
	type levelT = 'h1' | 'h2' | 'h3';

	let {
		children,
		level,
		color,
		short
	}: { children: any; level: levelT; color?: String; short?: boolean } = $props();

	const fontClasses = {
		h1: 'text-4xl font-bold',
		h2: 'text-2xl font-bold',
		h3: 'text-xl font-semibold'
	};

	const marginClasses = {
		h1: 'mb-8',
		h2: 'mb-3',
		h3: 'mb-2'
	};

	// Combine Tailwind classes
	const combinedClasses = `${fontClasses[level]} ${!short ? marginClasses[level] : ''} text-${color} text-center`;
</script>

<svelte:element this={level} class={combinedClasses}>
	{@render children()}
</svelte:element>
