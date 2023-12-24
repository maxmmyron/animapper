<script lang="ts">
  import { createEmptyFrame } from "$lib/frames";
  import { frameIdx, size, frames, bg } from "$lib/stores";

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

  let container: HTMLElement;
  $: isCurrentFrame = idx === $frameIdx;
  $: shouldScroll = container && isCurrentFrame;

  $: if (shouldScroll) {
    container.scrollIntoView({
      behavior: "instant",
      inline: "center",
    });
  }
</script>

<article
  bind:this={container}
  class:active={isCurrentFrame}
  style:aspect-ratio={$size[0] / $size[1]}
  style:z-index={isCurrentFrame ? 1 : 0}
  style:width="{container?.clientHeight * ($size[0] / $size[1])}px"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <img src={frame.renderSrc} on:click={() => ($frameIdx = idx)} alt="" />
  <button
    class="delete"
    on:click={() => {
      if ($frames.length === 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $frames = [createEmptyFrame(canvas, ctx, $bg)];
        $frameIdx = 0;
        return;
      }
      frames.update((f) => f.filter((_, j) => idx !== j));
      if ($frameIdx >= idx) $frameIdx--;
      if ($frameIdx < 0) $frameIdx = 0;
    }}
  >
    X
  </button>
  <button
    class="duplicate"
    on:click={() => frames.update((f) => f.toSpliced(idx, 0, frame))}
    >📋
  </button>
</article>

<style>
  article {
    border: 1px solid rgb(15, 15, 15);
    padding: 0.25rem;
    border-radius: 4px;
    position: relative;
    height: 100%;

    transition: 0.2s;
  }

  article.active {
    border-color: rgb(255, 0, 0);
  }

  article > img {
    height: 100%;
  }

  article > button {
    position: absolute;
    opacity: 0;
    transition: 0.2s opacity;
  }

  article:hover > button {
    opacity: 1;
  }

  article > button.delete {
    top: 0;
    right: 0;
  }

  article > button.duplicate {
    top: 50%;
    transform: translateY(-50%);
    right: -1rem;
  }
</style>
