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
    // Every entry here is a public, keyless, read-only endpoint, and each one
    // earns its place:
    //   dexscreener   price, liquidity and volume
    //   geckoterminal candles, trades, holders and concentration
    //   rpc           the chain itself, for the burn and wallet balances
    //   coingecko     price history for the eighteen thousand coins in the
    //                 Machine that are too many to ship as files
    // Adding a fifth is a decision, not a detail — this test exists to make
    // sure one cannot arrive by accident.
    expect(allowed).toEqual([
      "'self'",
      'https://api.coingecko.com',
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

  /**
   * Compares EVERY policy, not just the site-wide one.
   *
   * The previous version of this test only looked at the first block in each
   * file, which is why three of the four per-path policies were allowed to
   * drift apart unnoticed.
   */
  test('every Content-Security-Policy matches across both hosts', async () => {
    const { readFileSync } = await import('node:fs');

    const netlify = readFileSync('public/_headers', 'utf8');
    const netlifyPolicies: Record<string, string> = {};
    let path = '';
    for (const line of netlify.split('\n')) {
      if (line && !line.startsWith(' ') && !line.startsWith('#')) path = line.trim();
      const match = /^\s+Content-Security-Policy:\s*(.+)$/.exec(line);
      if (match && path) netlifyPolicies[path.replace('/*', '')] = match[1]!;
    }

    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const vercelPolicies: Record<string, string> = {};
    for (const rule of vercel.headers) {
      for (const header of rule.headers) {
        if (header.key === 'Content-Security-Policy') {
          vercelPolicies[rule.source.replace('/(.*)', '').replace('(.*)', '')] = header.value;
        }
      }
    }

    expect(Object.keys(netlifyPolicies).sort()).toEqual(Object.keys(vercelPolicies).sort());
    for (const key of Object.keys(netlifyPolicies)) {
      expect(parse(vercelPolicies[key]!), `the two hosts disagree on ${key || '/'}`).toEqual(
        parse(netlifyPolicies[key]!),
      );
    }
  });

  /**
   * Both files are generated. If either has been hand-edited, regenerating
   * would change it — so this catches the edit rather than the drift it causes.
   */
  test('both header files match the config they are generated from', async () => {
    const { readFileSync } = await import('node:fs');
    const { execFileSync } = await import('node:child_process');

    const before = {
      netlify: readFileSync('public/_headers', 'utf8'),
      vercel: readFileSync('vercel.json', 'utf8'),
    };
    execFileSync('node', ['tools/build-headers.mjs'], { stdio: 'ignore' });

    expect(readFileSync('public/_headers', 'utf8'), 'public/_headers was edited by hand').toBe(
      before.netlify,
    );
    expect(readFileSync('vercel.json', 'utf8'), 'vercel.json was edited by hand').toBe(
      before.vercel,
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

/**
 * The snapshot has to be refreshed.
 *
 * `npm run snapshot` is manual, so nothing forces these figures to ever be
 * updated again — and they are what every visitor sees first, and what a
 * visitor whose fetch fails sees for their whole session. A stale number on a
 * page about money is a false claim, so the build says so.
 */
test('the build-time figures are not stale', async () => {
  const { TOKEN_SNAPSHOT, SNAPSHOT_MAX_AGE_DAYS } = await import('../src/config/site.ts');

  const captured = Date.parse(`${TOKEN_SNAPSHOT.capturedAt}T00:00:00Z`);
  expect(Number.isFinite(captured), 'capturedAt is not a date').toBe(true);

  const days = (Date.now() - captured) / 86_400_000;
  expect(
    days,
    `the snapshot is ${Math.round(days)} days old — run \`npm run snapshot\``,
  ).toBeLessThan(SNAPSHOT_MAX_AGE_DAYS);
});
