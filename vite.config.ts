import path from 'path';
import { defineConfig, type ResolveModulePreloadDependenciesFn } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { modelDocumentPagesPluginV1 } from './tools/modelDocumentation/modelDocumentPagesPluginV1';

const readerPreloadDependencies: ResolveModulePreloadDependenciesFn = (filename, dependencies, context) => {
  // WebKit can retain failed modulepreload requests across page reloads
  // (https://bugs.webkit.org/show_bug.cgi?id=270357). Let these deferred
  // experiment imports load their JS natively so the recovery button works.
  // Vite preserves CSS dependencies separately from this callback.
  if (context.hostType === 'js' && /(?:^|\/)ArticleReaderPage-[^/]+\.js$/.test(context.hostId)
    && /(?:^|\/)(?:ArticleReaderExperimentV3|StudioDefaultCompositionV2)-[^/]+\.js$/.test(filename)) return [];
  return dependencies;
};

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), modelDocumentPagesPluginV1()],
      build: { modulePreload: { resolveDependencies: readerPreloadDependencies } },
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
