import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        sveltekit(),
        {
            name: 'force-isolation',
            configureServer(server) {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                    res.setHeader('Cache-Control', 'no-store'); // Kill the 304 cache for good
                    next();
                });
            }
        }
    ],
    server: {
        // Just to be absolutely sure Chrome treats it as a secure context
        host: true,
        port: 5173,
    }
});
