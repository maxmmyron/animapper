<script lang="ts">
  import {
    exportSafeSize,
    matrix,
    frames,
    frameIdx,
    isPlaying,
  } from "$lib/stores";
  import { retrieveStoredFrames, saveFramesToStorage } from "$lib/frames";
  import { onMount } from "svelte";

  export let panEnabled: boolean = false;
  export let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  // FIXME: shaky! creating the first frame requires a canvas, but we're
  // also trying to create the canvas at the same time we're indexing $frames
  $: frame = $frames[$frameIdx];

  /**
   * when the frame changes, we need to replicate the frame state.
   * this line simultaneously ensures that we don't replicate the frame state
   * before frame is defined, and that we replicate the frame state when frame
   * changes.
   */
  $: frame && replicateFrameState();

  /**
   * Holds an array of commands to replicate the current command being executed
   * on the canvas (e.g.: drawing a line, clearing the canvas, etc.).
   */
  let actionCommands: ((...args: any) => void)[] = [];

  onMount(() => {
    // retrieve the canvas context on load
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "Error mounting canvas: Canvas context could not be retrieved."
      );
    ctx = context;

    $frames = retrieveStoredFrames(canvas, ctx);

    // auto-save frames to storage on change
    frames.subscribe((frames) => {
      saveFramesToStorage(frames);
    });

    /**
     * When the frame changes size / bg, we update the canvas size/bg and redraw
     * the frame state to the canvas. We subscribe to the size/bg stores in
     * the onMount hook so we don't run any changes before we're certain we have
     * a valid frame/canvas context.
     */

    exportSafeSize.subscribe((size) => {
      canvas.width = size[0];
      canvas.height = size[1];

      // TODO: remove
      if (!frame) {
        console.warn("WARNING! Frame is null on size change.");
        return;
      }

      frame.dirty = true;
      replicateFrameState().then(() => captureFrame());
    });
  });

  let drawEnabled = false;

  let lastPos: [number, number] = [0, 0];
  const handleDraw = (e: MouseEvent) => {
    if (panEnabled) return;

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

    actionCommands.push(
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

  /**
   * Builds and pushes a new Command object to the undo command stack. This is
   * run when a multi-step command is finished (e.g.: drawing a line takes
   * multiple moveTo/lineTo calls; we need to store these calls before creating
   * a new command so they are treated as a single command to perform).
   *
   * @param type the type of command to push to the stack. This can be used to
   * ignore some commands when replicating the frame state (e.g.: we don't want
   * to replicate the entire "clear" command if the background isn't transparent
   * when we want to get a the frame contents as an overlay).
   */
  const pushCommandToStack = (type: App.CommandType) => {
    if (actionCommands.length === 0) return;
    let command: App.Command = {
      type,
      // shallow copy of commands for given state
      // TODO: is shallow copy necessary?
      commands: [...actionCommands],
      // @ts-ignore (sveltekit try to type inlined JS challenge (impossible))
      execute: (commands, ctx: CanvasRenderingContext2D) => {
        for (const command of commands) command(ctx);
      },
    };
    frame.undoStack = [...frame.undoStack, command];

    // frame is dirty as we've added a new command to the undo stack and the
    // captured src no longer matches the canvas state
    frame.dirty = true;

    // the frame is not empty anymore
    frame.empty = false;

    // we have a new series of commands necessary to replicate the frame state,
    // so we can clear the redo stack if there are any commands in it.
    if (frame.redoStack.length > 0) frame.redoStack = [];

    actionCommands = [];
  };

  /**
   * Pops the last command from the undo stack, pushes it to the redo stack,
   * and then re-executes the undo stack to regain the previous frame state
   */
  const undo = () => {
    // remove last command from undo stack and push to redo stack
    frame.redoStack = [...frame.redoStack, frame.undoStack.slice(-1)[0]];
    frame.undoStack = frame.undoStack.slice(0, -1);
    frame.dirty = true;
    replicateFrameState().then(() => captureFrame());
  };

  /**
   * Pops the last command from the redo stack, pushes it to the undo stack,
   * and then re-executes the undo command stack to regain the frame state
   */
  const redo = () => {
    // remove last command from redo stack and push to undo stack
    frame.undoStack = [...frame.undoStack, frame.redoStack.slice(-1)[0]];
    frame.redoStack = frame.redoStack.slice(0, -1);
    frame.dirty = true;
    replicateFrameState().then(() => captureFrame());
  };

  const drawImageToCanvas = async (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve();
      };
    });

  const replicateFrameState = async () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // if there is a saved storage state, draw it to the canvas
    if (frame.storageSrc) {
      await drawImageToCanvas(frame.storageSrc);
    }

    // execute all commands in undo stack
    for (const { commands, execute } of frame.undoStack) {
      execute(commands, ctx);
    }
  };

  /**
   * Clears the canvas frame and adds the clear function to the frame command
   * stack.
   *
   * Component export: used outside of component for toolbar clear button,
   * while maintaining undo/redo functionality.
   */
  export const clearFrame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    actionCommands = [];

    actionCommands.push((ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    pushCommandToStack("clear");
    captureFrame();
  };

  /**
   * Captures the current frame using `canvas.toDataURL()`, and stores it in the
   * current frame's `src` property.
   *
   * Component export: allows for the capture of the current frame when the user
   * presses the "capture" button in the toolbar.
   */
  export const captureFrame = () => {
    if (actionCommands.length > 0) pushCommandToStack("draw");
    frame.dirty = false;

    // directly capture frame to get render source
    let src = canvas.toDataURL();
    frame.renderSrc = src;

    // clear canvas, then draw overlay source (transparent background + commands)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const { type, commands, execute } of frame.undoStack) {
      if (type === "clear") ctx.clearRect(0, 0, canvas.width, canvas.height);
      else execute(commands, ctx);
    }

    // capture overlay source
    src = canvas.toDataURL();
    frame.overlaySrc = src;

    // reset canvas to frame state
    replicateFrameState();

    $frames[$frameIdx] = frame;
  };
</script>

<svelte:window
  on:keydown={(e) => {
    if ($isPlaying) return;
    if (e.ctrlKey && e.key === "z") {
      if (frame.undoStack.length === 0) return;
      undo();
    } else if (e.ctrlKey && e.key === "y") {
      if (frame.redoStack.length === 0) return;
      redo();
    }
  }}
  on:mousemove={handleDraw}
  on:mouseup={() => {
    if ($isPlaying) return;
    // if we weren't drawing, don't capture frame
    if (!drawEnabled) return;
    drawEnabled = false;
    pushCommandToStack("draw");
    captureFrame();
  }}
/>

<canvas
  bind:this={canvas}
  on:mousedown={(e) => {
    if ($isPlaying) return;
    if (e.button === 0) drawEnabled = true;
  }}
/>

<style>
  canvas {
    position: absolute;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
  }
</style>
