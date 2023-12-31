<script>
  import { exportRender } from "$lib/export";
  import {
    exportSafeSize,
    bg,
    frames,
    framerate,
    isPlaying,
  } from "$lib/stores";
</script>

<section id="controls">
  <button
    on:click={() => ($isPlaying = !$isPlaying)}
    disabled={$frames.length == 0}
  >
    {$isPlaying ? "Pause" : "Play"}
  </button>

  <label class="lbl-horz">
    bg
    <input type="color" bind:value={$bg} />
  </label>
</section>

<style>
  #controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .lbl-horz {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
