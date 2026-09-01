/**
 * The PFP generator.
 *
 * Ported from the standalone module so it lives inside the site: same header,
 * same footer, same design tokens. Everything still happens in the browser —
 * there is no backend, no wallet and no account. What you have found is kept in
 * this browser's localStorage and never leaves the device.
 *
 * The odds and the pity timers are in src/config/coins.ts and below, in plain
 * sight, because a generator that hides its odds is a slot machine.
 */
import { decodeCollection, encodeCollection } from '../lib/collection-code.ts';
import { COINS, COIN_TIERS, type Coin, type CoinTier } from '../config/coins.ts';
import { SITE } from '../config/site.ts';

/** Force a rare if one has not appeared in this many pulls, and a legendary likewise. */
const PITY = { rare: 8, legendary: 60 };

const STORAGE_KEY = 'whatif.pfp.v1';
const SPIN_TURNS = 6;
const SPIN_MS = 2400;

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

const TIER_COLOR: Record<CoinTier, string> = {
  common: '#8FCE02',
  uncommon: '#C4DC43',
  rare: '#5BC8F5',
  legendary: '#E4D98E',
};

interface State {
  found: Record<string, true>;
  sinceRare: number;
  sinceLegendary: number;
  poolOpen: boolean;
}

function loadState(): State {
  const empty: State = { found: {}, sinceRare: 0, sinceLegendary: 0, poolOpen: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return empty;
    const value = parsed as Partial<State>;
    return {
      found: typeof value.found === 'object' && value.found !== null ? value.found : {},
      sinceRare: Number(value.sinceRare) || 0,
      sinceLegendary: Number(value.sinceLegendary) || 0,
      poolOpen: value.poolOpen === true,
    };
  } catch {
    // Private browsing, or storage disabled. The generator still works; it just
    // will not remember anything between visits.
    return empty;
  }
}

function saveState(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* nothing to do — see loadState */
  }
}

const coinImage = (coin: Coin, kind: 'full' | 'thumb' | 'png') =>
  kind === 'png' ? `/coins/full/${coin.slug}.png` : `/coins/${kind}/${coin.slug}.webp`;

/** Picks a tier by weight, then a coin from it, preferring ones never seen before. */
function pickCoin(state: State): Coin {
  const entries = Object.entries(COIN_TIERS) as [CoinTier, { weight: number }][];
  const total = entries.reduce((sum, [, tier]) => sum + tier.weight, 0);

  let roll = Math.random() * total;
  let tier: CoinTier = 'common';
  for (const [key, value] of entries) {
    roll -= value.weight;
    if (roll <= 0) {
      tier = key;
      break;
    }
  }

  // Pity: a long dry run is not fun, so guarantee the good tiers eventually.
  if (state.sinceLegendary >= PITY.legendary - 1) tier = 'legendary';
  else if (state.sinceRare >= PITY.rare - 1 && (tier === 'common' || tier === 'uncommon')) {
    tier = 'rare';
  }

  const pool = COINS.filter((coin) => coin.tier === tier);
  const unseen = pool.filter((coin) => !state.found[coin.slug]);
  const choices = unseen.length > 0 ? unseen : pool;
  return choices[Math.floor(Math.random() * choices.length)] ?? COINS[0]!;
}

