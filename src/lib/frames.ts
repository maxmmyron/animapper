import { get } from "svelte/store";
import { frames, bg } from "./stores";

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
export const loadFrames = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): App.Frame[] => {
  const storedFrames = localStorage.getItem("frames");
  if (storedFrames !== null) {
    console.log("Found stored frames, loading...");
    const storedFramesObj = JSON.parse(storedFrames);
    console.log(storedFramesObj);
    return storedFramesObj;
  } else {
    console.log("No stored frames found, creating new frame");
    return [createEmptyFrame(canvas, ctx)];
  }
};

export const saveFramesToStorage = () => {
  localStorage.setItem("frames", JSON.stringify(frames));
};


