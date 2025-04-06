<script lang="ts">
  import TranscriptToggle from './TranscriptToggle.svelte';
  
  type ResponseMessageProps = {
    transcript: string;
    summary: string;
    response: string;
    timestamp: Date;
    streaming?: boolean;
  };
  
  let { transcript, summary, response, timestamp, streaming = false }: ResponseMessageProps = $props();

  // Cursor-Blink-Animation für das Streaming
  let showCursor = $state(streaming);
  
  // Cursor ein- und ausblenden im Streaming-Modus
  $effect(() => {
    if (streaming) {
      const interval = setInterval(() => {
        showCursor = !showCursor;
      }, 500);
      
      return () => clearInterval(interval);
    }
  });
</script>

<div class="message-container mb-4">
  <div class="message-timestamp text-xs opacity-50 mb-1 transition ease-in">
    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </div>
  
  <TranscriptToggle text={transcript} summary={summary} />
  
  {#if response || streaming}
    <div class="response-container mt-2 p-3 bg-base-100 text-lg rounded-lg">
      {response}
      {#if streaming}
        <span class="cursor" class:visible={showCursor}>|</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cursor {
    display: inline-block;
    opacity: 0;
    margin-left: 1px;
    font-weight: bold;
  }
  
  .cursor.visible {
    opacity: 1;
  }
</style>