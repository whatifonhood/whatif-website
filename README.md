# whatifonhood.com

The official website for **What $IF** ($IF) on Robinhood Chain.

A static site: every page is HTML generated at build time. There is no server, no
database, no login and **no environment variables** — clone it, install, and it runs.

```bash
npm install
npm run dev      # http://localhost:4321
```

---

## Where things live

```
src/
  config/site.ts        Every fact: contract address, chain, links.  ← start here
  config/ecosystem.ts   The tools listed in the Ecosystem section
  config/memes.ts       Generated — the meme vault index
  config/coin-history.ts Generated — prices for the What $IF Machine
  content/en.ts         Every word on the site, in English
  content/zh.ts         …in Chinese
  content/tr.ts         …in Turkish
  content/types.ts      The shape all three must match
  components/sections/  One file per section of the landing page
  components/ui/        Shared pieces: Button, Card, Eyebrow, CopyField
  scripts/              Browser code, one file per behaviour
  lib/                  Data fetching and number formatting
  layouts/              Page shells
  pages/                One file per URL
  styles/global.css     The design system: colours, type, spacing
public/                 Files served as-is: favicons, _headers, the PFP generator
tools/                  Build-time scripts (see "Regenerating things")
tests/                  Playwright tests
```

Two rules keep this navigable:

1. **Facts live in `src/config/site.ts`.** No component hard-codes a URL or an
   address. Change a link once, it changes everywhere.
2. **Words live in `src/content/`.** No component contains a sentence. Editing
   copy never means reading code.

---

## How do I…

### …change some wording?

Open `src/content/en.ts` and edit the string. The same key exists in `zh.ts` and
`tr.ts`; TypeScript fails the build if one is missing, so translations cannot
silently drift.

### …change a link, the contract address, or a chain parameter?

`src/config/site.ts`. One place, and a test fails if any page ends up showing a
contract address that disagrees with it.

### …add a language?

1. Copy `src/content/en.ts` to `src/content/<code>.ts` and translate it.
2. Add the code to `LOCALES`, `LOCALE_NAMES` and `LOCALE_PATHS` in `src/config/site.ts`.
3. Register it in `src/content/index.ts`.
4. Add `src/pages/<code>/index.astro` containing `<Landing locale="<code>" />`.
5. Add the code to `i18n.locales` in `astro.config.mjs`.

### …put a post on the community wall?

Paste the post's URL into `TWEET_URLS` in `src/config/tweets.ts`, then run:

```bash
npm run tweets
```

That fetches the text and author through X's oEmbed endpoint **at build time**,
reduces the returned HTML to plain text, and writes `src/config/tweet-cards.ts` —
which is what the page renders. Commit both files.

No third-party script runs on the site and no iframe loads, so the
Content-Security-Policy is untouched. The daily refresh re-runs this; a post
deleted on X drops off the wall, and a rate limit or an outage changes nothing.

### …add a meme to the vault?

Drop the PNG into `what-if-meme/brand-pack/meme-pack/memes/`, then:

```bash
npm run memes
```

That resizes it, writes the thumbnail and the download, and regenerates
`src/config/memes.ts`. The series it lands in comes from the filename prefix —
see `seriesFor()` in `tools/build-memes.mjs`.

### …add or reorder a section on the landing page?

`src/layouts/Landing.astro` lists the sections in the order a visitor meets them.
Move a line to reorder; add a component to `src/components/sections/` and one
line here to add one.

### …add a FAQ entry?

Add an object to `faq.items` in each of the three content files.

### …change a colour, a font or the spacing?

`src/styles/global.css`. Everything is a token in the `@theme` block, and
components only use token-derived classes (`bg-void`, `text-lime`,
`font-display`). There are no raw hex values anywhere else — Tailwind's default
`lime` palette is deliberately removed so an off-brand green fails loudly.

### …update the numbers shown before JavaScript loads?

```bash
npm run snapshot
```

Reads the live price, market cap and burn, and rewrites `TOKEN_SNAPSHOT` in
`src/config/site.ts`. Run it before a release. (Blockscout blocks automated
requests, so the holder count keeps its previous value and says so.)

### …refresh the What $IF Machine's prices?

```bash
npm run history
```

Rebuilds the whole coin set: monthly prices from Binance, names, ranks and logos
from CoinGecko. Both are keyless and public. The result is written into
`public/machine/` and served from this origin, so the page never calls an API.

### …widen the What $IF Machine's coin list?

Copy `.env.example` to `.env`, add a free CoinGecko key, and run `npm run history`.
Without a key the set is limited to coins Binance lists; with one it is the top
coins by market cap, which is most of what people actually ask about. The key is
read at build time only and never reaches the browser — the site itself still
runs with no environment variables.

### …add a logo for another tool?

