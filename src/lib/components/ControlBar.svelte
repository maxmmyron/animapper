<script>
  import { bg, frames, isPlaying } from "$lib/stores";
</script>

<section class="flex justify-center items-center gap-4">
  <button
    class="px-3 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
    on:click={() => ($isPlaying = !$isPlaying)}
    disabled={$frames.length == 0}
  >
    <p class="text-sm">{$isPlaying ? "Pause" : "Play"}</p>
  </button>

  <label
    class="px-3 py-1 rounded-md flex flex-col items-center hover:bg-gray-100 transition-colors cursor-pointer"
  >
    <p class="text-sm cursor-pointer">Frame BG</p>
    <input
      class="h-4 w-4/5 cursor-pointer"
      type="color"
      id="color"
      bind:value={$bg}
    />
  </label>
</section>
