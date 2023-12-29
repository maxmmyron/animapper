import { createFFmpeg, type FFmpeg } from '@ffmpeg/ffmpeg';
import {writable, type Writable} from 'svelte/store';

export const frameIdx = writable(0);
export const size: Writable<[number,number]> = writable([0, 0]);
export const bg = writable(`#ffffff`);
export const matrix = writable([0.9, 0, 0, 0.9, 0, 0]);
export const frames: Writable<App.Frame[]> = writable([]);
export const ffmpeg: Writable<FFmpeg> = writable(createFFmpeg({
  log: true,
}));
