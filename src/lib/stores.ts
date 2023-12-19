import {writable} from 'svelte/store';

export const size = writable([0, 0]);
export const matrix = writable([1, 0, 0, 1, 0, 0]);
