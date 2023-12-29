import { size as sizeStore } from "$lib/stores";
import { get } from "svelte/store";

/**
 * Continually saves the current size to localStorage
 */
export const setupSizeStorageAutosave = () => {
  sizeStore.subscribe((size) => {
    localStorage.setItem("size", JSON.stringify(size));
  });
}

/**
 * Manually saves the current size to localStorage
 */
export const saveSizeToStorage = () => {
  localStorage.setItem("size", JSON.stringify(get(sizeStore)));
};

/**
 * Loads the current size from localStorage
 */
export const loadSizeFromStorage = () => {
  const size = localStorage.getItem("size");

  if (size !== null) sizeStore.set(JSON.parse(size));
};
