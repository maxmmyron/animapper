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
  import { scale } from "svelte/transition";
  import NavItem from "./NavItem.svelte";
  import CrossIcon from "../Icons/CrossIcon.svelte";

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
    $frameIdx = 0;
  };
</script>

<!-- This overlay prevents us from activating hover/click events if we open a
  menu -->
{#if openMenuView !== null}
  <div
    class="fixed top-0 left-0 w-full h-full z-10"
    use:clickOutside={() => (openMenuView = null)}
  ></div>
{/if}

<nav
  class="row-start-1 col-start-1 m-2 mb-4 p-2 flex justify-start items-center gap-2 bg-white rounded-xl shadow-md border border-gray-200 overflow-visible z-10"
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
    class="fixed top-0 left-0 w-full h-full z-20 flex justify-center items-center backdrop-blur"
    on:click|self={() => (showViewPreferences = false)}
  >
    <section
      class="max-w-md bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col gap-5"
      transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
    >
      <header class="flex pt-4 px-4">
        <h1 class="flex-1 text-2xl font-semibold">Preferences</h1>
        <button
          class="w-5 h-5 rounded-sm"
          on:click={() => (showViewPreferences = false)}><CrossIcon /></button
        >
      </header>

      <!-- TODO: use snippets the second svelte 5 is prod stable -->
      <main
        class="grid grid-cols-[max-content,1fr,minmax(3rem,max-content)] grid-flow-row gap-2 mb-4"
      >
        <hr class="col-span-full border-gray-200" />
        <h2 class="mx-4 text-lg font-semibold col-span-full">
          General options
        </h2>
        <p class="ml-4">Framerate</p>
        <input type="range" bind:value={$framerate} min="1" max="60" />
        <p class="mr-4">{$framerate} fps</p>
        <hr class="col-span-full border-gray-200" />
        <h2 class="mx-4 text-lg font-semibold col-span-full">
          Overlay Options
        </h2>
        <p class="ml-4">Opacity</p>
        <input
          type="range"
          min="0"
          max="1"
          bind:value={$overlayOptions[1]}
          step="0.01"
        />
        <p class="mr-4">{($overlayOptions[1] * 100).toFixed(0)}%</p>
        <p class="ml-4">Overlay count</p>
        <input
          type="range"
          min="0"
          max={$frames.length}
          bind:value={$overlayOptions[0]}
          step="1"
        />
        <p class="mr-4">{$overlayOptions[0]}</p>
        <hr class="col-span-full border-gray-200" />
        <h2 class="mx-4 text-lg font-semibold col-span-full">
          Overlay Options
        </h2>
        <p class="mx-4 text-sm italic text-gray-600 col-span-full">
          Note: project must be empty to change the canvas size.
        </p>

        <label for="id" class="ml-4 peer-disabled/width:opacity-50">Width</label
        >
        <input
          type="number"
          id="width"
          class="border border-gray-300 rounded-md peer/width disabled:opacity-50 disabled:cursor-not-allowed"
          bind:value={$size[0]}
          on:change={roundSizeInput}
          step="2"
          min="16"
          disabled={!isProjectEmpty}
        />
        <output class="mr-4 peer-disabled/width:opacity-50">{$size[0]}px</output
        >

        <label for="height" class="ml-4 peer-disabled/height:opacity-50"
          >Height</label
        >
        <input
          type="number"
          id="height"
          class="border border-gray-300 rounded-md peer/height disabled:opacity-50 disabled:cursor-not-allowed"
          bind:value={$size[1]}
          on:change={roundSizeInput}
          step="2"
          min="16"
          disabled={!isProjectEmpty}
        />
        <output for="height" class="mr-4 peer-disabled/height:opacity-50"
          >{$size[1]}px</output
        >
      </main>
    </section>
  </div>
{/if}
