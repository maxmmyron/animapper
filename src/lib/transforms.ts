// credit: https://stackoverflow.com/a/60235061/9473692

import { matrix } from "$lib/stores";

/**
 * Creates a transforms object that handles panning and zooming via a
 * 2D transformation matrix
 * @returns An instance of the transforms object
 */
const transforms = () => {
  let mat = [1, 0, 0, 1, 0, 0];
  let pos = [0, 0];
  let scale = 0.9;
  let dirty = false;

  /**
   * Resets the transforms to their default values
   */
  const reset = () => {
    matrix.set([0.9, 0, 0, 0.9, 0, 0]);
    mat = [1, 0, 0, 1, 0, 0];
    pos = [0, 0];
    scale = 0.9;
    dirty = false;
  }

  /**
   * Applies the current transforms to the matrix store, and saves the
   * current transforms to localStorage
   */
  const apply = () => {
    if (dirty) updateMatrix();
    matrix.set(mat);
    saveTransformsToStorage();
  };

  /**
   * Updates the matrix if the transforms have changed
   */
  const updateMatrix = () => {
    dirty = false;
    mat = [scale, 0, 0, scale, ...pos];
  };

  /**
   * Pans the canvas by the specified amount
   * @param amount Amount to pan by
   */
  const pan = (amount: [number, number]) => {
    if (dirty) updateMatrix();
    pos[0] += amount[0];
    pos[1] += amount[1];
    dirty = true;
  };

  /**
   * Zooms the canvas by the specified factor, centered on the specified
   * @param zoomPos Position to zoom in on
   * @param factor Zoom factor
   */
  const zoom = (zoomPos: [number, number], factor: number) => {
    if (dirty) updateMatrix();
    scale *= factor;

    pos[0] = zoomPos[0] - (zoomPos[0] - pos[0]) * factor;
    pos[1] = zoomPos[1] - (zoomPos[1] - pos[1]) * factor;

    dirty = true;
  };

  /**
   * Loads the current transforms from localStorage
   */
  const retrieveStoredTransforms = (): number[] => {
    const storedMat = localStorage.getItem("matrix");
    const storedPos = localStorage.getItem("pos");
    const storedScale = localStorage.getItem("scale");

    if (storedMat !== null) mat = JSON.parse(storedMat);
    if (storedPos !== null) pos = JSON.parse(storedPos);
    if (storedScale !== null) scale = JSON.parse(storedScale);

    return mat;
  };

  /**
   * Saves the current transforms to localStorage
   */
  const saveTransformsToStorage = () => {
    // apply any existing transforms before saving (this may be used in event
    // of manual save, which may not transforms applied)
    if(dirty) updateMatrix();

    localStorage.setItem("matrix", JSON.stringify(mat));
    localStorage.setItem("pos", JSON.stringify(pos));
    localStorage.setItem("scale", JSON.stringify(scale));
  };

  return {
    pan,
    zoom,
    apply,
    reset,
    retrieveStoredTransforms,
    saveTransformsToStorage,
  };
};

/**
 * Singleton instance of the transforms object
 */
let transformsInstance: ReturnType<typeof transforms>;

/**
 * Gets the singleton instance of the transforms object
 * @returns The singleton instance of the transforms object
 */
const getTransforms = () => {
  if (!transformsInstance) transformsInstance = transforms();
  return transformsInstance;
};

export default getTransforms;
