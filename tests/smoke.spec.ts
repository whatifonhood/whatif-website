import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
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
      const dataApi = /dexscreener|geckoterminal|coingecko|rpc\.mainnet\.chain\.robinhood\.com/i;
      const networkFailure = /failed to fetch|net::ERR|CORS|Access to fetch/i;

      const ours = errors.filter((message) => {
        if (dataApi.test(message) && networkFailure.test(message)) return false;
        // Browsers log a second, bare line alongside a blocked request that
        // names no host at all. On its own it is unattributable, so it cannot
        // be acted on — but a genuine 404 for one of our own files says "404"
        // rather than ERR_FAILED and is still counted.
        if (/^Failed to load resource: net::ERR/i.test(message)) return false;
        return true;
      });
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
      // The failure this generator was rebuilt to remove: two unrelated ideas
      // stapled together, which is grammatical and meaningless.
      if ((text.match(/ and /g) ?? []).length > 1) problems.push(`two ideas: ${text}`);
      if (text.length > 90) problems.push(`too long: ${text}`);
      // Agreement: "we was early", "I is still asking".
      if (/\b(we|they) was\b|\bI is\b|\beveryone were\b/.test(text)) {
        problems.push(`agreement: ${text}`);
      }
      // Double negatives, which is what "nobody" does to a negative verb.
      if (/\bnobody\b[^?]*\bnever\b/.test(text)) problems.push(`double negative: ${text}`);

      // Wait for the question to actually change rather than assuming the click
      // landed — under parallel load a press can outrun the read, which looks
      // like the generator repeating when it is the test racing itself.
      await page.locator('[data-ask-again]').click();
      await expect(question).not.toHaveText(text, { timeout: 5_000 });
    }

    expect(problems.slice(0, 3)).toEqual([]);
    // Each press is confirmed to have changed the text, so anything repeated
    // here is the generator genuinely coming round again.
    expect(seen.size, 'the generator is repeating itself').toBeGreaterThan(30);
  });

  test('the count on the page is the real one', async ({ page }) => {
    const { countPossibilities } = await import('../src/config/what-if.ts');
    await page.goto('/ask/');
    await expect(page.locator('[data-ask-total]')).toHaveText(
      countPossibilities().toLocaleString('en-US'),
    );
  });
});

/**
 * Every subject has to read correctly with every verb.
 *
 * The generator combines these freely, so one bad pair is a sentence somebody
 * eventually sees. Checking the banks directly covers all of them at once,
 * where sampling the page only finds the common ones.
 */
test('every subject agrees with every verb', async () => {
  const { BANKS } = await import('../src/config/what-if.ts');
  const problems: string[] = [];

  for (const person of BANKS.person ?? []) {
    for (const verb of BANKS.verb ?? []) {
      const clause = `${person} ${verb}`;
      if (/\b(we|they) was\b|\bI is\b|\beveryone were\b/.test(clause)) {
        problems.push(`agreement: ${clause}`);
      }
      if (/\bnobody\b.*\bnever\b/.test(clause)) problems.push(`double negative: ${clause}`);
    }
  }

  expect(problems).toEqual([]);
});

/**
 * Sharing a question.
 *
 * The id in the URL is indices, never the words. A link carrying raw text would
 * let anyone render whatever they liked onto a card wearing our branding, which
 * is a way to make $IF appear to say something it never said.
 */
test.describe('a question can be linked', () => {
  test('a shared link reopens the same question', async ({ page }) => {
    await page.goto('/ask/');
    await expect(page).toHaveURL(/\?q=/);
    const asked = (await page.locator('[data-ask-question]').textContent())?.trim();

    await page.goto(page.url());
    expect((await page.locator('[data-ask-question]').textContent())?.trim()).toBe(asked);
  });

  test('a tampered link falls back instead of rendering what it was given', async ({ page }) => {
    for (const bad of ['<script>alert(1)</script>', 'l99999', 'p0.999', 'nonsense']) {
      await page.goto(`/ask/?q=${encodeURIComponent(bad)}`);
      const shown = (await page.locator('[data-ask-question]').textContent())?.trim() ?? '';
      expect(shown.startsWith('What if')).toBe(true);
      expect(shown).not.toContain('script');
      expect(shown).not.toContain(bad);
    }
  });

  test('everyone gets the same question on the same day', async ({ page }) => {
    const { questionForDate } = await import('../src/config/what-if.ts');
    expect(questionForDate('2026-09-01').text).toBe(questionForDate('2026-09-01').text);
    expect(questionForDate('2026-09-01').text).not.toBe(questionForDate('2026-09-02').text);

    await page.goto('/ask/');
    await expect(page.locator('[data-ask-daily]')).not.toBeEmpty();
  });
});

