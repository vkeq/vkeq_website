import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

// Dev-only endpoint used by the admin page to save src/content.json on disk.
function adminSave() {
  return {
    name: 'admin-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__admin/save', (req, res) => {
        if (req.method === 'GET') {
          res.statusCode = 204;
          return res.end();
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (!data || typeof data !== 'object' || !data.performance || !data.bio) throw new Error('invalid content');
            await writeFile(resolve(import.meta.dirname, 'src/content.json'), JSON.stringify(data, null, 2) + '\n');
            res.setHeader('content-type', 'application/json');
            res.end('{"ok":true}');
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [adminSave()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
});
