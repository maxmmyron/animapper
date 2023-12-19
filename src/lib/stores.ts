import {writable} from 'svelte/store';

export const size = writable([0, 0]);
export const position = writable([0, 0]);
export const zoom = writable(1);
export const origin = writable([0, 0]);
