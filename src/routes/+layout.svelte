<script lang="ts">
  import { createFFmpeg } from "@ffmpeg/ffmpeg";
  import { onMount } from "svelte";

  let ffmpeg = createFFmpeg({ log: true });
  let ffmpegLoaded = false;

  onMount(async () => {
    await ffmpeg.load();
    ffmpegLoaded = true;
  });

  import "./app.css";
</script>

<main>
  {#if ffmpegLoaded}
    <slot />
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 7fr 1fr 2fr;
    gap: 1rem;
    padding: 0.5rem;
    height: 100vh;
  }
</style>
