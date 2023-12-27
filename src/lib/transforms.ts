// credit: https://stackoverflow.com/a/60235061/9473692

import { matrix } from "$lib/stores";

const transforms = () => {
  let mat = [1, 0, 0, 1, 0, 0];
  let pos = [0, 0];
  let scale = 0.9;
  let dirty = false;

  const reset = () => {
    matrix.set([0.9, 0, 0, 0.9, 0, 0]);
    mat = [1, 0, 0, 1, 0, 0];
    pos = [0, 0];
    scale = 0.9;
    dirty = false;
  }

  const apply = () => {
    if (dirty) updateMatrix();
    matrix.set(mat);
    saveTransformsToStorage();
  };

  const updateMatrix = () => {
    dirty = false;
    mat = [scale, 0, 0, scale, ...pos];
  };

  const pan = (amount: [number, number]) => {
    if (dirty) updateMatrix();
    pos[0] += amount[0];
    pos[1] += amount[1];
    dirty = true;
  };

  const zoom = (zoomPos: [number, number], factor: number) => {
    if (dirty) updateMatrix();
    scale *= factor;

    pos[0] = zoomPos[0] - (zoomPos[0] - pos[0]) * factor;
    pos[1] = zoomPos[1] - (zoomPos[1] - pos[1]) * factor;

    dirty = true;
  };

  const loadTransformsFromStorage = () => {
    const storedMat = localStorage.getItem("matrix");
    const storedPos = localStorage.getItem("pos");
    const storedScale = localStorage.getItem("scale");

    if (storedMat !== null) {
      mat = JSON.parse(storedMat);
      matrix.set(mat);
    }
    if (storedPos !== null) pos = JSON.parse(storedPos);
    if (storedScale !== null) scale = JSON.parse(storedScale);
  };

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
    loadTransformsFromStorage,
    saveTransformsToStorage,
  };
};

let transformsInstance: ReturnType<typeof transforms>;

const getTransforms = () => {
  if (!transformsInstance) transformsInstance = transforms();
  return transformsInstance;
};

export default getTransforms;
