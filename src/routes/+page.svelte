<script lang="ts">
  import { onMount } from "svelte";
  import * as Cesium from "cesium";
  import { PUBLIC_GMAPS_API_KEY } from "$env/static/public";
  import type { Action } from "svelte/action";

  // whether or not we can take a screencap
  let screencapsRendered = 0;
  // whether or not we've requested a screencap
  let screencapRequested = false;
  const screencap: Action = (node) => {
    screencapsRendered += 1;

    return {
      destroy: () => {
        screencapsRendered -= 1;

        if (screencapsRendered === 0) {
          setTimeout(async () => {
            caps = [...caps, await takeScreencap()];
            screencapRequested = false;
          }, 250);
        }
      },
    };
  };

  // list of screencaps
  let caps: string[] = [];
  // current screencap index
  let captureFrame = 0;

  let opacity = 0.5;
  let numOverlays = 1;
  let framerate = 12;

  let v: HTMLVideoElement;
  let cropContainer: HTMLElement;
  // @ts-ignore
  let cropTarget: CropTarget | null = null;

  let playing = false;

  let isViewerShown = true;
  let viewer: Cesium.Viewer;

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
    // @ts-ignore
    if ("CropTarget" in self && "fromElement" in CropTarget) {
      // @ts-ignore
      cropTarget = await CropTarget.fromElement(cropContainer);
    }
    if (!cropTarget) {
      alert("crop target is not supported");
      return;
    }

    Cesium.GoogleMaps.defaultApiKey = PUBLIC_GMAPS_API_KEY;
    Cesium.RequestScheduler.requestsByServer["tiles.googleapis.com:443"] = 18;

    viewer = new Cesium.Viewer("cesium-container", {
      // @ts-ignore
      imageryProvider: false,
      baseLayerPicker: false,
      homeButton: false,
      fullscreenButton: false,
      navigationHelpButton: false,
      vrButton: false,
      sceneModePicker: false,
      geocoder: false,
      globe: false,
      infobox: false,
      selectionIndicator: false,
      timeline: false,
      projectionPicker: false,
      clockViewModel: undefined,
      animation: false,
      requestRenderMode: true,
    });

    viewer.scene.skyAtmosphere.show = true;

    try {
      const tileset = await Cesium.createGooglePhotorealistic3DTileset();
      viewer.scene.primitives.add(tileset);
    } catch (e) {
      console.error(e);
    }

    requestAnimationFrame(update);
  });

  let mediaLoaded = false;
  const loadDispalyMedia = async () => {
    if (!navigator.mediaDevices) {
      alert("No media devices");
      return;
    }
    // @ts-ignore
    if (!cropTarget) {
      alert("crop target is not supported");
      return;
    }

    let stream = await navigator.mediaDevices.getDisplayMedia({
      // @ts-ignore
      preferCurrentTab: true,
    });

    const [track] = stream.getVideoTracks();
    // @ts-ignore
    await track.cropTo(cropTarget);

    v.srcObject = stream;
    mediaLoaded = true;
  };

  const takeScreencap = async () => {
    const canvas = document.createElement("canvas");
    // @ts-ignore
    canvas.width = v.srcObject?.getVideoTracks()[0].getSettings().width ?? 0;
    // @ts-ignore
    canvas.height = v.srcObject?.getVideoTracks()[0].getSettings().height ?? 0;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(v, 0, 0);
    const screenshot = canvas.toDataURL();

    return screenshot;
  };
</script>

<svelte:head>
  <link
    href="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.105/Build/Cesium/Widgets/widgets.css"
    rel="stylesheet"
  />
</svelte:head>

<section id="cesium" bind:this={cropContainer}>
  <div
    id="cesium-container"
    style="visibility: {isViewerShown ? 'visible' : 'hidden'};"
  />
  {#if caps.length > 0 && !screencapRequested && isViewerShown}
    {#each { length: numOverlays } as _, i}
      <img
        use:screencap
        src={caps[caps.length - (i + 1)]}
        alt=""
        id="overlay"
        style:opacity={opacity / (i + 1)}
        style:zIndex={numOverlays - i}
      />
    {/each}
  {/if}
  {#if currCap !== ""}
    <div id="output" style="display: {!isViewerShown ? 'block' : 'none'};">
      <img src={currCap} />
    </div>
  {/if}
</section>

<section id="controls">
  <div style="display:Flex; flex-direction:column">
    <label>
      <input type="radio" bind:group={isViewerShown} value={true} />
      Viewer
    </label>
    <label>
      <input type="radio" bind:group={isViewerShown} value={false} checked />
      render
    </label>
  </div>
  {#if !mediaLoaded}
    <button on:click={loadDispalyMedia}>Enable Screencaps</button>
  {:else}
    <button
      on:click={async () => {
        if (caps.length == 0) caps = [...caps, await takeScreencap()];
        else screencapRequested = true;
      }}
    >
      Capture
    </button>
  {/if}

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

  {screencapsRendered}
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

<!-- svelte-ignore a11y-media-has-caption -->
<video bind:this={v} autoplay />

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
