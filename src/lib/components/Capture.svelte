<script lang="ts">
  import { createEmptyFrame } from "$lib/frames";
  import { frameIdx, frames } from "$lib/stores";

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

  $: isCurrentFrame = idx === $frameIdx;

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
  class="relative h-32 w-32 group flex-shrink-0 border {isCurrentFrame
    ? 'border-red-300'
    : 'border-zinc-400'} overflow-hidden"
  class:active={isCurrentFrame}
  style:z-index={isCurrentFrame ? 1 : 0}
  on:click={() => ($frameIdx = idx)}
  on:keydown={(e) => {
    if (e.key === "Delete" && isCurrentFrame) deleteFrame();
  }}
>
  <img src={frame.renderSrc} alt="" class="w-full h-full object-cover" />
</div>
