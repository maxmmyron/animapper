import {writable, type Writable} from 'svelte/store';

export const size = writable([0, 0]);
export const matrix = writable([1, 0, 0, 1, 0, 0]);
export const commands: Writable<[number, number, number, number][][]> = writable([]);
