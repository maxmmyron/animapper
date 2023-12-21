<script lang="ts">
  import Canvas from "$lib/components/Canvas.svelte";
  import { size, matrix, commands } from "$lib/stores";
  import transforms from "$lib/transforms";
  import { onMount } from "svelte";

  let viewTransforms = transforms();

  // list of screenframes
  let frames: string[] = [];
  let frameIdx = 0;
  $: currentFrame = frames[frameIdx] ?? "";

  let canvas: HTMLCanvasElement;
  $: ctx = canvas?.getContext("2d");

  // TODO: this is part of a hack; should be removed in future
  let frameContainerHeight: number;

  let viewMode: "viewer" | "render" = "viewer";

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
      frameIdx = (frameIdx + 1) % frames.length;
      lag -= 1000 / framerate;
    }
  };

  onMount(async () => requestAnimationFrame(update));

  const clear = () => {
    if (!ctx) throw new Error("no context");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

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
    const x = e.pageX - canvas.width / 2;
    const y = e.pageY - canvas.height / 2;

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
</script>

<svelte:window
  on:mouseup={() => (panEnabled = false)}
  on:mousemove={handleMove}
  on:keydown={(e) => {
    if (e.key == "f") {
      frames = [...frames, canvas.toDataURL()];
      frameIdx = frames.length - 1;
      $commands = [];
      clear();
    }
  }}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
  id="viewer-container"
  bind:clientWidth={$size[0]}
  bind:clientHeight={$size[1]}
  on:mousedown={(e) => {
    if (viewMode === "render") return;
    if (e.button === 1) panEnabled = true;
  }}
  on:wheel={(e) => {
    if (viewMode === "render") return;
    if (e.ctrlKey) handleZoom(e);
    else handleScroll(e);
  }}
>
  <Canvas bind:viewMode bind:canvas bind:panEnabled />
  {#if frames.length > 0 && viewMode === "viewer"}
    {#each { length: overlayCount } as _, i}
      <img
        src={frames[frames.length - (i + 1)]}
        alt=""
        class="overlay"
        style:transform="matrix({$matrix.join(",")})"
        style:width={$size[0]}
        style:height={$size[1]}
        style:opacity={overlayOpacity / (i + 1)}
        style:zIndex={overlayCount - i}
      />
    {/each}
  {/if}
  {#if currentFrame !== "" && viewMode === "render"}
    <div id="output">
      <img src={currentFrame} alt="" />
    </div>
  {/if}
</section>

<section id="controls">
  <div style="display: flex; flex-direction:column">
    <label>
      <input type="radio" bind:group={viewMode} value="viewer" checked />
      Viewer
    </label>
    <label>
      <input type="radio" bind:group={viewMode} value="render" />
      render
    </label>
  </div>
  <button
    on:click={() => {
      frames = [...frames, canvas.toDataURL()];
      frameIdx = frames.length - 1;
      $commands = [];
      clear();
    }}
  >
    Capture</button
  >

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
        max={frames.length}
        bind:value={overlayCount}
        step="1"
      />
      overlay count: {overlayCount}
    </label>
  </fieldset>

  <fieldset>
    <legend>animation controls</legend>
    <button on:click={() => (playing = !playing)} disabled={frames.length == 0}>
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
    <button on:click={clear}>Clear</button>
    <label class="lbl-horz">
      x
      <input type="number" bind:value={$size[0]} min="1" />
    </label>
    <label class="lbl-horz">
      y
      <input type="number" bind:value={$size[1]} min="1" />
    </label>
  </fieldset>
</section>

<section id="captures">
  {#each frames as cap, i}
    <!-- FIXME: this width hack sucks and is embarrassing. there's a solution
      with the align-self property, but it seems to not work in this context.
      double-check in a sandbox and fix soon. -->
    {@const width = frameContainerHeight * ($size[0] / $size[1])}
    <div
      class="capture"
      style:border-color={frameIdx === i ? "red" : "black"}
      bind:clientHeight={frameContainerHeight}
      style:width="{width}px"
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <img src={cap} on:click={() => (frameIdx = i)} alt="" />
      <button
        class="delete"
        on:click={() => (frames = frames.filter((_, j) => i !== j))}
      >
        X
      </button>
      <button
        class="duplicate"
        on:click={() => (frames = frames.toSpliced(i, 0, cap))}>📋</button
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
    position: relative;
    overflow: hidden;
    gap: 1rem;
  }

  .overlay {
    position: absolute;
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

  #output {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #output > img {
    border: 1px solid gray;
  }
</style>