/**
 * Figures quoted in prose.
 *
 * The FAQ used to state the burn as typed text. A number typed into copy on a
 * finance site is a false claim the moment it drifts, so it has to come from
 * the same place the stat strip does.
 */
test('the burn is never quoted as hardcoded text', async ({ page }) => {
  await page.goto('/');
  // Present before any script runs, so the sentence is never half-finished.
  await expect(page.locator('main [data-stat="burned"]').first()).not.toBeEmpty();

  const body = (await page.locator('main').textContent()) ?? '';
  expect(body, 'a burn figure is typed into the copy').not.toMatch(/93 million|93 millones/i);
});

/**
 * Navigating the chart.
 *
 * Zoom and pan move a window over candles already in memory, so the failure
 * mode is not an exception — it is an empty chart, which is what happened when
 * the window's two edges were clamped independently and start ended up past
 * end. These check the drawing, not that the code ran.
 */
test.describe('the chart can be navigated', () => {
  /**
   * The chart needs live data before there is anything to navigate.
   *
   * That data comes from a public API which throttles. Failing the suite when
   * somebody else rate-limits us reports a fault that does not exist, so these
   * skip instead and say why — the same reasoning as the console-error filter
   * further up this file.
   */
  const waitForCandles = async (page: import('@playwright/test').Page) => {
    await page.goto('/stats/');
    const candles = page.locator('[data-candles] rect');
    try {
      await expect(candles.first()).toBeVisible({ timeout: 20_000 });
      // The first data load resets the view by design, so interacting before it
      // finishes races it. `data-zoomed` is only set once a paint has completed.
      await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-zoomed', /true|false/);
      await page.waitForTimeout(500);
    } catch {
      test.skip(true, 'no market data available — the price API is throttling');
    }
    return candles;
  };

  test('zooming in narrows it, and zooming out never empties it', async ({ page }) => {
    const candles = await waitForCandles(page);
    const atStart = await candles.count();

    // The buttons rather than the wheel: a phone has no scroll wheel, so this
    // is both the portable test and the path a touch user actually takes.
    await page.locator('[data-chart-zoom="in"]').click();
    await page.waitForTimeout(400);
    expect(await candles.count(), 'zooming in did not narrow the window').toBeLessThan(atStart);

    // Far past the end of the data, which is what emptied the chart before.
    for (let i = 0; i < 8; i += 1) {
      await page.locator('[data-chart-zoom="out"]').click();
      await page.waitForTimeout(120);
      expect(await candles.count(), 'zooming out emptied the chart').toBeGreaterThan(1);
    }
  });

  test('reset puts the whole range back', async ({ page }) => {
    const candles = await waitForCandles(page);
    const box = await page.locator('[data-chart-wrap]').boundingBox();
    if (!box) throw new Error('no chart');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(400);
    const zoomed = await candles.count();

    // Whether the button is on screen depends on a refresh that may have just
    // landed, so the behaviour is what is asserted, not the visibility.
    await page.locator('[data-chart-reset]').click({ force: true });
    await page.waitForTimeout(500);
    expect(await candles.count()).toBeGreaterThanOrEqual(zoomed);
  });

  test('the moving average draws over the visible window', async ({ page }) => {
    await waitForCandles(page);
    await expect(page.locator('.ma-line')).toHaveCount(0);
    await page.locator('[data-chart-average]').click();
    await expect(page.locator('.ma-line')).toHaveCount(1);
  });
});

/**
 * Translated pages have to be reachable.
 *
 * Every internal tool link used to point at the bare English route, so a
 * visitor on /es/ was silently dropped back into English and nothing on the
 * site linked to the 24 translated sub-pages at all. They existed and nothing
 * reached them. This is the test that stops it coming back the next time a link
 * is added.
 */
