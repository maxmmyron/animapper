<script lang="ts">
  import { clickOutside } from "$lib/actions";
  import { createEmptyFrame } from "$lib/frames";
  import { frameIdx, size, frames, openCaptureContextIdx } from "$lib/stores";
  import { fly } from "svelte/transition";
  import TrashIcon from "./Icons/TrashIcon.svelte";

  /**
   * FIXME: there seems to exist a bug in firefox where flex items are sized way
   * too large in the following case
   * <display=grid>
   *   <display=flex>
   *     <item>
   *     <item>
   *     ...
   * where the flex container is relatively sized based on the grid container:
   * .grid {grid-template-rows: ...;}
   * .flex {grid-area: ...; height: 100%; display: flex; }
   *
   * This does not occur in Chromium-based browsers.
   *
   * See https://jsfiddle.net/mmyron/hs7r3e8t/7/ for a minimal example.
   */

  /**
   * Binding for current frame that clears canvas and updates frame command
   */
  export let frame: App.Frame;
  export let idx: number;
  export let canvas: HTMLCanvasElement;
  export let ctx: CanvasRenderingContext2D;
  export let captureScroll: number;

  let container: HTMLElement;
  $: isCurrentFrame = idx === $frameIdx;

  let contextMenu: HTMLElement | null = null;
  let contextMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
  let positionContainerFromBottom = false;

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    // set to current frame so z-index is correct
    $frameIdx = idx;
    $openCaptureContextIdx = idx;

    const yPos = e.clientY - container.offsetTop;

    if (yPos > container.clientHeight / 2) {
      positionContainerFromBottom = true;
    } else {
      positionContainerFromBottom = false;
    }

    contextMenuPosition = {
      x: e.clientX - container.offsetLeft + captureScroll,
      y: e.clientY - container.offsetTop,
    };
  };

  const deleteFrame = () => {
    if ($frames.length === 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $frames = [createEmptyFrame(canvas, ctx)];
      $frameIdx = 0;
      return;
    }
    frames.update((f) => f.filter((_, j) => idx !== j));
    if ($frameIdx >= idx) $frameIdx--;
    if ($frameIdx < 0) $frameIdx = 0;
  };
</script>

<div
  role="button"
  tabindex="0"
  class="relative h-full group flex-shrink-0"
  bind:this={container}
  class:active={isCurrentFrame}
  style:aspect-ratio={$size[0] / $size[1]}
  style:z-index={isCurrentFrame ? 1 : 0}
  style:width="{container?.clientHeight * ($size[0] / $size[1])}px"
  on:click={() => ($frameIdx = idx)}
  on:contextmenu={handleContextMenu}
  on:keydown={(e) => {
    if (e.key === "Delete" && isCurrentFrame) deleteFrame();
  }}
>
  <div
    class="rounded-md transition-colors border {isCurrentFrame
      ? 'border-blue-200 shadow-lg'
      : 'border-slate-900 shadow-md'} overflow-hidden"
  >
    <img src={frame.renderSrc} alt="" class="h-full" />
  </div>

  {#if $openCaptureContextIdx === idx}
    <nav
      bind:this={contextMenu}
      class="p-3 bg-white shadow-md gap-2 absolute z-10 border-gray-200 w-max"
      use:clickOutside={() => {
        $openCaptureContextIdx = -1;
      }}
      style:top="{positionContainerFromBottom
        ? contextMenuPosition.y - contextMenu.clientHeight
        : contextMenuPosition.y}px"
      style:left="{contextMenuPosition.x}px"
      in:fly={{ y: -15, duration: 100 }}
      out:fly={{ y: -15, duration: 100 }}
    >
      <button
        class="p-2 rounded-md w-full flex gap-2 hover:bg-gray-200"
        on:click={() => {
          $openCaptureContextIdx = -1;
          deleteFrame();
        }}
      >
        <TrashIcon />
        <p class="text-sm">Delete Frame</p>
      </button>
    </nav>
  {/if}
</div>
