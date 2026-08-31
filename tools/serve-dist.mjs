/**
 * A minimal static server for dist/, used by the test suite.
 *
 * `astro preview` runs itself as a background daemon, which Playwright cannot
 * supervise (it sees the foreground process exit and gives up). This serves the
 * same files in the foreground, with no dependencies, so tests always run
 * against the build that was just produced.
 *
 *   node tools/serve-dist.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number(process.argv[2] ?? 4321);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolves a URL path to a file inside dist/, or null if it escapes or is missing. */
function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(root, normalize(decoded)));

  // Never serve anything outside dist/, whatever the request says.
  if (candidate !== root && !candidate.startsWith(root + '/')) return null;

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  // Astro writes directory-style routes as <route>/index.html.
  for (const suffix of ['index.html', '.html']) {
    const withSuffix = candidate.endsWith('/')
      ? candidate + suffix
      : `${candidate}/${suffix}`.replace('/.html', '.html');
    if (existsSync(withSuffix) && statSync(withSuffix).isFile()) return withSuffix;
  }
  return null;
}

createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  process.stdout.write(`Serving dist/ on http://localhost:${port}\n`);
});
