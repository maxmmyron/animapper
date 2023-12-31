  import type { Action } from "svelte/action";

  // Credit to: https://svelte.dev/repl/8031c800d7e34fd692dd18174b514e4e?version=3.49.0

  export const clickOutside: Action<HTMLElement, (...args: any) => any> = (
    element,
    callback: (...args: any) => any
  ) => {
    const handle = (e: MouseEvent) => {
      if (!e?.target) return;
      // if the element is clicked, do nothing
      if (!element.contains(e.target as Node)) {
        callback();
      }
    };

    console.log("adding event listener");

    document.addEventListener("click", handle);

    return {
      destroy() {
        document.removeEventListener("click", handle);
      },
    };
  };
