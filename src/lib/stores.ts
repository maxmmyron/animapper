import {writable, type Writable} from 'svelte/store';

export const matrix = writable([1, 0, 0, 1, 0, 0]);
export const frames: Writable<App.Frame[]> = writable([]);

/**
 * Reactive object for frame render options
 */
export const opts: App.FrameOptions = writable({
  bg: `#ffffff`,
  size: [0, 0],
});
