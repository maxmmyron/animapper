<script lang="ts">
  import { size, position } from "$lib/stores";
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
      e.clientX - canvas.getBoundingClientRect().left,
      e.clientY - canvas.getBoundingClientRect().top,
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

<svelte:window on:mousemove={handleDraw} />

<canvas
  id="canvas"
  style:visibility={viewMode === "viewer" ? "visible" : "hidden"}
  style="transform: translate({$position[0]}px, {$position[1]}px);"
  bind:this={canvas}
  on:mousedown={() => (drawEnabled = true)}
  on:mouseup={() => (drawEnabled = false)}
/>

<style>
  canvas {
    background: repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% /
      10px 10px;
    border: 1px solid black;
  }
</style>