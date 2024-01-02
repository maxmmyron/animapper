<script lang="ts">
  import { ffmpeg } from "$lib/stores";
  import { onMount } from "svelte";
  import "../app.css";

  let ffmpegLoaded = false;

  onMount(async () => {
    await $ffmpeg.load();

    ffmpegLoaded = true;
  });
</script>

<main class="grid grid-cols-1 h-full grid-rows-[4rem,7fr,4rem,2fr]">
  {#if ffmpegLoaded}
    <slot />
  {/if}
</main>
