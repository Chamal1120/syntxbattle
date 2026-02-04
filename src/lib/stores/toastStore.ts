import { writable } from 'svelte/store';

type Toast = {
    message: string;
    id: number;
};

const { subscribe, update } = writable<Toast[]>([]);

let id = 0;

function addToast(message: string, duration: number = 3000) {
    const newToast = { message, id: id++ };
    update((toasts) => [...toasts, newToast]);
    setTimeout(() => {
        removeToast(newToast.id);
    }, duration);
}

function removeToast(id: number) {
    update((toasts) => toasts.filter((t) => t.id !== id));
}

export const toast = {
    subscribe,
    show: addToast,
};