/** Draws the 1200x675 share card on a canvas. */
async function drawShareCard(canvas: HTMLCanvasElement, coin: Coin, tierLabel: string) {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // A deterministic starfield, so the same coin always makes the same card.
  let seed = [...coin.slug].reduce((acc, character) => acc + character.charCodeAt(0), 0);
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 150; i += 1) {
    const x = random() * CARD_WIDTH;
    const y = random() * CARD_HEIGHT;
    context.globalAlpha = 0.15 + random() * 0.5;
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(x, y, random() * 1.4 + 0.2, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  const accent = TIER_COLOR[coin.tier];

  // The coin, circular, on the right.
  const image = new Image();
  image.src = coinImage(coin, 'full');
  await image.decode().catch(() => undefined);

  const radius = 236;
  const centreX = CARD_WIDTH - radius - 80;
  const centreY = CARD_HEIGHT / 2;

  const glow = context.createRadialGradient(
    centreX,
    centreY,
    radius * 0.6,
    centreX,
    centreY,
    radius * 1.5,
  );
  glow.addColorStop(0, `${accent}44`);
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(centreX - radius * 1.6, centreY - radius * 1.6, radius * 3.2, radius * 3.2);

  if (image.complete && image.naturalWidth > 0) {
    context.save();
    context.beginPath();
    context.arc(centreX, centreY, radius, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, centreX - radius, centreY - radius, radius * 2, radius * 2);
    context.restore();
  }

  // Type on the left.
  const left = 80;
  context.fillStyle = accent;
  context.font = '700 22px "JetBrains Mono", monospace';
  context.fillText(tierLabel.toUpperCase(), left, 250);

  context.fillStyle = '#E9F0DD';
  let size = 96;
  context.font = `900 italic ${size}px Archivo, sans-serif`;
  while (context.measureText(coin.name.toUpperCase()).width > 560 && size > 40) {
    size -= 4;
    context.font = `900 italic ${size}px Archivo, sans-serif`;
  }
  context.fillText(coin.name.toUpperCase(), left, 340);

  context.fillStyle = '#9AA889';
  context.font = '400 26px Archivo, sans-serif';
  context.fillText("What $IF this one's you?", left, 400);

  context.fillStyle = '#7D8C6E';
  context.font = '400 19px "JetBrains Mono", monospace';
  context.fillText(`${SITE.url.replace('https://', '')}/pfp`, left, 580);
}

export function initPfp(): void {
  const root = document.querySelector<HTMLElement>('[data-pfp]');
  if (!root) return;

  const coinWrap = root.querySelector<HTMLElement>('[data-pfp-coin]');
  const image = root.querySelector<HTMLImageElement>('[data-pfp-img]');
  const generate = root.querySelector<HTMLButtonElement>('[data-pfp-generate]');
  const result = root.querySelector<HTMLElement>('[data-pfp-result]');
  const nameEl = root.querySelector<HTMLElement>('[data-pfp-name]');
  const tierEl = root.querySelector<HTMLElement>('[data-pfp-tier]');
  const actions = root.querySelector<HTMLElement>('[data-pfp-actions]');
  const statusEl = root.querySelector<HTMLElement>('[data-pfp-status]');
  const download = root.querySelector<HTMLAnchorElement>('[data-pfp-download]');
  const cardLink = root.querySelector<HTMLAnchorElement>('[data-pfp-card]');
  const shareLink = root.querySelector<HTMLAnchorElement>('[data-pfp-x]');
  const foundEl = root.querySelector<HTMLElement>('[data-pfp-found]');
  const poolToggle = root.querySelector<HTMLButtonElement>('[data-pfp-pool-toggle]');
  const pool = root.querySelector<HTMLElement>('[data-pfp-pool]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pfp-canvas]');
  if (!coinWrap || !image || !generate || !result || !nameEl || !tierEl) return;

  const labels = {
    generate: generate.dataset.labelGenerate ?? generate.textContent ?? '',
    again: generate.dataset.labelAgain ?? '',
    found: foundEl?.dataset.template ?? '{found} / {total}',
    showPool: poolToggle?.dataset.labelShow ?? '',
    hidePool: poolToggle?.dataset.labelHide ?? '',
    shareText: shareLink?.dataset.template ?? '',
    rolled: root.dataset.labelRolled ?? '{name} — {tier}',
    backupCopied: root.dataset.labelBackupCopied ?? '',
    backupSelected: root.dataset.labelBackupSelected ?? '',
    backupBad: root.dataset.labelBackupBad ?? '',
    backupRestored: root.dataset.labelBackupRestored ?? '',
  };
  const tierLabels: Record<string, string> = JSON.parse(root.dataset.tiers ?? '{}');

  const state = loadState();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rolling = false;
  let cardUrl: string | null = null;

  const paintFound = () => {
    const found = Object.keys(state.found).length;
    if (foundEl) {
      foundEl.textContent = labels.found
        .replace('{found}', String(found))
        .replace('{total}', String(COINS.length));
    }
    for (const slug of Object.keys(state.found)) {
      root
        .querySelector(`[data-coin-slug="${CSS.escape(slug)}"]`)
        ?.setAttribute('data-found', 'true');
    }
  };

  const setPool = (open: boolean) => {
    state.poolOpen = open;
    saveState(state);
    poolToggle?.setAttribute('aria-expanded', String(open));
    if (pool) pool.hidden = !open;
    if (poolToggle) {
      const label = poolToggle.querySelector('[data-pool-label]');
      if (label) label.textContent = open ? labels.hidePool : labels.showPool;
    }
  };

  const land = (coin: Coin) => {
    rolling = false;
    const tierLabel = tierLabels[coin.tier] ?? coin.tier;

    image.src = coinImage(coin, 'full');
    image.alt = coin.name;
    coinWrap.dataset.tier = coin.tier;
    nameEl.textContent = coin.name;
    tierEl.textContent = tierLabel;
    tierEl.dataset.tier = coin.tier;
    result.hidden = false;
    if (actions) actions.hidden = false;
    generate.setAttribute('aria-disabled', 'false');
    generate.textContent = labels.again;
    // Announced, because the result appears in a region nothing points at.
    if (statusEl)
      statusEl.textContent = labels.rolled
        .replace('{name}', coin.name)
        .replace('{tier}', tierLabel);

    // Record it, and reset the relevant pity counter.
    if (!state.found[coin.slug]) state.found[coin.slug] = true;
    state.sinceRare = coin.tier === 'rare' || coin.tier === 'legendary' ? 0 : state.sinceRare + 1;
    state.sinceLegendary = coin.tier === 'legendary' ? 0 : state.sinceLegendary + 1;
    saveState(state);
    paintFound();

    if (download) {
      download.href = coinImage(coin, 'png');
      download.download = `what-if-${coin.slug}.png`;
    }
    if (shareLink) {
      const url = new URL('https://x.com/intent/post');
      url.searchParams.set(
        'text',
        labels.shareText.replace('{name}', coin.name).replace('{tier}', tierLabel),
      );
      url.searchParams.set('url', `${SITE.url}/pfp/${coin.slug}`);
      shareLink.href = url.toString();
    }
    if (canvas && cardLink) {
      void drawShareCard(canvas, coin, tierLabel).then(() => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          if (cardUrl) URL.revokeObjectURL(cardUrl);
          cardUrl = URL.createObjectURL(blob);
          cardLink.href = cardUrl;
          cardLink.download = `what-if-${coin.slug}-card.png`;
        }, 'image/png');
      });
    }

    // A short buzz on a good pull, where the device supports it.
    if (!reduceMotion && 'vibrate' in navigator) {
      if (coin.tier === 'legendary') navigator.vibrate([18, 40, 18, 40, 28]);
      else if (coin.tier === 'rare') navigator.vibrate([12, 30, 18]);
    }
  };

  /** Spins the coin on its Y axis, swapping faces while it is edge-on. */
  const spin = (target: Coin) => {
    const others = COINS.filter((coin) => coin.slug !== target.slug);
    const totalDegrees = SPIN_TURNS * 360;
    const lastHalf = totalDegrees / 180 - 1;
    let start: number | null = null;
    let half = 0;

    // Preload so the final half-turn reveals the coin rather than a blank.
    const preload = new Image();
    preload.src = coinImage(target, 'full');

    const frame = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / SPIN_MS);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const angle = totalDegrees * eased;
      coinWrap.style.setProperty('--spin', `${angle}deg`);

      const speed = progress < 0.5 ? 12 * progress ** 2 : 12 * (1 - progress) ** 2;
      coinWrap.style.setProperty('--spin-blur', `${Math.min(3, speed * 0.7)}px`);

      const currentHalf = Math.floor((angle + 90) / 180);
      if (currentHalf !== half) {
        half = currentHalf;
        image.src =
          currentHalf >= lastHalf
            ? coinImage(target, 'full')
            : coinImage(others[Math.floor(Math.random() * others.length)] ?? target, 'thumb');
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      coinWrap.style.removeProperty('--spin');
      coinWrap.style.removeProperty('--spin-blur');
      land(target);
    };
    requestAnimationFrame(frame);
  };

  generate.addEventListener('click', () => {
    // `rolling` is the real guard. The button reports the state rather than
    // taking it, because a disabled button loses focus mid-roll.
    if (rolling) return;
    rolling = true;
    generate.setAttribute('aria-disabled', 'true');
    result.hidden = true;
    if (actions) actions.hidden = true;
    coinWrap.dataset.tier = 'none';

    const target = pickCoin(state);
    if (reduceMotion) land(target);
    else spin(target);
  });

  poolToggle?.addEventListener('click', () => {
    setPool(poolToggle.getAttribute('aria-expanded') !== 'true');
  });

  /**
   * Moving the collection to another browser.
   *
   * Read and written through `collection-code.ts`, which validates every slug
   * against the real pool — a pasted code is input from outside this page.
   */
  const backup = root.querySelector<HTMLElement>('[data-pfp-backup]');
  if (backup) {
    const field = backup.querySelector<HTMLTextAreaElement>('[data-pfp-code]');
    const status = backup.querySelector<HTMLElement>('[data-pfp-backup-status]');
    const say = (message: string) => {
      if (status) status.textContent = message;
    };

    backup.querySelector('[data-pfp-export]')?.addEventListener('click', () => {
      const code = encodeCollection({
        found: Object.keys(state.found),
        sinceRare: state.sinceRare,
        sinceLegendary: state.sinceLegendary,
      });
      if (field) {
        field.value = code;
        field.select();
      }
      // The code is in the field either way, so a refused clipboard is not a
      // failure worth reporting as one.
      void navigator.clipboard?.writeText(code).then(
        () => say(labels.backupCopied),
        () => say(labels.backupSelected),
      );
    });

    backup.querySelector('[data-pfp-import]')?.addEventListener('click', () => {
      const restored = decodeCollection(field?.value ?? '');
      if (!restored) return say(labels.backupBad);

      // Merged, not replaced: restoring on a browser that already has finds
      // must never take any away.
      for (const slug of restored.found) state.found[slug] = true;
      state.sinceRare = Math.max(state.sinceRare, restored.sinceRare);
      state.sinceLegendary = Math.max(state.sinceLegendary, restored.sinceLegendary);
      saveState(state);
      paintFound();
      say(labels.backupRestored.replace('{count}', String(Object.keys(state.found).length)));
    });
  }

  paintFound();
  setPool(state.poolOpen);
}
