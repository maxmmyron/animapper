<script>
  import { bg, frames, isPlaying } from "$lib/stores";
</script>

<section class="flex justify-center items-center gap-4">
  <button
    class="px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
    on:click={() => ($isPlaying = !$isPlaying)}
    disabled={$frames.length == 0}
  >
    {$isPlaying ? "Pause" : "Play"}
  </button>

  <label class="flex items-center gap-2">
    bg
    <input type="color" bind:value={$bg} />
  </label>
</section>
