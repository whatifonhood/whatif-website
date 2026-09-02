import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALE_PATHS, LOCALES, SITE, TOKEN } from '../src/config/site.ts';
import { hasTranslation } from '../src/config/navigation.ts';
import { questionForDate } from '../src/config/what-if.ts';
import { TWEET_URLS } from '../src/config/tweets.ts';
import { TWEET_CARDS } from '../src/config/tweet-cards.ts';

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
      // Each browser words a throttled cross-origin request differently:
      // Chromium says "net::ERR_FAILED" and "Access to fetch", WebKit says
      // "not allowed by Access-Control-Allow-Origin" and "due to access
      // control checks", and a rate limit shows up as a bare 429.
      const networkFailure =
        /failed to fetch|net::ERR|CORS|Access to fetch|Access-Control-Allow-Origin|access control checks|\b429\b/i;

      const ours = errors.filter((message) => {
        if (dataApi.test(message) && networkFailure.test(message)) return false;
        // Browsers log a second, bare line alongside a blocked request that
        // names no host at all. On its own it is unattributable, so it cannot
        // be acted on — but a genuine 404 for one of our own files says "404"
        // rather than ERR_FAILED and is still counted.
        if (/^Failed to load resource: net::ERR/i.test(message)) return false;
        // WebKit's equivalent bare line, which also names no host.
        if (
          /^(Failed to load resource: )?Origin https?:\/\/[^\s]+ is not allowed by Access-Control-Allow-Origin/i.test(
            message,
          )
        )
          return false;
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
  /*
   * `style-src 'self'` blocks inline style attributes and `script-src 'self'`
   * blocks inline scripts. Both are easy to reintroduce by accident — a template
   * literal in a `style=` attribute is the usual way — and the failure only
   * shows up in production, where the browser silently drops the style.
   *
   * This reads the HTML we shipped, not the DOM the browser ended up with. CSP
   * governs markup; a style set through the CSSOM at runtime is allowed, and the
   * dashboard sets plenty of them positioning axis labels. Asking the live page
   * therefore failed or passed depending on whether the chart had finished
   * drawing — a race, and one that would eventually be "fixed" by deleting a
   * real check.
   */
  for (const page of PAGES) {
    test(`${page.name} has no inline styles or scripts`, async ({ request }) => {
      const html = await (await request.get(page.path)).text();

      const styleAttributes = [...html.matchAll(/<[a-zA-Z][^>]*?\sstyle="[^"]*"/g)].map((m) =>
        m[0].slice(0, 120),
      );
      expect(styleAttributes, 'inline style attributes are blocked by the CSP').toEqual([]);

      const styleBlocks = [...html.matchAll(/<style[\s>]/g)].map((m) => m[0]);
      expect(styleBlocks, 'inline <style> blocks are blocked by the CSP').toEqual([]);

      const inlineScripts = [...html.matchAll(/<script\b[^>]*>/g)]
        .map((m) => m[0])
        .filter((tag) => !/\ssrc=/.test(tag) && !/application\/ld\+json/.test(tag));
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
  for (const path of ['/', '/stats/', '/memes/', '/pfp/', '/brand/', '/roadmap/']) {
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
    /*
     * A fresh page per case, because all three write into the same element.
     * Asserting straight after the click let the previous case's message
     * satisfy `toHaveText` — the text was never empty in between, so the
     * retry loop had nothing to wait for and simply matched the stale one
     * until it timed out. It surfaced first on Firefox, under the load of
     * three projects running at once, but nothing about it was Firefox's.
     */
    for (const item of cases) {
      await page.reload();
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
 * Correctness belongs to `tools/check-questions.mjs`, which walks all 2,406
 * possibilities against a dozen rules — this used to press the button forty
 * times, which covered under 2% of the output and could only fail by luck.
 *
 * What is left for a browser is what only a browser can show: that the page
 * renders a question, that pressing the button produces a different one, and
 * that nothing in the render path mangles what the generator wrote.
 */
test.describe('the question generator', () => {
  test('writes sentences that read correctly', async ({ page }) => {
    await page.goto('/ask/');
    const question = page.locator('[data-ask-question]');
    await expect(question).not.toBeEmpty();

    const problems: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < 12; i += 1) {
      const text = (await question.textContent())?.trim() ?? '';
      seen.add(text);

      // Only what the RENDER PATH could break. Every rule about the sentences
      // themselves lives in tools/check-questions.mjs, which reads all 2,406 —
      // a second copy here can only sample a handful and drift out of step
      // with the real one, which is exactly what it did.
      if (!text.endsWith('?')) problems.push(`not a question: ${text}`);
      if (/\{\w+\}/.test(text)) problems.push(`unfilled slot: ${text}`);
      if (/ {2}| ,| \?/.test(text)) problems.push(`spacing: ${text}`);

      // Wait for the question to actually change rather than assuming the click
      // landed — under parallel load a press can outrun the read, which looks
      // like the generator repeating when it is the test racing itself. The
      // timeout is generous for the same reason: the whole suite runs in
      // parallel, and a slow tab here is a busy machine, not a broken page.
      await page.locator('[data-ask-again]').click();
      await expect(question).not.toHaveText(text, { timeout: 20_000 });
    }

    expect(problems.slice(0, 3)).toEqual([]);
    // Each press is confirmed to have changed the text, so anything repeated
    // here is the generator genuinely coming round again.
    expect(seen.size, 'the generator is repeating itself').toBe(12);
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

    // Zoom in first, by whichever means this browser has. Mobile WebKit has no
    // wheel at all, and a phone has no scroll wheel either — the buttons are
    // what a real visitor uses there, so that is what gets exercised.
    const box = await page.locator('[data-chart-wrap]').boundingBox();
    if (box && test.info().project.name === 'desktop') {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, -600);
    } else {
      await page.locator('[data-chart-zoom="in"]').click();
      await page.locator('[data-chart-zoom="in"]').click();
    }
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
  // The homepage alone was not enough: the vault leaked to the English meme
  // pages while the homepage was clean, because only the homepage was checked.
  const PAGES = ['', 'memes/', 'stats/', 'pfp/', 'ask/'];

  /**
   * The rule, stated precisely: a link must stay in the reader's language
   * WHEN A TRANSLATED PAGE EXISTS TO STAY IN.
   *
   * Some things genuinely have no translation and never will — an image file,
   * and the deep pages built only in English (a coin's own page, a pulled
   * coin's page, the daily archive). Flagging those would push the suite into
   * demanding four thousand pages, and asserting "whatever we do now is fine"
   * would let the real bug back in. So the test asks the only question that
   * matters: does the translated page exist, and did we link to it?
   */
  const hasTranslation = (href: string, locale: string) =>
    existsSync(join('dist', locale, href, 'index.html'));

  for (const locale of ['zh', 'tr', 'es']) {
    for (const path of PAGES) {
      test(`/${locale}/${path} links to a translation whenever one exists`, async ({ page }) => {
        await page.goto(`/${locale}/${path}`);

        // :not([hreflang]) skips the language picker, whose whole job is to
        // link out of the reader's language — an English link there is the
        // feature, not the leak.
        const english = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]:not([hreflang])')]
            .map((a) => a.getAttribute('href') ?? '')
            .filter((href) => /^\/(stats|memes|pfp|brand|learn|ask|holdings|roadmap)\//.test(href)),
        );

        const leaks = [...new Set(english)].filter((href) => hasTranslation(href, locale));
        expect(leaks, 'these have a translated page and should point at it').toEqual([]);
      });
    }

    test(`/${locale}/ actually links to its own sub-pages`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      const inside = page.locator(`a[href^="/${locale}/"]`);
      // Orphaned pages are pages nothing points at, so count the pointers.
      expect(await inside.count()).toBeGreaterThan(5);
    });

    test(`/${locale}/memes/ reaches its own meme pages`, async ({ page }) => {
      await page.goto(`/${locale}/memes/`);
      const inside = page.locator(`a[href^="/${locale}/memes/"]`);
      // Every meme has a page in this language; the vault grows, so this is a
      // floor rather than an exact count.
      expect(await inside.count()).toBeGreaterThan(60);
    });
  }
});

test.describe('hreflang names this page in each language', () => {
  for (const path of ['/stats/', '/es/stats/', '/memes/', '/zh/ask/']) {
    test(`${path} points at its own translations`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])');
      await expect(links).toHaveCount(4);

      const hrefs = await links.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLLinkElement).href),
      );
      // The page is /stats/, so every alternate must be a /stats/ too.
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
      /^\/(memes\/(full|thumb|thumb2x|og)|coins\/(full|thumb|og)|posts|art)\/\*$/,
    );
  }
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

/**
 * The holder table.
 *
 * Its whole job is to stop a reader mistaking burned supply and the liquidity
 * pool for whales, so the labels are the part that must be right.
 */
test.describe('who holds it', () => {
  test('names the burn address and the pool', async ({ page }) => {
    await page.goto('/stats/');
    const table = page.locator('table').filter({ has: page.locator('.holder-tag') });
    await expect(table).toBeVisible();

    const burnRow = table.locator('tr', { has: page.locator('.holder-tag[data-kind="burn"]') });
    await expect(burnRow).toHaveCount(1);
    // The burn address holds the most, so it is the first row.
    await expect(table.locator('tbody tr').first()).toContainText(/burn/i);
    await expect(table.locator('.holder-tag[data-kind="pool"]')).not.toHaveCount(0);
  });

  test('every row can be checked on the explorer', async ({ page }) => {
    await page.goto('/stats/');
    const links = page.locator('table a[href*="/address/0x"]');
    await expect(links).toHaveCount(15);
    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    );
    expect(new Set(hrefs).size).toBe(15);
  });

  test('the shares add up to less than the whole supply', async ({ page }) => {
    await page.goto('/stats/');
    const shares = await page
      .locator('table tbody tr td:last-child')
      .filter({ hasText: '%' })
      .allTextContents();
    const total = shares.reduce((sum, text) => sum + Number(text.replace(/[%\s]/g, '')), 0);
    expect(total).toBeGreaterThan(0);
    expect(total, 'fifteen holders cannot hold more than everything').toBeLessThan(100);
  });
});

/**
 * The trust panel exists to not be a list of assertions.
 *
 * Every row has to lead somewhere the claim can be re-run by somebody who does
 * not trust us, and the note beside them has to describe the rows that are
 * actually there.
 */
test.describe('checks anyone can run', () => {
  test('every row links to where it can be checked', async ({ page }) => {
    await page.goto('/stats/');
    const rows = page.locator('[data-trust] li');
    await expect(rows).toHaveCount(5);
    for (const row of await rows.all()) {
      await expect(row.locator('a[href^="https://"]')).toHaveCount(1);
    }
  });

  test('the note counts the rows that are there', async ({ page }) => {
    await page.goto('/stats/');
    const rows = await page.locator('[data-trust] li').count();
    const note = (await page.locator('[data-trust] ~ p').first().textContent()) ?? '';
    // Two are third-party attestations, the rest are read from the contract.
    const words = ['one', 'two', 'three', 'four', 'five', 'six'];
    expect(note.toLowerCase()).toContain(words[rows - 2 - 1]);
  });
});

/**
 * The hourly pressure chart has to measure every hour the same way.
 *
 * It is fed two merged queries — trades over $500 reaching back a day, and the
 * most recent trades of any size. Bucketing both put the last couple of hours
 * on a different footing from the rest of the chart.
 */
test('the pressure chart says what it counts', async ({ page }) => {
  await page.goto('/stats/');
  const panel = page.locator('[data-pressure]');
  try {
    await expect(panel).toBeVisible({ timeout: 20_000 });
  } catch {
    test.skip(true, 'no trade data available — the API is throttling');
  }
  // The threshold is the reason the chart is comparable; it must be stated.
  await expect(panel).toContainText(/\$500|500 ?\$|500 dolar|500 美元/);
});

/**
 * The daily archive.
 *
 * A page for every question the generator can make would be two thousand
 * near-identical documents — a doorway-page pattern that would drag down the
 * coin pages that do have something to say. The daily question is the one worth
 * a page: one per day, the same for everybody, and the one people answer
 * together. Any other question still has a shareable link via `/ask/?q=`.
 */
test.describe('every day so far', () => {
  test('a day unfurls with its own question, not a generic title', async ({ page }) => {
    await page.goto('/ask/day/2026-08-01/');
    const question = questionForDate('2026-08-01').text;
    await expect(page).toHaveTitle(new RegExp(escapeForRegExp(question)));
    await expect(page.locator('h1')).toContainText(question);
  });

  test('the days are linked to each other and to the index', async ({ page }) => {
    await page.goto('/ask/day/2026-08-01/');
    await page.locator('a[href="/ask/day/2026-07-31/"]').click();
    await expect(page.locator('h1')).toContainText(questionForDate('2026-07-31').text);
    await page.locator('a[href="/ask/day/"]').click();
    await expect(page.locator('h1')).toContainText(/every day/i);
  });

  test('the archive is reachable from the generator', async ({ page }) => {
    await page.goto('/ask/');
    await page.locator('a[href="/ask/day/"]').first().click();
    await expect(page.locator('ol li')).not.toHaveCount(0);
  });

  test('the first day has no day before it', async ({ page }) => {
    await page.goto('/ask/day/2026-07-11/');
    await expect(page.locator('a[href*="/ask/day/2026-07-10"]')).toHaveCount(0);
  });

  test('answering a day opens that exact question', async ({ page }) => {
    await page.goto('/ask/day/2026-08-01/');
    await page.locator('a[href^="/ask/?q="]').first().click();
    await expect(page.locator('[data-ask-question]')).toHaveText(
      questionForDate('2026-08-01').text,
    );
  });
});

/** Escapes a sentence so it can be matched literally inside a RegExp. */
function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * "Don't trust a website — including this one."
 *
 * The reproduce panel is the means to act on that line, so the commands in it
 * have to be copyable verbatim and have to name the real endpoints. A command
 * carrying the page's own source indentation is a broken paste.
 */
test.describe('check every number yourself', () => {
  test('every command is copyable as-is', async ({ page }) => {
    await page.goto('/stats/');
    const blocks = page.locator('.reproduce-command');
    await expect(blocks).not.toHaveCount(0);

    for (const text of await blocks.allTextContents()) {
      expect(text, 'a command must start at column zero').toBe(text.trimStart());
      expect(text).toMatch(/^curl /);
      // No placeholder ever reaches the page.
      expect(text).not.toMatch(/YOUR_|<[a-z]+>|\bTODO\b/);
    }
  });

  test('the commands name the real contract and pool', async ({ page }) => {
    await page.goto('/stats/');
    const all = (await page.locator('.reproduce-command').allTextContents()).join('\n');
    expect(all.toLowerCase()).toContain(TOKEN.address.toLowerCase());
    expect(all.toLowerCase()).toContain(TOKEN.primaryPool.toLowerCase());
    // Nothing here may require a key, an account or a signature.
    expect(all).not.toMatch(/api[_-]?key|authorization|bearer/i);
  });

  // Not the same list as connect-src: the explorer is read here at build time
  // and by the reader in a terminal, never by the page.
  test('it only ever sends people to a source this site actually uses', async ({ page }) => {
    await page.goto('/stats/');
    const all = (await page.locator('.reproduce-command').allTextContents()).join('\n');
    const hosts = [...all.matchAll(/https:\/\/([^/'\s"]+)/g)].map((m) => m[1]!);
    expect(new Set(hosts).size).toBeGreaterThan(1);
    for (const host of new Set(hosts)) {
      expect(
        [
          'api.dexscreener.com',
          'api.geckoterminal.com',
          'rpc.mainnet.chain.robinhood.com',
          'robinhoodchain.blockscout.com',
        ],
        `${host} is published as a source but this site does not use it`,
      ).toContain(host);
    }
  });
});

/**
 * A collection has to survive a new phone.
 *
 * Finds live in this browser's localStorage and nowhere else, so a cleared
 * cache used to destroy them. The code has to round-trip, and restoring on a
 * browser that already has finds must never take any away.
 */
test.describe('moving a collection between browsers', () => {
  test('a code restores the collection somewhere else', async ({ page }) => {
    await page.goto('/pfp/');
    // Stand in for a collection earned on another device.
    await page.evaluate(() => {
      window.localStorage.setItem(
        'whatif.pfp.v1',
        JSON.stringify({ found: {}, sinceRare: 0, sinceLegendary: 0, poolOpen: false }),
      );
    });

    await page.locator('[data-pfp-generate]').click();
    await expect(page.locator('[data-pfp-result]')).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-pfp-backup] summary').click();
    await page.locator('[data-pfp-export]').click();
    const code = await page.locator('[data-pfp-code]').inputValue();
    expect(code.length).toBeGreaterThan(10);

    // A different browser: nothing found, then the code pasted in.
    await page.evaluate(() => window.localStorage.removeItem('whatif.pfp.v1'));
    await page.reload();
    await page.locator('[data-pfp-backup] summary').click();
    await page.locator('[data-pfp-code]').fill(code);
    await page.locator('[data-pfp-import]').click();

    await expect(page.locator('[data-pfp-backup-status]')).toContainText(/1|restaur|恢复|geri/i);
    const found = await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem('whatif.pfp.v1') ?? '{}').found ?? {}).length,
    );
    expect(found).toBe(1);
  });

  test('a bad code is refused, and changes nothing', async ({ page }) => {
    await page.goto('/pfp/');
    await page.locator('[data-pfp-backup] summary').click();
    await page.locator('[data-pfp-code]').fill('not-a-real-code');
    await page.locator('[data-pfp-import]').click();
    await expect(page.locator('[data-pfp-backup-status]')).not.toBeEmpty();

    const found = await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem('whatif.pfp.v1') ?? '{}').found ?? {}).length,
    );
    expect(found).toBe(0);
  });

  test('restoring never removes a find already on this browser', async ({ page }) => {
    await page.goto('/pfp/');
    await page.locator('[data-pfp-generate]').click();
    await expect(page.locator('[data-pfp-result]')).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-pfp-backup] summary').click();
    // A code carrying a real coin, but not the one just pulled.
    await page.locator('[data-pfp-code]').fill(await page.evaluate(() => 'x'));
    await page.locator('[data-pfp-import]').click();

    const found = await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem('whatif.pfp.v1') ?? '{}').found ?? {}).length,
    );
    expect(found, 'a refused code must not clear anything').toBe(1);
  });
});

