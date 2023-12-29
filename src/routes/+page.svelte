<script lang="ts">
  import Canvas from "$lib/components/Canvas.svelte";
  import { frameIdx, size, bg, matrix, frames } from "$lib/stores";
  import {
    createEmptyFrame,
    retrieveStoredFrames,
    saveFramesToStorage,
  } from "$lib/frames";
  import getTransforms from "$lib/transforms";
  import { onMount } from "svelte";
  import Capture from "$lib/components/Capture.svelte";
  import { exportRender } from "$lib/export";

  /**
   * Binding for current frame that clears canvas and updates frame command
   * stack.
   */
  let clearFrame: () => void;

  /**
   * Binding for current frame that captures the canvas and updates frame
   * command stack.
   */
  let captureFrame: () => void;

  let frame: App.Frame | null = null;

  frameIdx.subscribe((idx) => {
    frame = $frames[idx];
  });

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let viewer: HTMLDivElement;

  let overlayOpacity = 0.5;
  let overlayCount = 1;

  let playing = false;
  let framerate = 12;

  let panEnabled = false;

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
      $frameIdx = ($frameIdx + 1) % $frames.length;
      lag -= 1000 / framerate;
    }
  };

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Error mounting +page.svelte: Canvas context is null.");

    ctx = context;

    // load transforms and update matrix with them
    $matrix = getTransforms().retrieveStoredTransforms();

    requestAnimationFrame(update);
  });

  let mousePos = [0, 0];
  let lastPos = [0, 0];
  const handleMove = (e: MouseEvent) => {
    lastPos = [...mousePos];
    mousePos = [e.pageX, e.pageY];

    if (!panEnabled) return;

    getTransforms().pan([mousePos[0] - lastPos[0], mousePos[1] - lastPos[1]]);
    getTransforms().apply();
    e.preventDefault();
  };

  const handleZoom = (e: WheelEvent) => {
    const x = e.pageX - viewer.clientWidth / 2;
    const y = e.pageY - viewer.clientHeight / 2;

    const factor = e.deltaY > 0 ? 0.9 : 1.1;

    getTransforms().zoom([x, y], factor);
    getTransforms().apply();
    e.preventDefault();
  };

  const handleScroll = (e: WheelEvent) => {
    let x = e.deltaX;
    let y = e.deltaY;

    if (e.shiftKey) [x, y] = [y, x];

    getTransforms().pan([-x, -y]);
    getTransforms().apply();
    e.preventDefault();
  };

  /**
   * Captures the state of the current frame, and advances to the next frame
   * (generating a new one if necessary)
   */
  const advanceFrame = () => {
    if (!ctx) throw new Error("no context");
    captureFrame();

    // if at end of list, clear canvas and add new frame
    if ($frameIdx === $frames.length - 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $frames = [...$frames, createEmptyFrame(canvas, ctx)];
    }

    $frameIdx++;
  };
</script>

<svelte:window
  on:mouseup={() => (panEnabled = false)}
  on:mousemove={handleMove}
  on:keydown={(e) => {
    if (e.key == "f") advanceFrame();
    else if (e.key == "ArrowLeft") $frameIdx = Math.max(0, $frameIdx - 1);
    else if (e.key == "ArrowRight")
      $frameIdx = Math.min($frames.length - 1, $frameIdx + 1);
    else if (e.key == "End") $frameIdx = $frames.length - 1;
    else if (e.key == "Home") $frameIdx = 0;
  }}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  id="viewer-container"
  bind:clientWidth={$size[0]}
  bind:clientHeight={$size[1]}
  on:mousedown={(e) => {
    if (e.button === 1) panEnabled = true;
  }}
  on:wheel={(e) => {
    if (e.ctrlKey) handleZoom(e);
    else handleScroll(e);
  }}
>
  <div
    id="viewer"
    bind:this={viewer}
    style:transform="matrix({$matrix.join(",")})"
    style:width="{$size[0]}px"
    style:height="{$size[1]}px"
  >
    <Canvas
      bind:playing
      bind:canvas
      bind:panEnabled
      bind:clearFrame
      bind:captureFrame
    />
    {#if $frames.length > 0}
      {#each { length: Math.min(overlayCount, $frameIdx) } as _, i}
        {#if $frameIdx - i - 1 >= 0}
          {@const src = $frames[$frameIdx - i - 1].overlaySrc}
          {@const opacity = overlayOpacity / (i + 1)}
          {@const zIndex = overlayCount - i}
          <img {src} alt="" class="overlay" style:opacity style:zIndex />
        {/if}
      {/each}
    {/if}
    {#if frame && playing}
      <img src={frame.renderSrc} alt="" id="output" />
    {/if}
  </div>
</section>

<section id="controls">
  <button on:click={() => advanceFrame()}>Capture</button>

  <fieldset>
    <legend>overlay options</legend>
    <label class="lbl">
      <input
        type="range"
        min="0"
        max="1"
        bind:value={overlayOpacity}
        step="0.01"
      />
      opacity: {overlayOpacity}
    </label>
    <hr />
    <label class="lbl">
      <input
        type="range"
        min="0"
        max={$frames.length}
        bind:value={overlayCount}
        step="1"
      />
      overlay count: {overlayCount}
    </label>
  </fieldset>

  <fieldset>
    <legend>animation controls</legend>
    <button
      on:click={() => (playing = !playing)}
      disabled={$frames.length == 0}
    >
      {playing ? "Pause" : "Play"}
    </button>
    <hr />
    <label class="lbl">
      <input type="range" bind:value={framerate} min="1" max="60" />
      {framerate} fps
    </label>
  </fieldset>

  <fieldset>
    <legend>canvas controls</legend>
    <button on:click={clearFrame}>Clear</button>
    <button on:click={() => getTransforms().reset()}> reset view </button>
    <label class="lbl-horz">
      x
      <input type="number" bind:value={$size[0]} min="1" />
    </label>
    <label class="lbl-horz">
      y
      <input type="number" bind:value={$size[1]} min="1" />
    </label>
    <label class="lbl-horz">
      bg
      <input type="color" bind:value={$bg} />
    </label>
  </fieldset>

  <fieldset>
    <legend>render</legend>
    <button on:click={() => exportRender({ framerate })}>export</button>
  </fieldset>

  <fieldset>
    <legend>storage</legend>
    <button on:click={() => getTransforms().saveTransformsToStorage()}
      >Save transforms</button
    >
    <button on:click={() => getTransforms().retrieveStoredTransforms()}
      >Load transforms</button
    >
    <br />
    <button on:click={() => saveFramesToStorage()}>save frames</button>
    <button on:click={() => retrieveStoredFrames(canvas, ctx)}
      >Load frames</button
    >
  </fieldset>
</section>

<section id="captures">
  {#each $frames as frame, idx}
    <Capture {frame} {idx} {canvas} {ctx} />
  {/each}
</section>

<style>
  section {
    width: 100%;
    border: 1px solid black;
  }

  #viewer-container {
    background-color: rgb(240, 240, 240);
    position: relative;
    overflow: hidden;
    gap: 1rem;
  }

  .overlay,
  #output {
    position: absolute;
    pointer-events: none;
    width: 100%;
    height: 100%;
  }

  #controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  #captures {
    display: flex;
    padding: 0.25rem;
    gap: 0.25rem;
    overflow-x: scroll;
    overflow-y: hidden;
  }

  .lbl {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lbl-horz {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
