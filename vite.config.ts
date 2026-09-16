import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { modelDocumentPagesPluginV1 } from './tools/modelDocumentation/modelDocumentPagesPluginV1';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), modelDocumentPagesPluginV1()],
      // Workers are constructed with type: 'module'. Preserve lazy numerical
      // analysis imports instead of folding them into every live lane.
      worker: { format: 'es' as const },
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      }
    };
});