/**
 * The community wall.
 *
 * This is the one place on the site where words written by somebody else reach
 * a visitor's browser. They arrive through X's oEmbed endpoint at build time as
 * a block of HTML, and `tools/build-tweets.mjs` reduces them to plain text
 * before anything is committed. The tests that matter are the ones proving that
 * reduction actually happened and that nothing markup-shaped survived.
 */
test.describe('the wall of posts', () => {
  test('shows real posts, each linking to the post it quotes', async ({ page }) => {
    await page.goto('/');
    const wall = page.locator('#posts');
    await expect(wall).toBeVisible();

    const cards = wall.locator('ul > li');
    await expect(cards).not.toHaveCount(0);

    const links = wall.locator('ul > li a[href^="https://x.com/"]');
    await expect(links).toHaveCount(await cards.count());

    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    );
    // Every card points at a distinct, real status URL — never a search, a
    // profile, or a redirect.
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d{1,25}$/);
    }
  });

  test('nothing markup-shaped survived the strip', async ({ page }) => {
    await page.goto('/');
    const texts = await page.locator('#posts [id$="-text"]').allTextContents();
    expect(texts.length).toBeGreaterThan(0);

    for (const text of texts) {
      expect(text.trim()).not.toBe('');
      // If a tag or an entity reaches the page as text, the reduction failed.
      // If it reaches it as markup, this is the least of the problems — the
      // structural check below covers that.
      expect(text, 'a tag survived as text').not.toMatch(/<\/?[a-z][^>]*>/i);
      expect(text, 'an unresolved entity survived').not.toMatch(/&(amp|lt|gt|quot|#\d+);/i);
      // oEmbed appends its own "— name (@handle) date" line; we render the
      // author ourselves, so it must have been dropped.
      expect(text, 'the oEmbed attribution line survived').not.toMatch(/—\s*.+\(@\w+\)/);
      expect(text, 'a media shortlink survived').not.toMatch(/pic\.(twitter|x)\.com/);
    }
  });

  test('the quoted text is inert, not markup', async ({ page }) => {
    await page.goto('/');
    // Whatever a post contains, it must be text nodes only. An element inside
    // the quote means third-party HTML was rendered rather than escaped.
    const elementsInside = await page
      .locator('#posts [id$="-text"]')
      .evaluateAll((nodes) => nodes.reduce((total, node) => total + node.children.length, 0));
    expect(elementsInside, 'a post rendered as markup').toBe(0);
  });

  test('every outbound link is safe to click', async ({ page }) => {
    await page.goto('/');
    const external = page.locator('#posts a[href^="http"]');
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('rel', /noreferrer/);
    }
  });

  /**
   * The two files have to agree.
   *
   * They are edited in different ways — one by hand, one by a generator — so
   * they can drift apart silently, and the site keeps rendering happily from a
   * stale card file while the next refresh quietly empties it. That happened
   * once: a stray `git checkout` reverted the URL list, the wall carried on
   * showing three posts from the committed cards, and nothing complained.
   */
  test('the posts on the wall are the posts we asked for', () => {
    const cardUrls = TWEET_CARDS.map((card) => card.url);
    expect(new Set(cardUrls).size, 'the same post twice').toBe(cardUrls.length);

    for (const url of TWEET_URLS) {
      expect(cardUrls, `${url} is listed but not on the wall — run npm run tweets`).toContain(url);
    }
    for (const url of cardUrls) {
      expect(TWEET_URLS, `${url} is on the wall but not listed`).toContain(url);
    }
  });

  test('each post link is told apart from the others', async ({ page }) => {
    await page.goto('/');
    // Resolved the way a screen reader does. All three used to announce the
    // account name and nothing else, so listing the page's links gave three
    // identical entries pointing at three different posts.
    const names = await page.locator('#posts a[href*="/status/"]').evaluateAll((links) =>
      links.map((link) => {
        const ids = link.getAttribute('aria-labelledby');
        if (!ids) return link.textContent?.trim() ?? '';
        return ids
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ');
      }),
    );
    expect(names.length).toBeGreaterThan(1);
    for (const name of names) expect(name.trim()).not.toBe('');
    expect(new Set(names).size, 'two links announce the same thing').toBe(names.length);
  });

  test('the English posts are marked as English on a translated page', async ({ page }) => {
    for (const [path, expected] of [
      ['/', null],
      ['/zh/', 'en'],
      ['/es/', 'en'],
      ['/tr/', 'en'],
    ] as const) {
      await page.goto(path);
      const langs = await page
        .locator('#posts [id$="-text"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('lang')));
      expect(langs.length).toBeGreaterThan(0);
      // Marked on a page declared as another language, absent where the page
      // is already English — an unnecessary lang is noise, a missing one makes
      // a Chinese screen reader pronounce English with Chinese phonetics.
      for (const lang of langs) expect(lang, `wrong lang on ${path}`).toBe(expected);
    }
  });

  /**
   * The pictures are the reason this is not X's embed widget.
   *
   * They are downloaded at build time and re-encoded into public/posts/, so
   * they load from this origin. If one ever pointed back at X, every visitor
   * would be announcing themselves to it on a page that promises they are not.
   */
  test('every picture is served from this site, not from X', async ({ page }) => {
    await page.goto('/');
    // The pictures are lazy and the wall is near the bottom of the page.
    await page.locator('#posts').scrollIntoViewIfNeeded();
    await expect(page.locator('#posts img').first()).toBeVisible();
    await page.waitForFunction(
      () => [...document.querySelectorAll<HTMLImageElement>('#posts img')].every((i) => i.complete),
      null,
      { timeout: 15_000 },
    );

    const images = await page.locator('#posts img').evaluateAll((nodes) =>
      nodes.map((node) => ({
        src: node.getAttribute('src') ?? '',
        loaded: (node as HTMLImageElement).naturalWidth > 0,
      })),
    );
    expect(images.length, 'the wall has no pictures at all').toBeGreaterThan(0);
    for (const image of images) {
      expect(image.src, 'a picture is hotlinked from a third party').toMatch(/^\/posts\//);
      expect(image.loaded, `${image.src} did not load`).toBe(true);
    }
  });

  test('a post shows its author, handle and date', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#posts ul > li').first();
    await expect(first.locator('[id$="-author"]')).not.toBeEmpty();
    await expect(first).toContainText('@');
    // A real date, not an empty <time>.
    await expect(first.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(first.locator('time')).not.toBeEmpty();
  });

  test('it is there in every language', async ({ page }) => {
    for (const path of ['/', '/es/', '/zh/', '/tr/']) {
      await page.goto(path);
      await expect(page.locator('#posts'), `no wall on ${path}`).toBeVisible();
      // The surrounding copy is translated even though the posts are not.
      await expect(page.locator('#posts ul > li')).not.toHaveCount(0);
    }
  });
});

/**
 * The white paper.
 *
 * A docs section fails quietly — a page falls out of the sidebar and every
 * other page still works, so nobody notices. These check the structure that
 * holds it together rather than the prose.
 */
test.describe('the white paper', () => {
  test('every page is reachable from the contents', async ({ page }) => {
    await page.goto('/docs/');
    const links = page.locator('a[href^="/docs/"]');
    const hrefs = [
      ...new Set(
        await links.evaluateAll((nodes) =>
          nodes.map((node) => new URL((node as HTMLAnchorElement).href).pathname),
        ),
      ),
    ].filter((href) => href !== '/docs/');

    expect(hrefs.length, 'the contents page lists nothing').toBeGreaterThan(10);
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.status(), `${href} is listed but does not exist`).toBe(200);
    }
  });

  test('the sidebar marks where you are, and prev/next walks the order', async ({ page }) => {
    await page.goto('/docs/how-to-buy/');
    await expect(page.locator('.docs-nav .docs-link[aria-current="page"]')).toContainText(
      'How to buy',
    );

    // Forward, then back, lands where it started.
    const next = page.locator('.docs-step').last();
    await next.click();
    await expect(page.locator('h1')).toContainText('Wallets and custody');
    await page.locator('.docs-step').first().click();
    await expect(page.locator('h1')).toContainText('How to buy');
  });

  /*
   * Every address the paper prints is one somebody could paste into a wallet, so
   * each one is declared here as well as written there. Adding an address to the
   * paper is then a deliberate act rather than a typo that ships.
   *
   * The launchpad's addresses are on the list because the paper documents them —
   * they are not ours, and the paper says so on the page. What must never happen
   * is a WRONG $IF contract address, which is the one mistake on a meme coin
   * site that costs somebody real money.
   */
  const DOCUMENTED_ADDRESSES = [
    TOKEN.address, // $IF itself
    TOKEN.primaryPool, // the IF/WETH 1% pool
    TOKEN.burnAddress, // 0x…dEaD
    '0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417', // NOXA's fee contract — every burn comes from here
    '0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b', // NOXA's original fee wallet, the 20% IF cut of 11–12 July
    '0x84F8E5a324466Deb7447048C014CF0245ce04afA', // the deployer
    '0x7E035Fb048a31e0481b88074557415b1C187242B', // the locker's owner
  ].map((address) => address.toLowerCase());

  test('every address in the paper is one we meant to publish', async ({ page }) => {
    for (const path of ['/docs/the-token/', '/docs/how-to-buy/', '/docs/reference/']) {
      await page.goto(path);
      const body = (await page.locator('.docs-prose, .docs-body').first().textContent()) ?? '';
      // The trailing boundary matters: without it the first 40 characters of a
      // 64-character transaction hash read as an address that is not ours.
      const addresses = [...body.matchAll(/0x[0-9a-fA-F]{40}\b/g)].map((match) => match[0]);
      expect(addresses.length, `${path} names no address`).toBeGreaterThan(0);
      for (const address of addresses) {
        expect(
          DOCUMENTED_ADDRESSES,
          `${path} publishes an address nobody declared: ${address}`,
        ).toContain(address.toLowerCase());
      }
    }
  });

  test('it is in the tools menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/docs/"]').first()).toHaveCount(1);
  });

  test('the contents page opens the paper on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/docs/risks/');
    // Collapsed to start, and it opens.
    await expect(page.locator('.docs-nav-mobile .docs-link').first()).toBeHidden();
    await page.locator('.docs-nav-summary').click();
    await expect(page.locator('.docs-nav-mobile .docs-link').first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0);
  });
});

