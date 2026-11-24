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
      // Generates a 100% self-contained single-file /docs/index.html (with CSS, JS,
      // and backdrop inlined) so GitHub Pages works reliably from /docs, from root
      // redirect, from GitHub Actions, or even standalone without broken asset paths.
      {
        name: 'sync-github-pages-docs',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const docsDir = path.resolve(__dirname, 'docs');
          const distIndex = path.resolve(distDir, 'index.html');
          const distAssets = path.resolve(distDir, 'assets');
          if (!fs.existsSync(distIndex) || !fs.existsSync(distAssets)) {
            return;
          }

          fs.rmSync(docsDir, {recursive: true, force: true});
          fs.mkdirSync(docsDir, {recursive: true});

          let html = fs.readFileSync(distIndex, 'utf8');
          const assetFiles = fs.readdirSync(distAssets);
          const cssFile = assetFiles.find((f) => f.endsWith('.css'));
          const jsFile = assetFiles.find((f) => f.endsWith('.js'));
          const backdropFile = assetFiles.find((f) => f.startsWith('title_ninja_backdrop') && f.endsWith('.jpg'));

          // Remove dev-only root-redirect script from built docs HTML
          html = html.replace(/<script>\s*if\s*\(\s*document\.querySelector\('script\[src="\/src\/main\.tsx"\]'\)[\s\S]*?<\/script>/g, '');

          // Inline compiled CSS so external stylesheet 404s are impossible
          if (cssFile) {
            const cssContent = fs.readFileSync(path.resolve(distAssets, cssFile), 'utf8').replace(/<\/style/gi, '<\\/style');
            html = html.replace(
              /<link[^>]+rel="stylesheet"[^>]+href="\.\/assets\/[^"]+\.css"[^>]*>/g,
              () => `<style>${cssContent}</style>`,
            );
          }

          // Inline compiled JS (and backdrop data URI) right after <div id="root"></div>
          if (jsFile) {
            let jsContent = fs.readFileSync(path.resolve(distAssets, jsFile), 'utf8');
            if (backdropFile) {
              const imgBase64 = fs.readFileSync(path.resolve(distAssets, backdropFile)).toString('base64');
              const dataUri = JSON.stringify(`data:image/jpeg;base64,${imgBase64}`);
              jsContent = jsContent.replace(
                /new URL\([`'"]title_ninja_backdrop[^`'"]+[`'"],\s*import\.meta\.url\)\.href/g,
                () => dataUri,
              );
            }
            jsContent = jsContent.replace(/<\/script/gi, '<\\/script');
            html = html.replace(/<script[^>]+type="module"[^>]+src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/g, '');
            html = html.replace(
              '<div id="root"></div>',
              () => `<div id="root"></div>\n    <script type="module">${jsContent}</script>`,
            );
          }

          fs.writeFileSync(path.resolve(docsDir, 'index.html'), html, 'utf8');
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
