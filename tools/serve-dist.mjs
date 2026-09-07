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
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));

/*
 * The response headers the real hosts send, read from public/_headers.
 *
 * Until this existed the suite never saw the CSP: the header test read the
 * file, and the browser tests ran against a server that sent no policy at all.
 * A rule that only exists in a file is a rule nobody has watched a browser
 * enforce — the roadmap's inline styles silently failing in production while
 * every test passed is what that looks like. Netlify semantics: for a header,
 * the FIRST matching path block wins.
 */
const HEADER_BLOCKS = readFileSync(join(root, '_headers'), 'utf8')
  .split(/\n(?=\S)/)
  .map((block) => block.split('\n'))
  .filter((lines) => lines[0] && !lines[0].startsWith('#'))
  .map(([path, ...rest]) => ({
    test: new RegExp(
      `^${path
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')}$`,
    ),
    headers: rest
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const at = line.indexOf(':');
        return [line.slice(0, at), line.slice(at + 1).trim()];
      }),
  }));

function headersFor(url) {
  const path = url.split('?')[0];
  const chosen = {};
  for (const block of HEADER_BLOCKS) {
    if (!block.test.test(path)) continue;
    for (const [name, value] of block.headers) {
      // Everything the hosts send, minus one directive. `upgrade-insecure-requests`
      // tells the browser to fetch every subresource over https; Chromium and
      // Firefox exempt localhost, WebKit does not, and against this plain-http
      // server every script and stylesheet then failed with a TLS error on the
      // mobile (WebKit) project. Production is https, so the directive is
      // meaningful there and meaningless here.
      chosen[name.toLowerCase()] ??=
        name.toLowerCase() === 'content-security-policy'
          ? value.replace(/;\s*upgrade-insecure-requests\s*/i, '')
          : value;
    }
  }
  return chosen;
}

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
    ...headersFor(request.url ?? '/'),
  });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  process.stdout.write(`Serving dist/ on http://localhost:${port}\n`);
});
