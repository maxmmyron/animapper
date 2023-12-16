<script lang="ts">
  import { onMount } from "svelte";
  import * as Cesium from "cesium";
  import { PUBLIC_GMAPS_API_KEY } from "$env/static/public";

  // TODO: https://developer.chrome.com/docs/web-platform/region-capture
  // TODO: https://github.com/xataio/screenshot

  let caps: string[] = [];
  let capIdx = 0;
  let intervalID: NodeJS.Timeout | null = null;

  let v: HTMLVideoElement;
  let cropContainer: HTMLElement;
  // @ts-ignore
  let cropTarget: CropTarget | null = null;

  let playing = false;

  let isViewerShown = true;
  let viewer: Cesium.Viewer;

  $: if (playing) {
    if (intervalID) clearInterval(intervalID);

    intervalID = setInterval(() => {
      capIdx = (capIdx + 1) % caps.length;
    }, 1000 / 12);
  } else {
    if (intervalID) clearInterval(intervalID);
  }

  $: currCap = caps[capIdx] ?? "";

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
  });

  let okay = false;
  const ok = async () => {
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
    okay = true;
  };

  const screencap = async () => {
    const canvas = document.createElement("canvas");
    // @ts-ignore
    canvas.width = v.srcObject?.getVideoTracks()[0].getSettings().width ?? 0;
    // @ts-ignore
    canvas.height = v.srcObject?.getVideoTracks()[0].getSettings().height ?? 0;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(v, 0, 0);

    const screenshot = canvas.toDataURL();

    // @ts-ignore
    // v.srcObject?.getTracks().forEach((track) => track.stop());
    // v.srcObject = null;

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
  {#if !okay}
    <button on:click={ok}>Start</button>
  {:else}
    <button on:click={async () => (caps = [...caps, await screencap()])}>
      Capture
    </button>
  {/if}

  <button on:click={() => (playing = !playing)} disabled={caps.length == 0}>
    {playing ? "Pause" : "Play"}
  </button>
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
          capIdx = i;
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
    overflow-x: hidden;
    display: flex;
    gap: 1rem;
  }

  #cesium-container {
    width: 100%;
    height: 100%;
    overflow: clip;
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
