<script lang="ts">
  import Canvas from "$lib/components/Canvas.svelte";
  import { size } from "$lib/stores";
  import { onMount } from "svelte";

  // list of screencaps
  let caps: string[] = [];
  // current screencap index
  let captureFrame = 0;

  let canvas: HTMLCanvasElement;
  let captureHeight: number;

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

<section
  id="viewer-container"
  bind:clientWidth={$size[0]}
  bind:clientHeight={$size[1]}
>
  <Canvas bind:viewMode bind:canvas />
  {#if caps.length > 0 && viewMode === "viewer"}
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
    <div
      id="output"
      style="display: {viewMode === 'render' ? 'block' : 'none'};"
    >
      <img src={currCap} />
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
      caps = [...caps, canvas.toDataURL()];
      let ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }}
  >
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
    <!-- FIXME: this width hack sucks and is embarrassing. there's a solution
      with the align-self property, but it seems to not work in this context.
      double-check in a sandbox and fix soon. -->
    <div
      class="capture"
      style:border-color={captureFrame === i ? "red" : "black"}
      bind:clientHeight={captureHeight}
      style:width="{captureHeight * ($size[0] / $size[1])}px"
    >
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <img src={cap} on:click={() => (captureFrame = i)} alt="" />
      <button
        class="delete"
        on:click={() => (caps = caps.filter((_, j) => i !== j))}
      >
        X
      </button>
      <button
        class="duplicate"
        on:click={() => (caps = caps.toSpliced(i, 0, cap))}>📋</button
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
    overflow-x: hidden;
    display: flex;
    gap: 1rem;
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

  #output {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
