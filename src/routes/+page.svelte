<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;

  // list of screencaps
  let caps: string[] = [];
  // current screencap index
  let captureFrame = 0;

  let viewMode: "viewer" | "render" = "viewer";

  let opacity = 0.5;
  let numOverlays = 1;

  let playing = false;
  let framerate = 12;

  let lastTimestamp = 0;
  let lag = 0;
  let update = (timestamp: DOMHighResTimeStamp) => {
    requestAnimationFrame(update);

    // bypass if we're not playing
    if (!playing) {
      lastTimestamp = timestamp;
      return;
    }

    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    lag += delta;

    if (lag >= 1000 / framerate) {
      captureFrame = (captureFrame + 1) % caps.length;
      lag -= 1000 / framerate;
    }
  };

  $: currCap = caps[captureFrame] ?? "";

  onMount(async () => {
    requestAnimationFrame(update);
  });
</script>

<svelte:head>
  <link
    href="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.105/Build/Cesium/Widgets/widgets.css"
    rel="stylesheet"
  />
</svelte:head>

<section id="cesium">
  <canvas
    id="canvas"
    bind:this={canvas}
    style:visibility={viewMode ? "visible" : "hidden"}
  />
  {#if caps.length > 0}
    {#each { length: numOverlays } as _, i}
      <img
        src={caps[caps.length - (i + 1)]}
        alt=""
        id="overlay"
        style:opacity={opacity / (i + 1)}
        style:zIndex={numOverlays - i}
      />
    {/each}
  {/if}
  {#if currCap !== ""}
    <div id="output" style="display: {!viewMode ? 'block' : 'none'};">
      <img src={currCap} />
    </div>
  {/if}
</section>

<section id="controls">
  <div style="display:Flex; flex-direction:column">
    <label>
      <input type="radio" bind:group={viewMode} value="viewer" checked />
      Viewer
    </label>
    <label>
      <input type="radio" bind:group={viewMode} value="render" />
      render
    </label>
  </div>
  <button on:click={() => (caps = [...caps, canvas.toDataURL()])}>
    Capture
  </button>

  <fieldset>
    <legend>overlay options</legend>
    <label class="lbl">
      <input type="range" min="0" max="1" bind:value={opacity} step="0.01" />
      opacity: {opacity}
    </label>
    <hr />
    <label class="lbl">
      <input
        type="range"
        min="0"
        max={caps.length}
        bind:value={numOverlays}
        step="1"
      />
      overlay count: {numOverlays}
    </label>
  </fieldset>

  <fieldset>
    <legend>animation controls</legend>
    <button on:click={() => (playing = !playing)} disabled={caps.length == 0}>
      {playing ? "Pause" : "Play"}
    </button>
    <hr />
    <label class="lbl">
      <input type="range" bind:value={framerate} min="1" max="60" />
      {framerate} fps
    </label>
  </fieldset>
</section>

<section id="captures">
  {#each caps as cap, i}
    <div class="capture">
      <button on:click={() => (caps = caps.filter((_, j) => i !== j))}>
        X
      </button>

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <img
        src={cap}
        on:click={() => {
          captureFrame = i;
        }}
        alt=""
      />
    </div>
  {/each}
</section>

<style>
  section {
    width: 100%;
    border: 1px solid black;
  }

  #cesium {
    position: relative;
    overflow-x: hidden;
    display: flex;
    gap: 1rem;
  }

  #cesium-container {
    width: 100%;
    height: 100%;
    overflow: clip;
  }

  #overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    pointer-events: none;
    opacity: 0.25;
  }

  #controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  #captures {
    display: flex;
    gap: 1rem;
    overflow-x: scroll;
    overflow-y: hidden;
  }

  img {
    height: 100%;
    flex-shrink: 0;
  }

  .lbl {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .capture {
    position: relative;
    height: 100%;
  }

  .capture > button {
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .capture:hover > button {
    opacity: 1;
  }

  video {
    position: fixed;
    top: 0;
    left: 0;
    visibility: hidden;
    pointer-events: none;
  }
</style>
