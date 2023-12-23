<script lang="ts">
  import Canvas from "$lib/components/Canvas.svelte";
  import { size, bg, matrix, frames } from "$lib/stores";
  import { createEmptyFrame } from "$lib/frames";
  import transforms from "$lib/transforms";
  import { onMount } from "svelte";

  let viewTransforms = transforms();

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

  let frameIdx = 0;
  $: frame = $frames[frameIdx];

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let viewer: HTMLDivElement;

  // TODO: this is part of a hack; should be removed in future
  let frameContainerHeight: number;

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
      frameIdx = (frameIdx + 1) % $frames.length;
      lag -= 1000 / framerate;
    }
  };

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Error mounting +page.svelte: Canvas context is null.");

    ctx = context;

    requestAnimationFrame(update);
  });

  let mousePos = [0, 0];
  let lastPos = [0, 0];
  const handleMove = (e: MouseEvent) => {
    lastPos = [...mousePos];
    mousePos = [e.pageX, e.pageY];

    if (!panEnabled) return;

    viewTransforms.pan([mousePos[0] - lastPos[0], mousePos[1] - lastPos[1]]);
    viewTransforms.apply();
    e.preventDefault();
  };

  const handleZoom = (e: WheelEvent) => {
    const x = e.pageX - viewer.clientWidth / 2;
    const y = e.pageY - viewer.clientHeight / 2;

    const factor = e.deltaY > 0 ? 0.9 : 1.1;

    viewTransforms.zoom([x, y], factor);
    viewTransforms.apply();
    e.preventDefault();
  };

  const handleScroll = (e: WheelEvent) => {
    let x = e.deltaX;
    let y = e.deltaY;

    if (e.shiftKey) [x, y] = [y, x];

    viewTransforms.pan([-x, -y]);
    viewTransforms.apply();
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
    if (frameIdx === $frames.length - 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $frames = [...$frames, createEmptyFrame(canvas, ctx, $bg)];
    }

    frameIdx++;
  };
</script>

<svelte:window
  on:mouseup={() => (panEnabled = false)}
  on:mousemove={handleMove}
  on:keydown={(e) => {
    if (e.key == "f") advanceFrame();
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
      bind:frameIdx
      bind:clearFrame
      bind:captureFrame
    />
    {#if $frames.length > 0}
      {#each { length: Math.min(overlayCount, frameIdx) } as _, i}
        {#if frameIdx - i - 1 >= 0}
          {@const src = $frames[frameIdx - i - 1].overlaySrc}
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
      <input
        type="color"
        bind:value={$bg}
        on:change={() => console.log("updated")}
      />
    </label>
  </fieldset>
</section>

<section id="captures">
  {#each $frames as frame, i}
    <!-- FIXME: this width hack sucks and is embarrassing. there's a solution
      with the align-self property, but it seems to not work in this context.
      double-check in a sandbox and fix soon. -->
    {@const width = frameContainerHeight * ($size[0] / $size[1])}
    {@const src = frame.renderSrc}
    <div
      class="capture"
      style:border-color={frameIdx === i ? "red" : "black"}
      bind:clientHeight={frameContainerHeight}
      style:width="{width}px"
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <img {src} on:click={() => (frameIdx = i)} alt="" />
      <button
        class="delete"
        on:click={() => {
          if (!ctx) throw new Error("Error clearing canvas: Context is null.");
          if ($frames.length === 1) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            $frames = [createEmptyFrame(canvas, ctx, $bg)];
            frameIdx = 0;
            return;
          }
          frames.update((f) => f.filter((_, j) => i !== j));
          if (frameIdx >= i) frameIdx--;
        }}
      >
        X
      </button>
      <button
        class="duplicate"
        on:click={() => frames.update((f) => f.toSpliced(i, 0, frame))}
        >📋</button
      >
    </div>
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
  #captures > .capture {
    border-width: 1px;
    height: 100%;
    border-style: solid;
    align-self: flex-start;
    padding: 2px;
  }

  .capture > img {
    height: 100%;
  }

  .capture > button {
    position: absolute;
    opacity: 0;
    transition: 0.2s opacity;
  }

  .capture:hover > button {
    opacity: 1;
  }

  .capture > button.delete {
    top: 0;
    right: 0;
  }

  .capture > button.duplicate {
    top: 50%;
    transform: translateY(-50%);
    right: -1rem;
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
