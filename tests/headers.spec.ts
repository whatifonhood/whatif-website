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

/**
 * The site can be hosted on either Netlify or Vercel, and they read completely
 * different files: public/_headers and vercel.json. A directive added to one and
 * forgotten in the other would mean the site quietly ships without it on the
 * other host — which is exactly the kind of failure nobody notices.
 */
test.describe('the two hosting configs agree', () => {
  const parse = (policy: string) =>
    Object.fromEntries(
      policy
        .split(';')
        .map((directive) => directive.trim())
        .filter(Boolean)
        .map((directive) => {
          const [name, ...values] = directive.split(/\s+/);
          return [name, values.join(' ')];
        }),
    );

  test('the Content-Security-Policy is the same on both hosts', async () => {
    const { readFileSync } = await import('node:fs');

    const netlify = readFileSync('public/_headers', 'utf8');
    const netlifyPolicy = /^ {2}Content-Security-Policy: (.+)$/m.exec(netlify)?.[1];
    expect(netlifyPolicy, 'no site-wide policy in public/_headers').toBeTruthy();

    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const vercelPolicy = vercel.headers
      .find((rule: { source: string }) => rule.source === '/(.*)')
      ?.headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')?.value;
    expect(vercelPolicy, 'no site-wide policy in vercel.json').toBeTruthy();

    expect(parse(vercelPolicy), 'the two hosts disagree on the policy').toEqual(
      parse(netlifyPolicy as string),
    );
  });

  test('neither host allows inline scripts', async () => {
    const { readFileSync } = await import('node:fs');
    for (const file of ['public/_headers', 'vercel.json']) {
      const contents = readFileSync(file, 'utf8');
      expect(contents, `${file} allows unsafe-inline`).not.toContain("'unsafe-inline'");
      expect(contents, `${file} allows unsafe-eval`).not.toContain("'unsafe-eval'");
    }
  });
});
