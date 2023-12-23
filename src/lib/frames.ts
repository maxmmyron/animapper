/**
 * Creates an empty frame object
 *
 * @param canvas Canvas element to generate empty frame image from
 * @returns {App.Frame} Empty frame object
 */
export const createEmptyFrame = (canvas: HTMLCanvasElement): App.Frame => ({
  layers: [
    {
      isDirty: false,
      isVisible: true,
      src: canvas.toDataURL(),
      redoStack: [],
      undoStack: [],
    }, {
      isDirty: false,
      isVisible: true,
      src: canvas.toDataURL(),
      redoStack: [],
      undoStack: [],
    }
  ]

});


