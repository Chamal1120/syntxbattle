/**
 * Bitsip coding Battle platform - Ambient Type declarations
 * See https://svelte.dev/docs/kit/types#app.d.ts
 * * @author: Chamal Mallawaarachchi
 */
import { WebContainer } from '@webcontainer/api';
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

    interface Window {
		__wc: WebContainer;
	}
}

export {};
