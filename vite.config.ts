import path from 'path';
import { realpathSync } from 'node:fs';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Worktrees may share node_modules outside the workspace. CSS font URLs
        // need an explicit allowance; keep the exception limited to these fonts.
        fs: {
          allow: [searchForWorkspaceRoot(process.cwd()), realpathSync(path.resolve(__dirname, 'node_modules/katex/dist/fonts'))],
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      }
    };
});
