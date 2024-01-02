<script>
  import { bg, frames, isPlaying } from "$lib/stores";
</script>

<section
  class="row-start-3 col-start-1 flex justify-between items-center mx-2 my-1 px-3 gap-5 bg-white rounded-lg shadow-md border border-gray-200 overflow-visible z-10"
>
  <div></div>
  <button
    class="px-3 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
    on:click={() => ($isPlaying = !$isPlaying)}
    disabled={$frames.length == 0}
  >
    <p class="text-sm">{$isPlaying ? "Pause" : "Play"}</p>
  </button>

  <label
    class="px-3 py-1 rounded-md flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
  >
    <p class="text-sm cursor-pointer">BG</p>
    <input
      class="h-5 w-5 cursor-pointer"
      type="color"
      id="color"
      bind:value={$bg}
    />
  </label>
</section>
