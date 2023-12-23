<script lang="ts">
  import { createEmptyFrame } from "$lib/frames";
  import { frameIdx, size, frames, bg } from "$lib/stores";
  import { onMount } from "svelte";

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

  // TODO: this is part of a hack; should be removed in future
  let frameContainerHeight: number;
</script>

<article
  bind:this={container}
  style:border-color={isCurrentFrame ? "red" : "black"}
  bind:clientHeight={frameContainerHeight}
  style:width="{frameContainerHeight * ($size[0] / $size[1])}px"
>
  <p style="position:absolute; top:12px; left:12px;">
    {idx}, {$frameIdx}, {isCurrentFrame}
  </p>
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
    border-width: 1px;
    height: 100%;
    border-style: solid;
    align-self: flex-start;
    padding: 2px;
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