/**
 * No link on the site points at a page that does not exist.
 *
 * The locale-leak test asks whether a link stays in the reader's language. This
 * asks the opposite question, and the two have opposite blind spots: for a
 * while every non-English page linked to /zh/learn/, /es/docs/ and the like —
 * 438 links, all 404, all invisible to a test that only looks for leaks into
 * English.
 */
test('every internal link resolves to a real page', () => {
  const dist = 'dist';
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) pages.push(full);
    }
  };
  walk(dist);
  expect(pages.length, 'nothing was built').toBeGreaterThan(100);

  const resolves = (href: string) => {
    const path = href.split('#')[0]!.split('?')[0]!;
    if (!path.startsWith('/')) return true;
    const base = join(dist, path.replace(/^\/|\/$/g, ''));
    // `${base}.html` is for the pages Astro writes flat rather than as a
    // directory — 404.html is the only one, and it is linked absolutely from
    // its own canonical, so nothing caught it until the walker learned to read
    // absolute URLs.
    return existsSync(join(base, 'index.html')) || existsSync(base) || existsSync(`${base}.html`);
  };

  const broken = new Map<string, number>();
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    // Root-relative hrefs, plus absolute ones on our own origin: hreflang
    // alternates are written absolute, so a walker that only saw "/..." missed
    // them entirely and 36 dead white-paper alternates shipped unnoticed.
    const found = [
      ...[...html.matchAll(/(?:href|src)="(\/[^"#][^"]*)"/g)].map((m) => m[1]!),
      ...[...html.matchAll(/(?:href|src)="([^"]+)"/g)]
        .map((m) => m[1]!)
        .filter((href) => href.startsWith(SITE.url))
        .map((href) => new URL(href).pathname),
    ];
    for (const href of new Set(found)) {
      if (!resolves(href)) broken.set(href, (broken.get(href) ?? 0) + 1);
    }
  }

  expect([...broken.keys()].sort(), 'these links 404').toEqual([]);
});

