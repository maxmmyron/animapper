/**
 * Creates an empty frame object
 *
 * @param canvas Canvas element to generate empty frame image from
 * @returns {App.Frame} Empty frame object
 */
export const createEmptyFrame = (canvas: HTMLCanvasElement): App.Frame => ({
  dirty: false,
  background: "#ffffff", // TODO: Use bg store
  src: canvas.toDataURL(),
  redoStack: [],
  undoStack: [],
});


