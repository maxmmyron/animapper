/**
 * Creates an empty frame object
 *
 * @param canvas Canvas element to generate empty frame image from
 * @returns {App.Frame} Empty frame object
 */
export const createEmptyFrame = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fill: string): App.Frame => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const overlaySrc = canvas.toDataURL();

  // reset canvas
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return {
    dirty: false,
    background: fill,
    renderSrc: canvas.toDataURL(),
    overlaySrc,
    redoStack: [],
    undoStack: [],
  };
};


