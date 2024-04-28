<script>
  import { frames, isPlaying } from "$lib/stores";
  import PauseIcon from "$lib/components/Icons/PauseIcon.svelte";
  import PlayIcon from "$lib/components/Icons/PlayIcon.svelte";
</script>

<section class="row-start-3 col-start-1 mx-2 my-1 flex justify-between z-10">
  <button
    class="px-1 py-2 flex justify-center items-center bg-white rounded-lg shadow-md border border-gray-200"
    on:click={() => ($isPlaying = !$isPlaying)}
    disabled={$frames.length == 0}
  >
    {#if $isPlaying}
      <div class="p-2 rounded-md hover:bg-gray-100 transition-colors">
        <PauseIcon />
      </div>
    {:else}
      <div class="p-2 rounded-md hover:bg-gray-100 transition-colors">
        <PlayIcon />
      </div>
    {/if}
  </button>
</section>
