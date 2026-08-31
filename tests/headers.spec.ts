import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * public/_headers is the site's security posture. It is easy to weaken by
 * accident and impossible to notice by eye, so every directive is asserted here.
 *
 * Netlify applies these at the edge; they are not present in local preview,
 * which is why this reads the file rather than making a request.
 */
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');

const REQUIRED_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
];

test.describe('security headers', () => {
  for (const directive of REQUIRED_DIRECTIVES) {
    test(`Content-Security-Policy keeps ${directive}`, () => {
      expect(headers).toContain(directive);
    });
  }

  test('never allows inline scripts or styles', () => {
    expect(headers).not.toContain("'unsafe-inline'");
    expect(headers).not.toContain("'unsafe-eval'");
  });

  test('only the public read-only data APIs may be contacted', () => {
    const connectSrc = headers.match(/connect-src ([^;]+);/)?.[1] ?? '';
    const allowed = connectSrc.trim().split(/\s+/).sort();
    expect(allowed).toEqual([
      "'self'",
      'https://api.dexscreener.com',
      'https://api.geckoterminal.com',
      'https://rpc.mainnet.chain.robinhood.com',
    ]);
  });

  test('the transport and sniffing protections are set', () => {
    expect(headers).toContain('Strict-Transport-Security: max-age=31536000');
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(headers).toContain('X-Frame-Options: DENY');
  });

  test('fingerprinted assets are cached forever and HTML never is', () => {
    expect(headers).toContain('/_astro/*');
    expect(headers).toContain('max-age=31536000, immutable');
    expect(headers).toContain('max-age=0, must-revalidate');
  });
});