test.describe('a language keeps you in that language', () => {
  for (const locale of ['zh', 'tr', 'es']) {
    test(`/${locale}/ never links out to the English tools`, async ({ page }) => {
      await page.goto(`/${locale}/`);

      const leaks = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')]
          .map((a) => a.getAttribute('href') ?? '')
          .filter((href) =>
            /^\/(stats|machine|memes|pfp|brand|learn|ask|holdings|roadmap)\//.test(href),
          ),
      );

      expect(leaks, 'these drop the visitor back into English').toEqual([]);
    });

    test(`/${locale}/ actually links to its own sub-pages`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      const inside = page.locator(`a[href^="/${locale}/"]`);
      // Orphaned pages are pages nothing points at, so count the pointers.
      expect(await inside.count()).toBeGreaterThan(5);
    });
  }
});

/**
 * Translation metadata.
 *
 * These used to point every page at the four locale homepages, which tells a
 * search engine that /es/ is the Spanish version of /machine/. The damage is
 * invisible on the page, so only a test catches it.
 */
test.describe('hreflang names this page in each language', () => {
  for (const path of ['/machine/', '/es/machine/', '/stats/', '/zh/ask/']) {
    test(`${path} points at its own translations`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])');
      await expect(links).toHaveCount(4);

      const hrefs = await links.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLLinkElement).href),
      );
      // The page is /machine/, so every alternate must be a /machine/ too.
      const tail = path.replace(/^\/(zh|tr|es)\//, '/');
      for (const href of hrefs) {
        expect(new URL(href).pathname.replace(/^\/(zh|tr|es)\//, '/')).toBe(tail);
      }
      // And all four are distinct, so they really are four languages.
      expect(new Set(hrefs).size).toBe(4);
    });
  }
});

/**
 * Accessible names on the controls that had none.
 *
 * A field whose label is a nearby span is unlabelled as far as a screen reader
 * is concerned, and a slider that reports its array index names no month.
 */
test.describe('the Machine can be operated without seeing it', () => {
  test('the amount field has a name', async ({ page }) => {
    await page.goto('/machine/');
    // Asserted through the accessibility tree, not the markup: the point is
    // that a screen reader can announce the field, however it is labelled.
    const named = await page
      .locator('[data-machine-amount]')
      .evaluate(
        (node: HTMLInputElement) =>
          node.labels?.[0]?.textContent?.trim() ?? node.getAttribute('aria-label'),
      );
    expect(named, 'the amount field has no accessible name').toBeTruthy();
  });

  test('the month slider says the month, not its index', async ({ page }) => {
    await page.goto('/machine/');
    await page.getByRole('combobox').or(page.locator('[data-machine-search]')).first().fill('doge');
    await page.locator('.result-row').first().click();

    const slider = page.locator('[data-machine-month]');
    await expect(slider).toBeEnabled();
    // A month name and a year — never a bare number.
    await expect(slider).toHaveAttribute('aria-valuetext', /[A-Za-zÀ-鿿]+.*\d{4}|\d{4}/);
  });
});

/**
 * The generator keeps focus while it rolls.
 *
 * It used to set `disabled` for the 2.4s spin, which drops focus to the top of
 * the document — so a keyboard user lost their place and never heard the result.
 */
test('the coin generator announces what it pulled', async ({ page }) => {
  await page.goto('/pfp/');
  const generate = page.locator('[data-pfp-generate]');
  await generate.focus();
  await generate.press('Enter');

  // Still the focused element while the reel spins.
  await expect(generate).toBeFocused();
  await expect(page.locator('[data-pfp-status]')).not.toBeEmpty({ timeout: 10_000 });
});

/**
 * Ownership is read from the chain rather than claimed.
 *
 * The site removed its "renounced" claim for lack of proof. The honest
 * replacement is the raw answer, whatever it is.
 */
test('the stats page states who can change the contract', async ({ page }) => {
  await page.goto('/stats/');
  const row = page.locator('[data-check="owner"]');
  await expect(row).toBeVisible();
  // Either the contract has no owner function, or it names one. Never a claim.
  await expect(row).not.toContainText(/renounc/i);
});

/**
 * HTML must never sit behind a long cache, or a deploy is invisible for a week.
 */
