import { createFFmpeg, type FFmpeg } from '@ffmpeg/ffmpeg';
import {derived, writable, type Readable, type Writable} from 'svelte/store';

export const frameIdx = writable(0);
export const size: Writable<[number,number]> = writable([0, 0]);

/**
 * A rounded size that is safe to send to ffmpeg for export (because ffmpeg
 * requires dimensions to be divisible by 2)
 */
export const exportSafeSize: Readable<[number,number]> = derived(size, ([width, height]) => {
  // round to nearest multiple of 2
  // i.e. 3 -> 2, 4 -> 4, 5 -> 4, 6 -> 6, etc.
  return [Math.floor((width) / 2) * 2, Math.floor((height) / 2) * 2] as [number, number];
});

export const bg = writable(`#ffffff`);
export const matrix = writable([0.9, 0, 0, 0.9, 0, 0]);
export const frames: Writable<App.Frame[]> = writable([]);
export const ffmpeg: Writable<FFmpeg> = writable(createFFmpeg({
  log: true,
}));
