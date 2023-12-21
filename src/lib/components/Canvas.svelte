<script lang="ts">
  import { size, matrix, frames } from "$lib/stores";
  import { onMount } from "svelte";
  import Page from "../../routes/+page.svelte";

  export let playing: boolean = false;
  export let panEnabled: boolean = false;
  export let frameIdx: number = 0;
  export let canvas: HTMLCanvasElement;

  let ctx: CanvasRenderingContext2D | null;

  $: if (canvas) canvas.width = $size[0];
  $: if (canvas) canvas.height = $size[1];

  // frame should never be null
  $: frame = $frames[frameIdx];

  $: console.log($frames);

  let frameCommands: ((...args: any) => void)[] = [];

  onMount(() => {
    ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
  });

  let drawEnabled = false;

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
    ctx.stroke();

    // FIXME: lastPos is not stored in frameCommands
    frameCommands.push(
      ((from, to) => {
        return (ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.lineCap = "round";
          ctx.lineWidth = 10;
          ctx.moveTo(...from);
          ctx.lineTo(...to);
          ctx.stroke();
        };
      })(lastPos, [x, y] as [number, number])
    );

    lastPos = [x, y];
  };

  const buildFrameCommandStack = () => {
    if (frameCommands.length === 0) return;
    /**
     * @type {App.Command}
     */
    let command = {
      // shallow copy of commands for given state
      commands: [...frameCommands],
      // @ts-ignore (sveltekit try to type inlined JS challenge (impossible))
      execute: (commands, ctx) => {
        for (const command of commands) command(ctx);
      },
    };
    frame.undoStack = [...frame.undoStack, command];
    // TODO: is this necessary?
    $frames[frameIdx] = frame;
    frameCommands = [];
  };

  const undo = () => {
    // remove last command from undo stack and push to redo stack
    frame.redoStack = [...frame.redoStack, frame.undoStack.slice(-1)[0]];
    frame.undoStack = frame.undoStack.slice(0, -1);
  };

  const redo = () => {
    // remove last command from redo stack and push to undo stack
    frame.undoStack = [...frame.undoStack, frame.redoStack.slice(-1)[0]];
    frame.redoStack = frame.redoStack.slice(0, -1);
  };
</script>

<svelte:window
  on:keydown={(e) => {
    if (playing) return;
    let execReq = false;
    if (e.ctrlKey && e.key === "z") {
      if (frame.undoStack.length === 0) return;
      execReq = true;
      undo();
    } else if (e.ctrlKey && e.key === "y") {
      if (frame.redoStack.length === 0) return;
      execReq = true;
      redo();
    }

    if (!execReq) return;
    if (!ctx) throw new Error("no context");

    // clear canvas, and execute all commands in undo stack to regain
    // current state
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const { commands, execute } of frame.undoStack) {
      execute(commands, ctx);
    }
  }}
  on:mousemove={handleDraw}
  on:mouseup={() => {
    if (playing) return;
    drawEnabled = false;
    buildFrameCommandStack();
    console.log(frame.undoStack);
  }}
/>

<canvas
  bind:this={canvas}
  on:mousedown={(e) => {
    if (playing) return;
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
