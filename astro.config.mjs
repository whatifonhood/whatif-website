// @ts-check
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/config/site.ts';

// Every page is prerendered to static HTML at build time. There is no server
// runtime, no database and no environment variables — see README "Architecture".
export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'ignore',

  // One page per language, each on its own indexable URL: / , /zh/ , /tr/ , /es/
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'tr', 'es'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    sitemap({
      // The individual coin pages are made for social previews, not for search.
      // Listing all 101 would bury the pages people actually look for.
      filter: (page) => !/\/pfp\/[^/]+\/?$/.test(new URL(page).pathname),
    }),
  ],

  // Never inline CSS into the HTML: that would force `style-src 'unsafe-inline'`
  // in the Content-Security-Policy. One cached stylesheet is the better trade.
  build: { inlineStylesheets: 'never' },

  vite: {
    plugins: [tailwindcss(), serveDirectoryIndexInDev()],
    build: {
      // Never inline a script or asset into the HTML. The Content-Security-Policy
      // in public/_headers allows scripts from this origin only, with no
      // 'unsafe-inline', so an inlined bundle would be silently blocked in
      // production. tests/smoke.spec.ts fails the build if one reappears.
      assetsInlineLimit: 0,
    },
  },
});

/**
 * Serves `public/<dir>/index.html` for a request to `/<dir>/` during development.
 *
 * Static hosts (including Netlify, where this deploys) do this by default, but
 * Astro's dev server does not, so the PFP generator at /pfp/ would 404 locally.
 */
function serveDirectoryIndexInDev() {
  return {
    name: 'serve-directory-index-in-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const [path] = (request.url ?? '/').split('?');
        if (path && /^\/[^.]*$/.test(path)) {
          const withIndex = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`;
          if (existsSync(join(process.cwd(), 'public', withIndex))) {
            request.url = withIndex;
          }
        }
        next();
      });
    },
  };
}
