<script lang="ts">
  import { ffmpeg } from "$lib/stores";
  import { onMount } from "svelte";

  let ffmpegLoaded = false;

  onMount(async () => {
    await $ffmpeg.load();

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
    grid-template-rows: 3rem 7fr 3rem 2fr;
    grid-template-columns: 1fr;
    height: 100vh;
  }
</style>
