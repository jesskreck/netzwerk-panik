<script lang="ts">
    import { sendDefaultMessage } from '$lib/services/messageService';

    let {messages}: {messages: string[]} = $props();
  
  </script>
  
  <div class="flex flex-col gap-3 mt-8 w-full max-w-md">
    {#each messages as message}
      <button 
        class="btn btn-outline w-full text-left font-normal px-4 py-3 h-auto"
        onclick={() => sendDefaultMessage(message)}
      >
        {message}
      </button>
    {/each}
  </div>