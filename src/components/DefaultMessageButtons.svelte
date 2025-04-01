<script lang="ts">
	import { defaultMessages } from '$lib/prompts';
    import { sendDefaultMessage } from '$lib/services/messageService';
  
  
  </script>
  
  <div class="flex flex-col gap-3 mt-8 w-full max-w-md">
    {#each defaultMessages as message}
      <button 
        class="btn btn-outline w-full text-left font-normal px-4 py-3 h-auto"
        onclick={() => sendDefaultMessage(message)}
      >
        {message}
      </button>
    {/each}
  </div>