<script lang="ts">
	let { animated = true } = $props();
  </script>
  
  <div class="recording-animation color-primary flex">
	{#each Array(15) as _, i}
	  <div class="bar" class:animated={animated}></div>
	{/each}
  </div>
  
  <style>
	.recording-animation {
	  display: flex;
	  align-items: center;
	  height: 100%;
	  gap: 3px;
	}
  
	.bar {
	  width: 4px;
	  height: 10px;
	  background-color: currentColor;
	}
  
	.bar.animated {
	  animation: sound 0.5s linear infinite alternate;
	}
  
	.bar:nth-child(1), .bar:nth-child(15) {
	  animation-delay: 0s;
	}
	.bar:nth-child(4), .bar:nth-child(12) {
	  animation-delay: 0.1s;
	}
	.bar:nth-child(7) {
	  animation-delay: 0.2s;
	}
	.bar:nth-child(9) {
	  animation-delay: 0.15s;
	}
	.bar:nth-child(11) {
	  animation-delay: 0.1s;
	}
	.bar:nth-child(14) {
	  animation-delay: 0.3s;
	}
  
	@keyframes sound {
	  0% { height: 5px; }
	  100% { height: 25px; }
	}
  </style>