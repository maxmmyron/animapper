<script lang="ts">
  import Canvas from "$lib/components/Canvas.svelte";
  import {
    frameIdx,
    size,
    matrix,
    frames,
    isPlaying,
    framerate,
    overlayOptions,
  } from "$lib/stores";
  import { createEmptyFrame } from "$lib/frames";
  import getTransforms from "$lib/transforms";
  import { onMount } from "svelte";
  import Capture from "$lib/components/Capture.svelte";
  import MenuBar from "$lib/components/MenuBar/MenuBar.svelte";
  import ControlBar from "$lib/components/ControlBar.svelte";

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

  let viewerContainer: HTMLElement;
  let viewer: HTMLDivElement;

  /**
   * Whether or not playback has been paused due to the window losing focus
   */
  let isBlurPaused = false;

  let panEnabled = false;

  let lastTimestamp = 0;
  let lag = 0;
  let update = (timestamp: DOMHighResTimeStamp) => {
    requestAnimationFrame(update);

    // bypass if we're not playing, or if we're paused due to blur
    if (!$isPlaying || isBlurPaused) {
      lastTimestamp = timestamp;
      return;
    }

    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    lag += delta;

    if (lag >= 1000 / $framerate) {
      $frameIdx = ($frameIdx + 1) % $frames.length;
      lag -= 1000 / $framerate;
    }
  };

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Error mounting +page.svelte: Canvas context is null.");

    ctx = context;

    // setup canvas size, defaulting to stored size if available
    let storedSize = localStorage.getItem("size");
    if (storedSize === null)
      $size = [viewerContainer.clientWidth, viewerContainer.clientHeight];
    else $size = JSON.parse(storedSize);

    /**
     * load transforms and update matrix with them
     *
     * we intentionally perform this after setting the size so that we can
     * ensure the transforms are applied to the correct size canvas
     */
    $matrix = getTransforms().retrieveStoredTransforms();

    // auto-update localStorage with new size when it changes
    size.subscribe((size) => {
      localStorage.setItem("size", JSON.stringify(size));
    });

    // auto-update localStorage with new matrix when it changes
    matrix.subscribe(() => {
      getTransforms().saveTransformsToStorage();
    });

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
  on:blur={() => (isBlurPaused = true)}
  on:focus={() => (isBlurPaused = false)}
/>

<MenuBar {canvas} {ctx} {clearFrame} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  id="viewer-container"
  bind:this={viewerContainer}
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
    <Canvas bind:canvas bind:panEnabled bind:clearFrame bind:captureFrame />
    {#if $frames.length > 0}
      {#each { length: Math.min($overlayOptions[0], $frameIdx) } as _, i}
        {#if $frameIdx - i - 1 >= 0}
          {@const src = $frames[$frameIdx - i - 1].overlaySrc}
          {@const opacity = $overlayOptions[1] / (i + 1)}
          {@const zIndex = $overlayOptions[0] - i}
          <img {src} alt="" class="overlay" style:opacity style:zIndex />
        {/if}
      {/each}
    {/if}
    {#if frame && $isPlaying}
      <img src={frame.renderSrc} alt="" id="output" />
    {/if}
  </div>
</section>

<ControlBar />

<section id="captures">
  {#each $frames as frame, idx}
    <Capture {frame} {idx} {canvas} {ctx} />
  {/each}
</section>

<style>
  #viewer-container {
    grid-area: 1/1/3/1;
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

  #captures {
    display: flex;
    padding: 0.25rem;
    gap: 0.25rem;
    overflow-x: scroll;
    overflow-y: hidden;
  }
</style>
