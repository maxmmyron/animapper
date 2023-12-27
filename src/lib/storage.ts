import { frames as framesStore, matrix as matrixStore, size as sizeStore } from "$lib/stores";
import { get } from "svelte/store";

export const save = () => {
  const frames = get(framesStore);
  const matrix = get(matrixStore);
  const size = get(sizeStore);

  localStorage.setItem("frames", JSON.stringify(frames));
  localStorage.setItem("matrix", JSON.stringify(matrix));
  localStorage.setItem("size", JSON.stringify(size));
};

export const load = () => {
  const frames = JSON.parse(localStorage.getItem("frames") || "[]");
  const matrix = JSON.parse(localStorage.getItem("matrix") || "[]");
  const size = JSON.parse(localStorage.getItem("size") || "[]");

  framesStore.set(frames);
  matrixStore.set(matrix);
  sizeStore.set(size);
};
