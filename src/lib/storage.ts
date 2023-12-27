import { size as sizeStore } from "$lib/stores";
import { get } from "svelte/store";

export const setupAutoSave = () => {
  sizeStore.subscribe((size) => {
    localStorage.setItem("size", JSON.stringify(size));
  });
}

/**
 * Manually save all stores to localStorage
 */
export const save = () => {
  localStorage.setItem("size", JSON.stringify(get(sizeStore)));
};

/**
 * Manually load and update all stores from localStorage, if available
 */
export const load = () => {
  const size = localStorage.getItem("size");

  if (size !== null) sizeStore.set(JSON.parse(size));
};
