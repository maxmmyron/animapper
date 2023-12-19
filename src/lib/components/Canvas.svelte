<script lang="ts">
  import { size, position, zoom, origin } from "$lib/stores";
  import { onMount } from "svelte";

  export let viewMode: "viewer" | "render" = "viewer";
  export let resposCanvas: boolean = false;

  export let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  $: if (canvas) canvas.width = $size[0];
  $: if (canvas) canvas.height = $size[1];

  onMount(() => {
    ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Failed to get canvas context");
  });

  let drawEnabled = false;

  let lastPos: [number, number] = [0, 0];
  const handleDraw = (e: MouseEvent) => {
    if (!ctx || resposCanvas) return;

    const [x, y] = [
      (e.clientX - canvas.getBoundingClientRect().left) / $zoom,
      (e.clientY - canvas.getBoundingClientRect().top) / $zoom,
    ];

    if (!drawEnabled) {
      lastPos = [x, y];
      return;
    }

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.moveTo(...lastPos);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos = [x, y];
  };
</script>

<svelte:window
  on:mousemove={handleDraw}
  on:mouseup={() => (drawEnabled = false)}
/>

<canvas
  style:visibility={viewMode === "viewer" ? "visible" : "hidden"}
  style="--origin-x: {$origin[0]}px; --origin-y: {$origin[1]}px;
    transform: translate({$position[0]}px, {$position[1]}px) scale({$zoom});"
  bind:this={canvas}
  on:mousedown={() => (drawEnabled = true)}
/>

<style>
  canvas {
    background: repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% /
      10px 10px;
    border: 1px solid rgba(0 0 0 / 25%) inset;
    transform-origin: calc(var(--origin-x)) calc(var(--origin-y));
  }
</style>