Drop the file in `src/assets/logos`, add one line to `src/components/ui/ToolLogo.astro`,
and reference it from `src/config/ecosystem.ts`. Logos are always downloaded and
served from here — never hotlinked.

### …regenerate the social sharing card?

Edit `tools/og-card.html`, then `npm run og`.

---

## Commands

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm run dev`      | Local dev server with hot reload                          |
| `npm run build`    | Production build into `dist/`                             |
| `npm run preview`  | Serve the production build locally                        |
| `npm run check`    | Typecheck, lint, format check and build — run before a PR |
| `npm test`         | Playwright tests against a real build                     |
| `npm run memes`    | Rebuild the meme vault (needs ImageMagick 7)              |
| `npm run history`  | Refresh prices for the What $IF Machine                   |
| `npm run snapshot` | Refresh the build-time token figures                      |
| `npm run og`       | Re-render the social sharing card                         |
| `npm run headers`  | Regenerate `public/_headers` and `vercel.json`            |
| `npm run burns`    | Re-read the burn history from the chain                   |
| `npm run coinlist` | Rebuild the Machine's coin index from CoinGecko           |

---

## Architecture

**Astro, with no UI framework.** Pages are prerendered to static HTML, so crawlers
and social scrapers see real content and the browser paints before any JavaScript
runs. The interactive parts — the starfield, the copy buttons, the meme filter, the
question generator, the calculator, the live chart — are small TypeScript files
in `src/scripts/`, loaded per page. There is no React on the site; nothing here needed it.

**Live figures degrade to snapshots.** The price, market cap and burn are
rendered server-side from `TOKEN_SNAPSHOT` and replaced in the browser once
DexScreener and the chain respond. If either call fails or times out, the page
keeps showing the snapshot with its capture date. It never shows a spinner or a
blank.

**Images** are imported through Astro so it emits WebP at several widths with
content hashes. AVIF was measured and dropped: on this artwork it came out
_larger_ than WebP, and browsers take the first format they support. The hero is a real `<img>` with `fetchpriority="high"` in the
static HTML, which is what lets the browser start fetching it during parsing.

---

## Security

The site holds no secrets because it has nothing to hold: no accounts, no API
keys, no database, no user data. What is left is guarded deliberately.

- **The contract address** is defined once, rendered in full in a monospace face
  next to a copy button, and never truncated. `tests/smoke.spec.ts` fails the
  build if any page shows a different one, or shows one with an ellipsis in it.
- **The site never asks for a wallet.** No connect button, no signature prompt,
  no seed phrase, ever. That promise is printed on the page so a clone that
  breaks it is recognisable, and a test asserts the page keeps it.
- **Content-Security-Policy** allows scripts, styles and
  fonts only from this origin, and network calls only to the four public
  read-only APIs the live figures need — DexScreener, GeckoTerminal, CoinGecko
  and the Robinhood Chain RPC. No inline scripts, no inline styles, no
  `unsafe-eval`. `tests/headers.spec.ts` asserts every directive.
- **Every response from an API is validated** field by field before use
  (`src/lib/token-stats.ts`), has a timeout, and falls back to the snapshot.
- **Nothing is written to the page as HTML.** Values are set with `textContent`.
- **Nothing is uploaded.** The site has no file input and no form that posts
  anywhere. Every card it draws is drawn on the visitor's own device.
- **A pasted collection code** (`src/lib/collection-code.ts`) is untrusted input
  from outside the page: every coin name in it is checked against the real pool
  and anything unrecognised is dropped, the counters are clamped, and a restore
  merges rather than replaces so it can never remove a find.
- **Dependencies** are pinned by `package-lock.json`, installed with `npm ci` in
  CI, and audited on every run.

If you find something, open an issue without a proof-of-concept and we will get
in touch.

---

## Deploying

Vercel, from `main`. There are no environment variables to set.

Both hosts are supported and both configs are **generated**, because they
disagree about conflicts: Netlify applies the _first_ matching rule, Vercel the
_last_. Keeping two hand-written files in step failed — three of four CSP blocks
had drifted apart. So the policy is written once in
`src/config/security-headers.ts`, and `npm run headers` emits `public/_headers`
and `vercel.json` in each host's required order. Edit the config, never the
outputs. `tests/headers.spec.ts` asserts the two agree.

---

## The PFP generator

`/pfp` is a page of this site like any other: `src/pages/pfp/index.astro` for the
generator, `src/pages/pfp/[slug].astro` for each coin's own shareable page, and
`src/scripts/pfp.ts` for the pulling logic. The odds and pity timers are in plain
sight at the top of that script.

The artwork and its manifest come from the module in `../pfp` that produced them:

```bash
npm run coins    # copies artwork into public/coins and regenerates src/config/coins.ts
```

What a visitor has pulled lives in their own browser's `localStorage` and is
never sent anywhere.
