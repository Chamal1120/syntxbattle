import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
    plugins: [
        sveltekit(),

        {
            name: 'force-isolation',

            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    // Only apply COEP/COOP to arena pages
                    const isArenaPage = req.url?.startsWith('/arena');

                    if (isArenaPage) {
                        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                    }

                    res.setHeader('Cache-Control', 'no-store'); // Kill 304 cache
                    next();
                });
            },
        },

        Icons({ compiler: 'svelte' }),
    ],

    server: {
        // Make browser treats the server as a secure context
        host: true,

        port: 5173,
    },

    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
});
