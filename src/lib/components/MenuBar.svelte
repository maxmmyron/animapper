<script lang="ts">
  import { clickOutside } from "$lib/actions";
  import { exportRender } from "$lib/export";
  import { createEmptyFrame } from "$lib/frames";
  import {
    framerate,
    overlayOptions,
    frames,
    size,
    exportSafeSize,
    frameIdx,
  } from "$lib/stores";
  import getTransforms from "$lib/transforms";

  export let canvas: HTMLCanvasElement;
  export let ctx: CanvasRenderingContext2D;
  export let clearFrame: () => void;

  let fileToggled = false;
  let viewToggled = false;

  let showViewPreferences = false;

  /**
   * Whether or not the frames list is equal to an empty frame
   */
  $: isProjectEmpty = $frames.every((frame) => frame.empty);

  /**
   * Rounds the size input to the nearest multiple of 2, if it mismatches the
   * safely-exportable size store
   */
  const roundSizeInput = () => {
    if ($size[0] % 2 !== 0) $size[0] = Math.ceil($size[0] / 2) * 2;
    if ($size[1] % 2 !== 0) $size[1] = Math.ceil($size[1] / 2) * 2;
  };

  const clearProject = () => {
    $frames = [createEmptyFrame(canvas, ctx)];
    getTransforms().reset();
    $frameIdx = 0;
  };
</script>

<nav>
  <article class="nav-item">
    <button on:click|stopPropagation={() => (fileToggled = !fileToggled)}
      ><p>File</p></button
    >
    {#if fileToggled}
      <nav use:clickOutside={() => (fileToggled = false)}>
        <button on:click={clearProject}>new</button>
        <button
          on:click={() =>
            exportRender({ framerate: $framerate, size: $exportSafeSize })}
        >
          export
        </button>
      </nav>
    {/if}
  </article>
  <article class="nav-item">
    <button on:click|stopPropagation={() => (viewToggled = !viewToggled)}
      ><p>View</p></button
    >
    {#if viewToggled}
      <nav
        use:clickOutside={() => {
          // Don't close if we're opening the preferences
          if (showViewPreferences) return;
          viewToggled = false;
        }}
      >
        <button on:click={clearFrame}>clear frame</button>
        <button on:click={() => getTransforms().reset()}>reset view</button>
        <button on:click={() => (showViewPreferences = !showViewPreferences)}>
          preferences
        </button>
      </nav>
    {/if}
  </article>
</nav>

{#if showViewPreferences}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- we stop propagation so when we close the viewer preferences, we don't
    also trigger the nav menu that opened the preferences to close (by bubbling
    the click event to the document) -->
  <div
    class="modal-background"
    on:click|self|stopPropagation={() => (showViewPreferences = false)}
  >
    <section class="modal">
      <header>
        <h1>Preferences</h1>
        <!-- Likewise, stop prop. so document doesn't get click event -->
        <button on:click|stopPropagation={() => (showViewPreferences = false)}>
          close
        </button>
      </header>

      <label class="lbl">
        <input type="range" bind:value={$framerate} min="1" max="60" />
        {$framerate} fps
      </label>
      <fieldset>
        <legend>overlay options</legend>
        <label class="lbl">
          <input
            type="range"
            min="0"
            max="1"
            bind:value={$overlayOptions[1]}
            step="0.01"
          />
          opacity: {$overlayOptions[1]}
        </label>
        <hr />
        <label class="lbl">
          <input
            type="range"
            min="0"
            max={$frames.length}
            bind:value={$overlayOptions[0]}
            step="1"
          />
          overlay count: {$overlayOptions[0]}
        </label>
      </fieldset>
      <fieldset>
        <legend>canvas size</legend>
        <p>NOTE: project must be empty to change the canvas size</p>
        <label class="lbl-horz">
          x
          <input
            type="number"
            bind:value={$size[0]}
            on:change={roundSizeInput}
            step="2"
            min="16"
            disabled={!isProjectEmpty}
          />
        </label>
        <br />
        <label class="lbl-horz">
          y
          <input
            type="number"
            bind:value={$size[1]}
            on:change={roundSizeInput}
            step="2"
            min="16"
            disabled={!isProjectEmpty}
          />
        </label>
      </fieldset>
    </section>
  </div>
{/if}

<style>
  nav {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    background-color: #333;
    color: #fff;
    padding: 1rem;
    overflow: visible;
    /* Higher z-index than viewer, which comes next in grid */
    z-index: 2;
  }

  .nav-item {
    position: relative;
  }

  .nav-item > nav {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: #333;
    color: #fff;
    padding: 1rem;
    overflow: visible;
  }

  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    backdrop-filter: blur(8px);

    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
  }

  section.modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 20rem;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  section.modal > header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
</style>