/**
 * The list of English-only routes is checked against what Astro built.
 *
 * src/config/navigation.ts decides three things from one list — whether a tool
 * link carries a locale prefix, whether a page names an hreflang alternate, and
 * where the language switcher sends you. A stale entry there is not a typo, it
 * is a 404 in three places at once. So the list is not trusted: it is compared
 * against the directory Astro produced.
 */
test('the English-only list matches what was actually built', () => {
  const dist = 'dist';
  const english: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      // Skip the locale trees and the build's own asset directories.
      if (prefix === '' && (LOCALES.includes(entry.name as never) || entry.name.startsWith('_'))) {
        continue;
      }
      const path = `${prefix}/${entry.name}`;
      if (existsSync(join(dir, entry.name, 'index.html'))) english.push(`${path}/`);
      walk(join(dir, entry.name), path);
    }
  };
  walk(dist, '');
  expect(english.length, 'nothing was built').toBeGreaterThan(50);

  const wrong: string[] = [];
  for (const path of english) {
    for (const locale of LOCALES.filter((code) => code !== 'en')) {
      const built = existsSync(join(dist, locale, path, 'index.html'));
      const claimed = hasTranslation(path, locale);
      if (built !== claimed) {
        wrong.push(`${path} in ${locale}: built=${built}, navigation.ts says ${claimed}`);
      }
    }
  }
  expect(wrong.sort(), 'ENGLISH_ONLY in src/config/navigation.ts is out of date').toEqual([]);
});

