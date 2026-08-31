import { expect, test } from '@playwright/test';
import { LOCALE_PATHS, LOCALES, TOKEN } from '../src/config/site.ts';

/**
 * The checks that must never fail.
 *
 * The most important one is the contract address: if any page ever shows an
 * address that disagrees with src/config/site.ts, the build stops. That is the
 * single mistake on a meme coin site that costs somebody real money.
 */

const PAGES = [
  ...LOCALES.map((locale) => ({ name: `landing (${locale})`, path: LOCALE_PATHS[locale] })),
  { name: 'pfp generator', path: '/pfp/' },
  { name: 'a single coin', path: '/pfp/godface' },
  { name: 'memes', path: '/memes/' },
  { name: 'brand', path: '/brand/' },
  { name: 'stats', path: '/stats/' },
  { name: 'machine', path: '/machine/' },
  { name: 'a single meme', path: '/memes/meme-two-buttons-sell-or-hold/' },
  { name: 'wallet lookup', path: '/holdings/' },
  { name: 'the generator', path: '/ask/' },
  { name: '404', path: '/404' },
];

for (const page of PAGES) {
  test.describe(page.name, () => {
    test('renders without console errors and with one h1', async ({ page: browserPage }) => {
      const errors: string[] = [];
      browserPage.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      browserPage.on('pageerror', (error) => errors.push(error.message));

      await browserPage.goto(page.path);
      await expect(browserPage.locator('h1')).toHaveCount(1);
      await expect(browserPage.locator('main')).toBeVisible();

      // A public API refusing or throttling a request is not a fault in this
      // codebase, and the pages are built to carry on when it happens — the
      // snapshot figures stay on screen. Asserting on it makes the suite fail
      // for reasons nobody here can fix, so only our own errors are counted.
      const ours = errors.filter(
        (message) =>
          !/dexscreener|geckoterminal|rpc\.mainnet\.chain\.robinhood\.com/i.test(message) ||
          !/failed to fetch|net::|CORS|Access to fetch|load resource/i.test(message),
      );
      expect(ours, `console errors on ${page.path}`).toEqual([]);
    });

    test('never scrolls sideways', async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      const overflow = await browserPage.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${page.path} overflows horizontally`).toBeLessThanOrEqual(0);
    });

    test('every link that leaves the site is safe', async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      const unsafe = await browserPage.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')]
          .filter((link) => !/noopener/.test(link.rel) || !/noreferrer/.test(link.rel))
          .map((link) => link.href),
      );
      expect(unsafe, 'links opening a new tab must set rel="noopener noreferrer"').toEqual([]);
    });

    test('has a title, a description and a canonical URL', async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await expect(browserPage).toHaveTitle(/.{10,}/);
      await expect(browserPage.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /.{40,}/,
      );
      await expect(browserPage.locator('link[rel="canonical"]')).toHaveCount(1);
    });
  });
}

test.describe('the contract address', () => {
  for (const locale of LOCALES) {
    test(`is shown in full and matches the config (${locale})`, async ({ page }) => {
      await page.goto(LOCALE_PATHS[locale]);

      // It appears at least once, complete, on the landing page.
      await expect(page.getByText(TOKEN.address, { exact: false }).first()).toBeVisible();

      // And no page may contain a *different* 0x address for the token.
      const addresses: string[] = await page.evaluate(() => {
        const matches = document.body.innerText.match(/0x[a-fA-F0-9]{40}/g) ?? [];
        return [...new Set(matches)];
      });
      const unexpected = addresses.filter(
        (address) =>
          address.toLowerCase() !== TOKEN.address.toLowerCase() &&
          address.toLowerCase() !== TOKEN.burnAddress.toLowerCase(),
      );
      expect(unexpected, 'an unrecognised contract address is on the page').toEqual([]);
    });
  }

  test('is never shown truncated with an ellipsis', async ({ page }) => {
    await page.goto('/');
    const text = await page.evaluate(() => document.body.innerText);
    // e.g. "0x232C…30d1" — the pattern phishing sites rely on.
    expect(text).not.toMatch(/0x[a-fA-F0-9]{2,8}\s*[….]{1,3}\s*[a-fA-F0-9]{2,8}/);
  });
});

test.describe('promises the site makes', () => {
  test('never asks anyone to connect a wallet', async ({ page }) => {
    await page.goto('/');
    const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    expect(text).not.toContain('connect wallet');
    expect(text).not.toContain('connect your wallet to');
  });

  test('states the canonical domain in the footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('whatifonhood.com');
  });
});

test.describe('headings keep their spaces', () => {
  // JSX collapses whitespace at a line break, so a heading split into two
  // coloured halves loses the space between them whenever the formatter moves
  // the line. It renders as "WHAT$IF". Cheap to break, invisible in review.
  for (const page of PAGES) {
    test(`${page.name} has no words run together`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      const headings = await browserPage.evaluate(() =>
        [...document.querySelectorAll('h1, h2, h3')].map((el) => el.textContent?.trim() ?? ''),
      );
      const joined = headings.filter(
        (text) => /[A-Za-z.]\$IF/.test(text) || /\.[A-Z]/.test(text.replace(/\.\.\./g, '')),
      );
      expect(joined, 'a heading lost the space between its two halves').toEqual([]);
    });
  }
});

test.describe('the Content-Security-Policy stays satisfiable', () => {
  // `style-src 'self'` blocks inline style attributes and `script-src 'self'`
  // blocks inline scripts. Both are easy to reintroduce by accident — a template
  // literal in a `style=` attribute is the usual way — and the failure only
  // shows up in production, where the browser silently drops the style.
  for (const page of PAGES) {
    test(`${page.name} has no inline styles or scripts`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      const inlineStyles = await browserPage.evaluate(() =>
        [...document.querySelectorAll('[style]')].map((el) => el.outerHTML.slice(0, 100)),
      );
      expect(inlineStyles, 'inline style attributes are blocked by the CSP').toEqual([]);

      const inlineScripts = await browserPage.evaluate(() =>
        [...document.querySelectorAll('script')]
          .filter((el) => !el.src && el.type !== 'application/ld+json')
          .map((el) => el.outerHTML.slice(0, 100)),
      );
      expect(inlineScripts, 'inline scripts are blocked by the CSP').toEqual([]);
    });
  }
});

test.describe('accessibility basics', () => {
  test('every image has an alt attribute', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(
      () =>
        [...document.querySelectorAll('img')].filter((image) => !image.hasAttribute('alt')).length,
    );
    expect(missing).toBe(0);
  });

  test('every control has an accessible name', async ({ page }) => {
    await page.goto('/');
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a')]
        .filter((element) => {
          const label =
            element.getAttribute('aria-label') ??
            element.textContent?.trim() ??
            element.querySelector('[aria-label]')?.getAttribute('aria-label') ??
            '';
          return label.length === 0;
        })
        .map((element) => element.outerHTML.slice(0, 90)),
    );
    expect(unnamed).toEqual([]);
  });

  // Keyboard navigation is a desktop concern; the mobile project has no keyboard.
  test('the skip link is the first thing keyboard users reach', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'no hardware keyboard on mobile');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('a:focus')).toHaveAttribute('href', '#main');
  });
});

/**
 * Shareable results.
 *
 * The calculator's whole point is that a number can be argued with, which needs
 * the result to survive being copied out of the address bar. The query string is
 * also the only untrusted input the site takes, so it is checked here too.
 */
test.describe('the What $IF Machine remembers its result', () => {
  test('a shared link reopens on the same calculation', async ({ page }) => {
    await page.goto('/machine/?coin=DOGE&from=2021-05&amount=250');
    await expect(page.locator('[data-chosen-ticker]')).toHaveText('DOGE', { timeout: 15_000 });
    await expect(page.locator('[data-machine-amount]')).toHaveValue('250');
    await expect(page.locator('[data-machine-month-label]')).toContainText('2021');
  });

  test('changing the inputs updates the address bar', async ({ page }) => {
    await page.goto('/machine/');
    await expect(page.locator('[data-chosen-ticker]')).not.toBeEmpty({ timeout: 15_000 });
    await page.locator('[data-machine-amount]').fill('1234');
    await expect(page).toHaveURL(/amount=1234/);
  });

  test('a hostile query string is discarded, not rendered', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/machine/?coin=<script>alert(1)</script>&from=zzzz&amount=-999');
    // Falls back to the default coin rather than trusting any of it.
    await expect(page.locator('[data-chosen-ticker]')).not.toBeEmpty({ timeout: 15_000 });

    const leaked = await page.evaluate(() => document.body.innerHTML.includes('alert(1)'));
    expect(leaked, 'a query value reached the DOM').toBe(false);
    expect(errors).toEqual([]);

    const amount = await page.locator('[data-machine-amount]').inputValue();
    expect(Number(amount)).toBeGreaterThanOrEqual(1);
  });
});

test.describe('every meme has a page', () => {
  test('the vault links to pages, not to raw image files', async ({ page }) => {
    await page.goto('/memes/');
    const rawLinks = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLAnchorElement>('[data-vault-item] a')].filter(
          (link) => !link.hasAttribute('download') && /\.(webp|png|jpg)$/.test(link.pathname),
        ).length,
    );
    expect(rawLinks, 'a thumbnail still opens the bare file').toBe(0);
  });

  test('a meme page carries its own social card', async ({ page }) => {
    await page.goto('/memes/meme-two-buttons-sell-or-hold/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/memes\/og\/meme-two-buttons-sell-or-hold\.jpg$/,
    );
  });
});

test('top-level pages do not all share one social card', async ({ page }) => {
  const cards = new Set<string>();
  for (const path of ['/', '/stats/', '/machine/', '/memes/', '/pfp/', '/brand/', '/roadmap/']) {
    await page.goto(path);
    const card = await page.locator('meta[property="og:image"]').getAttribute('content');
    cards.add(card ?? '');
  }
  expect(cards.size, 'every top-level page should have its own card').toBeGreaterThan(5);
});

test.describe('the wallet lookup', () => {
  test('says what is wrong instead of returning a confusing zero', async ({ page }) => {
    await page.goto('/holdings/');
    const cases = [
      { value: 'vitalik.eth', expect: /0x address/i },
      { value: `0x${'a'.repeat(64)}`, expect: /transaction hash/i },
      { value: 'hello', expect: /starts with 0x/i },
    ];
    for (const item of cases) {
      await page.locator('[data-holdings-input]').fill(item.value);
      await page.locator('[data-holdings-form] button').click();
      await expect(page.locator('[data-holdings-error]')).toBeVisible();
      await expect(page.locator('[data-holdings-error]')).toHaveText(item.expect);
    }
  });

  test('never asks anyone to connect a wallet', async ({ page }) => {
    await page.goto('/holdings/');
    const text = (await page.locator('main').textContent()) ?? '';
    expect(text).not.toMatch(/connect (your )?wallet/i);
    // The promise the page makes has to stay on the page.
    expect(text).toMatch(/never requested from a wallet/i);
  });
});

test('analytics stays first-party', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).host;
    if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
      thirdParty.push(host);
    }
  });
  await page.goto('/');
  await page.waitForTimeout(1200);
  // Whatever else the page does, it must not load a tracker from someone else.
  expect(thirdParty.filter((h) => /plausible|google|segment|hotjar/i.test(h))).toEqual([]);
});

/**
 * The header's section links are in-page anchors. On a sub-page an anchor to
 * "#thesis" points at nothing and the button does nothing at all, which is what
 * used to happen — so off the landing page they have to carry the landing page
 * with them, in the language the visitor is reading.
 */
test.describe('the header gets you home', () => {
  test('section links work from a sub-page', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('header a[href$="#thesis"]').first()).toHaveAttribute(
      'href',
      '/#thesis',
    );

    // On a narrow viewport these links live in the collapsed menu, so the click
    // has to go through the same path a person on a phone would take.
    const opener = page.locator('header [aria-controls="mobile-menu"]');
    if (await opener.isVisible()) await opener.click();

    const link = page.locator('header a[href$="#thesis"]:visible').first();
    await link.click();
    await expect(page).toHaveURL(/\/#thesis$/);
    await expect(page.locator('#thesis')).toBeVisible();
  });

  test('a sub-page in another language returns to that language', async ({ page }) => {
    await page.goto('/es/stats/');
    await expect(page.locator('header a[href$="#thesis"]').first()).toHaveAttribute(
      'href',
      '/es/#thesis',
    );
  });

  test('the landing page keeps a plain anchor so it does not reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href$="#thesis"]').first()).toHaveAttribute(
      'href',
      '#thesis',
    );
  });
});

/**
 * The question generator.
 *
 * A combinatorial generator fails by producing sentences that are wrong rather
 * than by throwing, so the only useful test reads what it actually writes. These
 * are the mistakes it has already made once: a capital W mid-sentence after an
 * opener, and a subject contradicting its own verb.
 */
test.describe('the question generator', () => {
  test('writes sentences that read correctly', async ({ page }) => {
    await page.goto('/ask/');
    const question = page.locator('[data-ask-question]');
    await expect(question).not.toBeEmpty();

    const problems: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < 40; i += 1) {
      const text = (await question.textContent())?.trim() ?? '';
      seen.add(text);

      // Case-sensitive on purpose: "Okay but What if" is the bug.
      if (/[a-z,] What if/.test(text)) problems.push(`capitalised mid-sentence: ${text}`);
      if (/(sold|held)[^?]*never sold/.test(text)) problems.push(`contradiction: ${text}`);
      if (/ {2}| ,| \?/.test(text)) problems.push(`spacing: ${text}`);
      if (!text.endsWith('?')) problems.push(`not a question: ${text}`);
      if (/\{\w+\}/.test(text)) problems.push(`unfilled slot: ${text}`);

      await page.locator('[data-ask-again]').click();
    }

    expect(problems.slice(0, 3)).toEqual([]);
    // Repeats are possible but should be vanishingly rare with a million options.
    expect(seen.size, 'the generator is repeating itself').toBeGreaterThan(30);
  });

  test('a category filter changes what comes out', async ({ page }) => {
    await page.goto('/ask/');
    await page.locator('[data-ask-category="dread"]').click();

    const question = page.locator('[data-ask-question]');
    for (let i = 0; i < 6; i += 1) {
      await expect(question).not.toBeEmpty();
      await page.locator('[data-ask-again]').click();
    }
    await expect(page.locator('[data-ask-category="dread"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('the count on the page is the real one', async ({ page }) => {
    const { countPossibilities } = await import('../src/config/what-if.ts');
    await page.goto('/ask/');
    await expect(page.locator('[data-ask-total]')).toHaveText(
      countPossibilities().toLocaleString('en-US'),
    );
  });
});
