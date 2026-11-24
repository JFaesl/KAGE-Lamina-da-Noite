import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Mirrors the production static bundle into /docs so GitHub Pages works
      // immediately via "Deploy from a branch (/docs)" as well as GitHub Actions.
      {
        name: 'sync-github-pages-docs',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const docsDir = path.resolve(__dirname, 'docs');
          if (!fs.existsSync(distDir)) {
            return;
          }
          fs.rmSync(docsDir, {recursive: true, force: true});
          fs.mkdirSync(docsDir, {recursive: true});
          const distIndex = path.resolve(distDir, 'index.html');
          if (fs.existsSync(distIndex)) {
            fs.cpSync(distIndex, path.resolve(docsDir, 'index.html'));
          }
          const distAssets = path.resolve(distDir, 'assets');
          if (fs.existsSync(distAssets)) {
            fs.cpSync(distAssets, path.resolve(docsDir, 'assets'), {recursive: true, force: true});
          }
          fs.writeFileSync(path.resolve(docsDir, '.nojekyll'), '');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
