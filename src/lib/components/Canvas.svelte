<script lang="ts">
  import { size, matrix, commands } from "$lib/stores";
  import { onMount } from "svelte";

  export let viewMode: "viewer" | "render" = "viewer";
  export let panEnabled: boolean = false;

  export let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  $: if (canvas) canvas.width = $size[0];
  $: if (canvas) canvas.height = $size[1];

  let redoCommands: [number, number, number, number][][] = [];

  onMount(() => {
    ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Failed to get canvas context");
  });

  let drawEnabled = false;

  let command: [number, number, number, number][] = [];
  let lastPos: [number, number] = [0, 0];
  const handleDraw = (e: MouseEvent) => {
    if (!ctx || panEnabled) return;

    const [x, y] = [
      (e.clientX - canvas.getBoundingClientRect().left) / $matrix[0],
      (e.clientY - canvas.getBoundingClientRect().top) / $matrix[3],
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
    command.push([...lastPos, x, y]);
    // empty out redo since we've mutated commands
    redoCommands = [];
    ctx.stroke();

    lastPos = [x, y];
  };

  const reexecuteCommands = () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const command of $commands) {
      for (const linePair of command) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = 10;
        ctx.moveTo(linePair[0], linePair[1]);
        ctx.lineTo(linePair[2], linePair[3]);
        ctx.stroke();
      }
    }
  };
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.ctrlKey && e.key === "z") {
      if (!$commands.length) return;
      redoCommands = [...redoCommands, $commands.slice(-1)[0]];
      commands.update((c) => c.slice(0, -1));
      reexecuteCommands();
    }
    if (e.ctrlKey && e.key === "y") {
      if (!redoCommands.length) return;
      commands.update((c) => [...c, redoCommands.slice(-1)[0]]);
      redoCommands = redoCommands.slice(0, -1);
      reexecuteCommands();
    }
  }}
  on:mousemove={handleDraw}
  on:mouseup={() => {
    drawEnabled = false;
    if (command.length) commands.update((c) => [...c, command]);
    command = [];
    console.log($commands);
  }}
/>

<canvas
  style:visibility={viewMode === "viewer" ? "visible" : "hidden"}
  style:transform="matrix({$matrix.join(",")})"
  bind:this={canvas}
  on:mousedown={(e) => {
    if (e.button === 0) drawEnabled = true;
  }}
/>

<style>
  canvas {
    position: absolute;
    background: repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% /
      10px 10px;
    border: 1px solid rgba(0 0 0 / 25%) inset;
  }
</style>
