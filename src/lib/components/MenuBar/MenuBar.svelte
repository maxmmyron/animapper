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
  import NavItem from "./NavItem.svelte";

  export let canvas: HTMLCanvasElement;
  export let ctx: CanvasRenderingContext2D;
  export let clearFrame: () => void;

  let openMenuView: null | "file" | "view" = null;

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

{#if openMenuView !== null}
  <div
    class="menu-overlay"
    use:clickOutside={() => (openMenuView = null)}
  ></div>
{/if}

<nav
  class="row-start-1 col-start-1 m-2 px-3 flex justify-start items-center gap-5 bg-white rounded-lg shadow-md border border-gray-200 overflow-visible z-10"
>
  <NavItem
    type="file"
    bind:view={openMenuView}
    items={{
      "new project": clearProject,
      "export render": () =>
        exportRender({ framerate: $framerate, size: $exportSafeSize }),
    }}
  />
  <NavItem
    type="view"
    bind:view={openMenuView}
    items={{
      "clear frame": clearFrame,
      "reset view": () => getTransforms().reset(),
      preferences: () => (showViewPreferences = true),
    }}
  />
</nav>

{#if showViewPreferences}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="modal-background"
    on:click|self={() => (showViewPreferences = false)}
  >
    <section class="modal">
      <header>
        <h1>Preferences</h1>
        <button on:click={() => (showViewPreferences = false)}> close </button>
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
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    /* Position this overlay atop the viewer, control bar, and timeline */
    z-index: 2;
  }

  .nav-item > nav > button {
    background-color: transparent;
    border: none;
    color: #333;
    font-size: 1rem;
    width: 100%;
    text-align: left;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;
  }

  .nav-item > nav > button:hover {
    background-color: rgba(0, 0, 0, 0.1);
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
