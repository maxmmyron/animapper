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

  return {
    pan,
    zoom,
    apply,
    reset
  };
};

let transformsInstance: ReturnType<typeof transforms>;

const getTransforms = () => {
  if (!transformsInstance) transformsInstance = transforms();
  return transformsInstance;
};

export default getTransforms;
