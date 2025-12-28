/**
 * Server-side hooks for the BitSip platform.
 * * @description
 * This handle hook modifies outgoing HTTP responses to enable the security
 * headers required for WebContainers to function. 
 * * It sets:
 * 1. Cross-Origin-Embedder-Policy (COEP): 'require-corp'
 * 2. Cross-Origin-Opener-Policy (COOP): 'same-origin'
 * * These headers enable 'SharedArrayBuffer', allowing the browser to create 
 * the isolated environment needed to run a virtual Node.js process.
 * * @author Chamal Mallawaarachchi
 */
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
};