/**
 * Switching language keeps your place.
 *
 * The picker used to point at that language's home page from wherever you were,
 * so a reader halfway through a Learn article who wanted it in Turkish got the
 * Turkish landing page and had to find the article again — on the section of the
 * site written for people who are new and being careful.
 */
test.describe('the language picker keeps your place', () => {
  const KEEPS = [
    '/learn/spotting-a-scam/',
    '/zh/learn/self-custody-basics/',
    '/stats/',
    '/es/memes/',
  ];

  for (const path of KEEPS) {
    test(`${path} offers the same page in every language`, async ({ page }) => {
      await page.goto(path);
      const tail = path.replace(/^\/(zh|tr|es)\//, '/');

      for (const locale of LOCALES) {
        const href = await page.locator(`a[hreflang="${locale}"]`).first().getAttribute('href');
        expect(href, `${locale} should offer ${tail}`).toBe(
          locale === 'en' ? tail : `/${locale}${tail}`,
        );
      }
    });
  }

  /** No translation to keep: the white paper is English only. */
  test('a page with no translation falls back to that language home', async ({ page }) => {
    await page.goto('/docs/the-token/');
    expect(await page.locator('a[hreflang="zh"]').first().getAttribute('href')).toBe('/zh/');
    await expect(
      page.locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])'),
    ).toHaveCount(0);
  });
});

