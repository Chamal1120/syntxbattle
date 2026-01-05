import { writable } from 'svelte/store';

// Simple boolean store - true = cursor enabled, false = disabled
export const cursorEnabled = writable<boolean>(true);
