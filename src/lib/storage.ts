import { frames as framesStore, matrix as matrixStore, size as sizeStore } from "$lib/stores";
import { get } from "svelte/store";

// auto-save on change
framesStore.subscribe((frames) => {
  localStorage.setItem("frames", JSON.stringify(frames));
});

matrixStore.subscribe((matrix) => {
  localStorage.setItem("matrix", JSON.stringify(matrix));
});

sizeStore.subscribe((size) => {
  localStorage.setItem("size", JSON.stringify(size));
});

/**
 * Manually save all stores to localStorage
 */
export const save = () => {
  localStorage.setItem("frames", JSON.stringify(get(framesStore)));
  localStorage.setItem("matrix", JSON.stringify(get(matrixStore)));
  localStorage.setItem("size", JSON.stringify(get(sizeStore)));
};

/**
 * Manually load and update all stores from localStorage, if available
 */
export const load = () => {
  const frames = localStorage.getItem("frames");
  const matrix = localStorage.getItem("matrix");
  const size = localStorage.getItem("size");

  // we only want to update the store if there is something to update it with
  if (frames !== null)
    framesStore.set(JSON.parse(frames));

  if (matrix !== null)
    matrixStore.set(JSON.parse(matrix));

  if (size !== null)
    sizeStore.set(JSON.parse(size));
};