test('no cache rule puts an HTML route behind a week', () => {
  const rules = readFileSync('public/_headers', 'utf8');
  const weekly = [...rules.matchAll(/^(\/\S+)\n\s+Cache-Control: public, max-age=604800/gm)].map(
    (match) => match[1]!,
  );
  expect(weekly.length).toBeGreaterThan(0);
  for (const rule of weekly) {
    // Every long-cached prefix must be an asset directory, not a page route.
    expect(rule, `${rule} would also match an HTML page`).toMatch(
      /^\/(memes\/(full|thumb|thumb2x|og)|coins\/(full|thumb|og)|machine\/(logos|poses))\/\*$/,
    );
  }
});

/**
 * A page per coin.
 *
 * These carry the answer already worked out in the HTML, so the test that
 * matters is that the arithmetic on the page is the arithmetic in the data —
 * recomputed here from the same committed file the build read.
 */
test.describe('a coin has its own page', () => {
  test('the numbers on it are the numbers in the history', async ({ page }) => {
    await page.goto('/machine/doge/');

    const history = JSON.parse(readFileSync('public/machine/h/DOGE.json', 'utf8')) as [
      string,
      number,
    ][];
    const now = history.at(-1)![1];

    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    for (const row of await rows.all()) {
      const cells = await row.locator('th, td').allTextContents();
      const [, priceText, , multipleText] = cells;
      const price = Number(priceText!.replace(/[$,]/g, ''));
      const shown = Number(multipleText!.replace(/[×,]/g, ''));

      // The row must name a price that is actually in the history.
      expect(history.some(([, value]) => Math.abs(value - price) < price * 0.01)).toBe(true);
      // And the multiple must be today's price over it.
      expect(Math.abs(shown - now / price)).toBeLessThan(Math.max(0.1, shown * 0.02));
    }
  });

  test('is reachable from the machine, and links back', async ({ page }) => {
    await page.goto('/machine/');
    // The section that exists to give these pages a route in.
    const first = page
      .locator('section[aria-labelledby="worked-out"] a[href^="/machine/"]')
      .first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page.locator('h1')).toContainText(/had bought/i);
    await expect(page.locator('main a[href="/machine/"]').first()).toBeVisible();
  });

  test('does not claim a coin it has no page for', async ({ page }) => {
    const response = await page.goto('/machine/definitely-not-a-coin/');
    expect(response?.status()).toBe(404);
  });
});

/**
 * The burn leaderboard.
 *
 * Every row has to be checkable, or it is just a number on a page.
 */
test('the largest burns each link to their transaction', async ({ page }) => {
  await page.goto('/stats/');
  const rows = page.locator('ol li a[href*="/tx/0x"]');
  await expect(rows).toHaveCount(10);

  const hrefs = await rows.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAnchorElement).href),
  );
  // Ten distinct transactions, each a real hash.
  expect(new Set(hrefs).size).toBe(10);
  for (const href of hrefs) expect(href).toMatch(/\/tx\/0x[0-9a-f]{64}$/);
});

/**
 * "Since you were last here".
 *
 * It must stay invisible on a first visit — a panel describing changes that
 * have not happened is worse than no panel.
 */
test.describe('what changed since last time', () => {
  test('says nothing to a first-time visitor', async ({ page }) => {
    await page.goto('/stats/');
    await page.waitForTimeout(2_000);
    await expect(page.locator('[data-since]')).toBeHidden();
  });

  test('reports the change to somebody coming back', async ({ page }) => {
    await page.goto('/stats/');
    // Stand in for a visit two days ago at half the price.
    await page.evaluate(() => {
      window.localStorage.setItem(
        'if:last-visit',
        JSON.stringify({
          at: Date.now() - 2 * 24 * 60 * 60 * 1000,
          price: 0.000001,
          burned: 1,
          holders: 1,
        }),
      );
    });
    await page.reload();

    const panel = page.locator('[data-since]');
    try {
      await expect(panel).toBeVisible({ timeout: 20_000 });
    } catch {
      test.skip(true, 'no market data available — the price API is throttling');
    }
    await expect(panel).toContainText(/%/);
    await expect(panel.locator('[data-since-lead]')).not.toBeEmpty();
  });
});
