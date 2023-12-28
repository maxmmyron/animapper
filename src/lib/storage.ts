import { size as sizeStore } from "$lib/stores";
import { get } from "svelte/store";

export const setupSizeStorageAutosave = () => {
  sizeStore.subscribe((size) => {
    localStorage.setItem("size", JSON.stringify(size));
  });
}

export const saveSizeToStorage = () => {
  localStorage.setItem("size", JSON.stringify(get(sizeStore)));
};

export const loadSizeFromStorage = () => {
  const size = localStorage.getItem("size");

  if (size !== null) sizeStore.set(JSON.parse(size));
};