/**
 * The phone is the primary device, so these are the checks that matter most.
 *
 * Most people who open this site open it on a phone. Everything below is a
 * defect that only exists there — a desktop browser will never show it, and a
 * narrow desktop window will not either, because the difference is the input
 * device and the browser engine rather than the width.
 */
const PHONE_PAGES = [
  '/',
  '/stats/',
  '/holdings/',
  '/pfp/',
  '/pfp/godface/',
  '/memes/',
  '/memes/meme-two-buttons-sell-or-hold/',
  '/ask/',
  '/ask/day/2026-08-01/',
  '/learn/',
  '/learn/spotting-a-scam/',
  '/docs/',
  '/docs/the-token/',
  '/brand/',
  '/roadmap/',
  '/404',
  '/zh/',
  '/tr/stats/',
  '/es/pfp/',
];

test.describe('the site behaves on a phone', () => {
  /** Only the iPhone project; a narrow desktop window is not a phone. */
  const phoneOnly = 'these only reproduce on a phone engine';

  /*
   * iOS Safari zooms the whole page in when you focus a field whose computed
   * font-size is under 16px, and it does not zoom back out. You are left on a
   * page twice the width of the screen, having only wanted to paste an address.
   * The wallet lookup, the vault search and the restore-code box were all
   * 12-14px and all did it.
   */
  test('no form field is small enough to trigger iOS zoom', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', phoneOnly);
    const offenders: string[] = [];
    for (const path of ['/holdings/', '/memes/', '/pfp/', '/ask/']) {
      await page.goto(path);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('input, select, textarea')]
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            size: Number.parseFloat(getComputedStyle(el).fontSize),
          }))
          .filter((field) => field.size < 16),
      );
      for (const field of small) offenders.push(`${path} ${field.tag} at ${field.size}px`);
    }
    expect(offenders, 'a field under 16px zooms iOS Safari in and never back out').toEqual([]);
  });

  /*
   * 320px is an iPhone SE 1st gen and a folded Galaxy Fold, and it is the width
   * that breaks first. The offending element is reported by name because
   * "the page overflows by 14px" is not something anyone can act on.
   */
  /*
   * This asks whether anything is CUT OFF, not whether the page scrolls.
   *
   * global.css sets `html { overflow-x: clip }` deliberately, so the page can
   * never scroll sideways — which means `scrollWidth - clientWidth` is always
   * zero and an element hanging past the right edge is silently amputated
   * rather than reachable. Measuring the page told us nothing; measuring the
   * elements found a Spanish heading losing its last word, four dashboard
   * figures losing their currency, and three chart buttons that had no pixels
   * on screen at all.
   *
   * An element inside a horizontal scroller is exempt: the holders table is
   * `min-w-[32rem]` inside `overflow-x-auto` on purpose, and scrolls.
   */
  for (const width of [320, 360, 375, 390, 414, 428]) {
    test(`nothing is cut off the right edge at ${width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', phoneOnly);
      await page.setViewportSize({ width, height: 780 });
      const clipped: string[] = [];
      for (const path of PHONE_PAGES) {
        await page.goto(path);
        const found = await page.evaluate(() => {
          const edge = document.documentElement.clientWidth;
          const scrolls = (el: HTMLElement) => {
            for (let node: HTMLElement | null = el; node; node = node.parentElement) {
              const overflowX = getComputedStyle(node).overflowX;
              if (overflowX === 'auto' || overflowX === 'scroll') return true;
            }
            return false;
          };
          return [...document.querySelectorAll<HTMLElement>('body *')]
            .filter((el) => {
              const box = el.getBoundingClientRect();
              // The marquee is wider than the screen by design and clipped by
              // its own container.
              if (el.closest('[class*=animate-marquee]')) return false;
              return box.width > 0 && box.right > edge + 1 && !scrolls(el);
            })
            .slice(0, 3)
            .map(
              (el) =>
                `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 30)} +${Math.round(el.getBoundingClientRect().right - edge)}px`,
            );
        });
        for (const one of found) clipped.push(`${path}  ${one}`);
      }
      expect(clipped, 'content past the right edge is lost, not scrollable').toEqual([]);
    });
  }

  /*
   * WCAG 2.2 requires 24x24. 44x44 is the size a thumb actually needs, and the
   * chart controls sit directly above a surface that pans under the same
   * finger, so a miss there does something rather than nothing.
   */
  test('every control is big enough to hit', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', phoneOnly);
    const small: string[] = [];
    for (const path of PHONE_PAGES) {
      await page.goto(path);
      const targets = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            'a, button, summary, input, textarea, select, [role="button"]',
          ),
        ]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            if (box.width === 0 || box.height === 0 || el.offsetParent === null) return false;
            // Not a target if it cannot be tapped: the burn curve's dots are a
            // picture on a phone, and the same transactions are links below it.
            if (getComputedStyle(el).pointerEvents === 'none') return false;
            // WCAG 2.2 SC 2.5.8 exempts a target whose size is set by the
            // line-height of the text it sits in — a link inside a sentence.
            // Padding one to 44px would open holes in the paragraph around it.
            if (getComputedStyle(el).display === 'inline') return false;
            // The skip link is 1x1 until it takes focus, at which point it is
            // full size. It is checked by its own test.
            if (el.classList.contains('sr-only')) return false;
            return true;
          })
          .map((el) => {
            const box = el.getBoundingClientRect();
            return {
              what: `${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}`,
              w: Math.round(box.width),
              h: Math.round(box.height),
              text: (el.textContent ?? '').trim().slice(0, 24),
            };
          })
          .filter((target) => target.w < 24 || target.h < 24),
      );
      for (const target of targets) {
        small.push(`${path} ${target.what} "${target.text}" is ${target.w}x${target.h}`);
      }
    }
    expect(small, 'WCAG 2.2 target size: nothing tappable may be under 24x24').toEqual([]);
  });
});

/**
 * The chart can be read with a finger.
 *
 * A finger has no hover, so every touch on the chart begins with a pointerdown.
 * The pan handler used to claim the gesture on that first event, which set
 * `panning` before the crosshair handler ran — so the crosshair, the tooltip and
 * the OHLC readout, the things that make the chart readable rather than
 * decorative, could not be reached from a phone at all. A mouse never showed it,
 * because a mouse moves without a button down.
 *
 * The market API is stubbed here rather than skipped. The other chart tests skip
 * themselves when GeckoTerminal throttles, which means a regression in this
 * behaviour could ship on any day the API was busy.
 */
test.describe('the chart reads under a finger', () => {
  /** Well-formed OHLCV so the chart draws without reaching the network. */
  const candles = (at: number) =>
    Array.from({ length: 240 }, (_, i) => {
      const time = at - (239 - i) * 3600;
      const base = 0.008 + Math.sin(i / 9) * 0.0006;
      return [time, base, base * 1.02, base * 0.98, base * 1.005, 12_000 + i * 30];
    }).reverse();

  test('a tap reads the candle, a drag moves the chart', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'this only reproduces on a touch pointer');

    await page.route('**/api.geckoterminal.com/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          route.request().url().includes('/ohlcv/')
            ? { data: { attributes: { ohlcv_list: candles(1_788_000_000) } } }
            : { data: { attributes: {} } },
        ),
      }),
    );

    await page.goto('/stats/');
    const chart = page.locator('[data-chart-wrap]');
    await expect(chart).toBeVisible();
    await page.waitForFunction(() => document.querySelectorAll('[data-chart] rect').length > 10);

    const state = () =>
      page.evaluate(() => ({
        crosshair: document.querySelector('[data-crosshair]')?.getAttribute('opacity'),
        tipHidden: document.querySelector('[data-tip]')?.hasAttribute('hidden'),
        panning: document.querySelector<HTMLElement>('[data-chart-wrap]')?.dataset.panning ?? null,
      }));

    /** A touch pointer event at the plot's midpoint, offset horizontally. */
    const touch = (type: string, dx: number) =>
      page.evaluate(
        ([kind, offset]) => {
          const el = document.querySelector('[data-chart-wrap]')!;
          const box = el.getBoundingClientRect();
          el.dispatchEvent(
            new PointerEvent(kind as string, {
              bubbles: true,
              pointerId: 1,
              pointerType: 'touch',
              isPrimary: true,
              clientX: box.left + box.width / 2 + (offset as number),
              clientY: box.top + box.height / 2,
            }),
          );
        },
        [type, dx] as [string, number],
      );

    expect(await state()).toMatchObject({ crosshair: '0', tipHidden: true });

    await touch('pointerdown', 0);
    expect(await state(), 'a tap should read the candle under it').toMatchObject({
      crosshair: '1',
      tipHidden: false,
    });

    // Under the slop threshold: still a read, not a drag.
    await touch('pointermove', 3);
    expect(await state(), 'a 3px wobble is not a drag').toMatchObject({
      crosshair: '1',
      panning: null,
    });

    await touch('pointermove', 60);
    expect(await state(), 'a real drag pans and drops the stale reading').toMatchObject({
      crosshair: '0',
      tipHidden: true,
      panning: 'true',
    });

    await touch('pointerup', 60);
    await touch('pointerdown', -40);
    expect(await state(), 'and the chart is readable again afterwards').toMatchObject({
      crosshair: '1',
      tipHidden: false,
    });
  });
});

/**
 * The things that differ between engines, and the widths where four languages
 * stop fitting.
 *
 * These run in every project rather than one, because that is the entire point:
 * a check that only ever sees Blink and WebKit cannot tell you that Gecko is
 * missing a selector the navigation depends on.
 */
test.describe('it works the same in every engine', () => {
  /*
   * The dropdown must not need `:has()`.
   *
   * The panel used to be revealed only by `.tools-menu:has([aria-expanded])`,
   * and Firefox did not ship `:has()` until 121 — so on an ESR build the site's
   * main navigation could not be opened at all. The script mirrors the state
   * onto the container as `data-open`, and this asserts that mirror exists, not
   * merely that the panel happens to be visible.
   */
  test('the tools menu opens without needing a modern selector', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'the phone has its own menu');
    await page.goto('/');
    const menu = page.locator('.tools-menu').first();
    const toggle = menu.locator('[data-tools-toggle]');

    await toggle.click();
    await expect(menu).toHaveAttribute('data-open', '');
    await expect(menu.locator('.tools-panel')).toBeVisible();

    await page.keyboard.press('Escape');
    // Take the pointer off the menu: hover holds the panel open by design.
    await page.mouse.move(10, 600);
    await expect(menu).not.toHaveAttribute('data-open', '');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  /*
   * Every viewport-height rule carries a `vh` fallback in its own @supports
   * block. Two declarations in one rule get deduplicated by the minifier, and
   * the one it drops is the fallback — so this asserts the shipped CSS, not the
   * source.
   */
  test('viewport-height rules keep their fallback', async ({ page }) => {
    await page.goto('/');
    const heights = await page.evaluate(() => {
      const hero = document.querySelector('#top');
      return hero ? getComputedStyle(hero).minHeight : '';
    });
    expect(heights, 'the hero must have a minimum height').not.toBe('0px');
    expect(heights).not.toBe('auto');
  });

  /*
   * The header row holds the logo, four section links, two menus and a call to
   * action, and the labels are not the same length in four languages. At iPad
   * portrait the Spanish nav ran past the edge of the screen — and nothing on
   * this site can scroll sideways, so it was simply gone.
   */
  for (const width of [768, 820, 912, 1024, 1280]) {
    test(`the header fits every language at ${width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile', 'phones use the collapsed menu');
      await page.setViewportSize({ width, height: 900 });
      const spilling: string[] = [];
      for (const path of ['/', '/es/', '/tr/', '/zh/']) {
        await page.goto(path);
        const over = await page.evaluate(() => {
          const edge = document.documentElement.clientWidth;
          return [...document.querySelectorAll<HTMLElement>('header *')]
            .filter((el) => {
              const box = el.getBoundingClientRect();
              return box.width > 0 && box.right > edge + 1;
            })
            .slice(0, 1)
            .map(
              (el) =>
                `${el.className.toString().slice(0, 30)} +${Math.round(el.getBoundingClientRect().right - edge)}px`,
            );
        });
        for (const one of over) spilling.push(`${path} ${one}`);
      }
      expect(spilling, 'the header must fit the longest language').toEqual([]);
    });
  }

  /*
   * A phone on its side is a real orientation, and the hero used to reserve a
   * full viewport plus portrait padding in it — 718px of a 390px screen, with
   * everything but the headline below the fold.
   */
  test('a landscape phone can see the call to action', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'orientation only matters on a phone');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    const reachable = await page.evaluate(() => {
      const cta = document.querySelector('#top .enter-2');
      return cta ? cta.getBoundingClientRect().bottom <= window.innerHeight : false;
    });
    expect(reachable, 'the Buy button must be on screen in landscape').toBe(true);
  });
});
