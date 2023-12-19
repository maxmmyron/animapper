import {writable} from 'svelte/store';
import { spring } from 'svelte/motion';

export const size = spring([0, 0]);
export const position = spring([0, 0]);
export const zoom = spring(1);
export const origin = spring([0, 0]);
