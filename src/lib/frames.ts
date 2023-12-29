import { get } from "svelte/store";
import { frames, bg, frameIdx } from "./stores";

/**
 * Creates an empty frame object
 *
 * @param canvas Canvas element to generate empty frame image from
 * @returns {App.Frame} Empty frame object
 */
export const createEmptyFrame = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): App.Frame => {
  // capture overlay source as transparent image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const overlaySrc = canvas.toDataURL();

  // capture initial render source as filled image
  ctx.fillStyle = get(bg);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return {
    dirty: false,
    background: get(bg),
    renderSrc: canvas.toDataURL(),
    overlaySrc,
    storageSrc: null,
    redoStack: [],
    undoStack: [],
  };
};

/**
 * Loads frames on page load by checking localStorage for stored frames, or
 * creating a new frame if none are found.
 * @param canvas
 * @param ctx
 * @param fill
 */
export const loadFramesFromStorage = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const storedFrames = localStorage.getItem("frames");
  if (storedFrames !== null) {
    let parsedFrames = JSON.parse(storedFrames);
    if(parsedFrames.length > 0) {
      frames.set(parsedFrames);
      return;
    }
  }
  frames.set([createEmptyFrame(canvas, ctx)]);
};

/**
 * Saves frames to localStorage
 */
export const saveFramesToStorage = () => {
  const storageFrames = get(frames).map((frame) => ({
    ...frame,
    storageSrc: frame.overlaySrc,
    // reset undo/redo stacks since we can't safely store these functions
    undoStack: [],
    redoStack: [],
  }));

  // update frame index if it's out of bounds
  if(get(frameIdx) >= storageFrames.length) frameIdx.set(storageFrames.length - 1);
  localStorage.setItem("frames", JSON.stringify(storageFrames));
};


