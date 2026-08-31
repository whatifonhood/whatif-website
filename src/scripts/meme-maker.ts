/**
 * The meme generator.
 *
 * Everything happens on the visitor's own device: the words are typed into a
 * canvas, the canvas becomes a PNG, and the PNG is handed to the share sheet or
 * saved. Nothing is uploaded, nothing is stored, and no text ever leaves the
 * browser — so there is no user content on our infrastructure and no injection
 * surface, because the words are drawn as pixels rather than inserted anywhere
 * near the DOM.
 *
 * Layouts live in src/config/meme-templates.ts as plain data. This file is the
 * engine that draws them: backdrops, text fitting, the character, the mark.
 */
import {
  MEME_TEMPLATES,
  MAX_TEXT_LENGTH,
  DEFAULT_TEMPLATE_ID,
  POSES,
  type BackdropId,
  type CharacterSlot,
  type MemeTemplate,
  type PoseId,
  type TextSlot,
} from '../config/meme-templates.ts';

const POSE_SRC = (pose: PoseId) => `/machine/poses/${pose}.webp`;

/** Brand tokens, repeated here because a canvas cannot read a CSS variable. */
const COLOR = {
  void: '#080B07',
  surface: '#10160A',
  line: '#223012',
  lime: '#8FCE02',
  limeDeep: '#305B05',
  ink: '#E9F0DD',
  paper: '#F1F4E8',
  muted: '#9AA889',
  red: '#C4463A',
} as const;

/**
 * A small deterministic generator.
 *
 * The starfield and the chart backdrop are decorative, but they must not move
 * while somebody is typing — redrawing with fresh randomness on every keystroke
 * makes the preview flicker and feel broken. Seeding by template id means the
 * same template always paints the same backdrop.
 */
function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Backdrops
// ---------------------------------------------------------------------------

function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  id: BackdropId,
  w: number,
  h: number,
  seed: string,
): void {
  ctx.fillStyle = COLOR.void;
  ctx.fillRect(0, 0, w, h);

  if (id === 'void') return;

  if (id === 'glow') {
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.72);
    glow.addColorStop(0, 'rgba(143,206,2,0.30)');
    glow.addColorStop(0.45, 'rgba(48,91,5,0.20)');
    glow.addColorStop(1, 'rgba(8,11,7,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (id === 'grid') {
    ctx.strokeStyle = 'rgba(34,48,18,0.9)';
    ctx.lineWidth = Math.max(1, w * 0.0015);
    const step = w / 14;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    const fade = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
    fade.addColorStop(0, 'rgba(143,206,2,0.14)');
    fade.addColorStop(1, 'rgba(8,11,7,0.75)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (id === 'spotlight') {
    const cone = ctx.createRadialGradient(w * 0.5, h * 0.38, w * 0.04, w * 0.5, h * 0.55, w * 0.62);
    cone.addColorStop(0, 'rgba(196,220,67,0.42)');
    cone.addColorStop(0.5, 'rgba(48,91,5,0.16)');
    cone.addColorStop(1, 'rgba(8,11,7,0)');
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, w, h);
    // A pool of light on the floor, so the figure is standing on something.
    const floor = ctx.createRadialGradient(w * 0.5, h * 0.865, 0, w * 0.5, h * 0.865, w * 0.32);
    floor.addColorStop(0, 'rgba(143,206,2,0.20)');
    floor.addColorStop(1, 'rgba(143,206,2,0)');
    ctx.save();
    ctx.translate(w * 0.5, h * 0.865);
    ctx.scale(1, 0.16);
    ctx.translate(-w * 0.5, -h * 0.865);
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (id === 'stars') {
    const random = seeded(seedOf(seed));
    for (let i = 0; i < 280; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const r = random() * w * 0.0022 + w * 0.0006;
      ctx.globalAlpha = 0.25 + random() * 0.6;
      ctx.fillStyle = random() > 0.82 ? COLOR.lime : COLOR.ink;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const dawn = ctx.createLinearGradient(0, h, 0, 0);
    dawn.addColorStop(0, 'rgba(143,206,2,0.22)');
    dawn.addColorStop(0.5, 'rgba(8,11,7,0)');
    ctx.fillStyle = dawn;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (id === 'chart') {
    const random = seeded(seedOf(seed));
    const count = 26;
    const slot = w / (count + 2);
    const body = slot * 0.56;
    let price = h * 0.62;
    ctx.lineWidth = Math.max(1, w * 0.0022);
    for (let i = 0; i < count; i += 1) {
      // A gentle upward drift so the chart reads as a chart, not as noise.
      const move = (random() - 0.44) * h * 0.095;
      const open = price;
      const close = Math.min(h * 0.9, Math.max(h * 0.1, price + move));
      const high = Math.min(open, close) - random() * h * 0.03;
      const low = Math.max(open, close) + random() * h * 0.03;
      const x = slot * (i + 1.5);
      const up = close < open;
      ctx.strokeStyle = up ? 'rgba(143,206,2,0.95)' : 'rgba(196,70,58,0.85)';
      ctx.fillStyle = up ? 'rgba(143,206,2,0.6)' : 'rgba(196,70,58,0.5)';
      ctx.beginPath();
      ctx.moveTo(x, high);
      ctx.lineTo(x, low);
      ctx.stroke();
      ctx.fillRect(x - body / 2, Math.min(open, close), body, Math.abs(close - open) || 2);
      price = close;
    }
    // Just enough to keep the type readable — any darker and the chart vanishes.
    const veil = ctx.createLinearGradient(0, 0, 0, h);
    veil.addColorStop(0, 'rgba(8,11,7,0.55)');
    veil.addColorStop(0.4, 'rgba(8,11,7,0.12)');
    veil.addColorStop(1, 'rgba(8,11,7,0.05)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h);
  }
}

/** The divider for two-panel templates. */
function paintPanels(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // The top panel is the option being rejected, the bottom the one being kept —
  // tinting them apart is what makes the format legible at a glance.
  const top = ctx.createLinearGradient(0, 0, w, h / 2);
  top.addColorStop(0, '#1A1410');
  top.addColorStop(1, '#241812');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h / 2);

  const bottom = ctx.createLinearGradient(0, h / 2, w, h);
  bottom.addColorStop(0, '#0E1608');
  bottom.addColorStop(1, '#16220B');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h / 2, w, h / 2);
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

const FONT_STACK = "'Archivo', 'Helvetica Neue', Arial, sans-serif";
const MONO_STACK = "'JetBrains Mono', ui-monospace, Menlo, monospace";

/**
 * The face for each style.
 *
 * Only the weights the site already loads are used — Archivo 400/600/900-italic
 * and JetBrains Mono 400/700. Asking the canvas for a weight the page has not
 * loaded does not fail; it silently substitutes a system font and the meme comes
 * out looking like a stock template, which is worse than an error.
 */
function fontFor(style: TextSlot['style'], size: number): string {
  if (style === 'mono') return `700 ${size}px ${MONO_STACK}`;
  if (style === 'caption') return `600 ${size}px ${FONT_STACK}`;
  return `italic 900 ${size}px ${FONT_STACK}`;
}

function transformFor(style: TextSlot['style'], text: string): string {
  return style === 'caption' ? text : text.toUpperCase();
}

/** Greedy word wrap. Words longer than the line are split by character. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
        continue;
      }
      // One unbreakable word wider than the box — split it so it never bleeds.
      let chunk = '';
      for (const character of word) {
        if (ctx.measureText(chunk + character).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines.filter((line, index) => line !== '' || index === 0);
}

const LINE_HEIGHT: Record<TextSlot['style'], number> = {
  impact: 1.03,
  display: 1.0,
  caption: 1.22,
  mono: 1.3,
};

/**
 * Largest size at which the text still fits the box, found by binary search.
 *
 * Both dimensions matter: wrapping handles the width, and the wrapped line count
 * multiplied by the line height has to fit the height. Searching beats stepping
 * down one pixel at a time — twenty iterations settle any size to the pixel.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextSlot['style'],
  boxWidth: number,
  boxHeight: number,
  maxSize: number,
): { size: number; lines: string[] } {
  let low = 8;
  let high = maxSize;
  let best = { size: low, lines: [text] };

  for (let i = 0; i < 20 && high - low > 0.5; i += 1) {
    const size = (low + high) / 2;
    ctx.font = fontFor(style, size);
    const lines = wrapLines(ctx, text, boxWidth);
    const height = lines.length * size * LINE_HEIGHT[style];
    if (height <= boxHeight) {
      best = { size, lines };
      low = size;
    } else {
      high = size;
    }
  }
  ctx.font = fontFor(style, best.size);
  return best;
}

function drawTextSlot(
  ctx: CanvasRenderingContext2D,
  slot: TextSlot,
  raw: string,
  w: number,
  h: number,
): void {
  const text = transformFor(slot.style, raw.trim());
  if (!text) return;

  const box = { x: slot.x * w, y: slot.y * h, w: slot.w * w, h: slot.h * h };
  const { size, lines } = fitText(ctx, text, slot.style, box.w, box.h, slot.maxSize * h);
  const lineHeight = size * LINE_HEIGHT[slot.style];
  const blockHeight = lines.length * lineHeight;

  // A caption sits on its own light bar, edge to edge, like a quote-post.
  if (slot.style === 'caption') {
    const pad = h * 0.035;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, Math.max(0, box.y - pad), w, blockHeight + pad * 2);
  }

  let y = box.y;
  if (slot.valign === 'middle') y = box.y + (box.h - blockHeight) / 2;
  if (slot.valign === 'bottom') y = box.y + box.h - blockHeight;

  const x =
    slot.align === 'center' ? box.x + box.w / 2 : slot.align === 'right' ? box.x + box.w : box.x;

  ctx.textAlign = slot.align;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  for (const [index, line] of lines.entries()) {
    const lineY = y + index * lineHeight;
    if (slot.style === 'impact') {
      // Outline first, fill over it — the classic look, and it stays legible on
      // any backdrop. The width scales with the type so it never looks pasted on.
      ctx.lineWidth = size * 0.17;
      ctx.strokeStyle = COLOR.void;
      ctx.strokeText(line, x, lineY);
      ctx.fillStyle = COLOR.ink;
      ctx.fillText(line, x, lineY);
    } else if (slot.style === 'display') {
      ctx.shadowColor = 'rgba(8,11,7,0.85)';
      ctx.shadowBlur = size * 0.22;
      ctx.fillStyle = COLOR.lime;
      ctx.fillText(line, x, lineY);
      ctx.shadowBlur = 0;
    } else if (slot.style === 'caption') {
      ctx.fillStyle = '#12170C';
      ctx.fillText(line, x, lineY);
    } else {
      ctx.fillStyle = COLOR.muted;
      ctx.fillText(line, x, lineY);
    }
  }
}

// ---------------------------------------------------------------------------
// Character and mark
// ---------------------------------------------------------------------------

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: CharacterSlot,
  w: number,
  h: number,
): void {
  const height = slot.height * h;
  const width = (image.width / image.height) * height;
  const x = slot.x * w - width / 2;
  const y = slot.y * h - height / 2;

  ctx.save();
  ctx.globalAlpha = slot.opacity ?? 1;
  if (slot.flip) {
    ctx.translate(x + width / 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, y, width, height);
  } else {
    ctx.drawImage(image, x, y, width, height);
  }
  ctx.restore();
}

/** The mark every meme carries out into the world. */
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const size = h * 0.026;
  const x = w - h * 0.03;
  const y = h - h * 0.028;
  ctx.font = `700 ${size}px ${MONO_STACK}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  // A soft dark backing so the mark survives a light or busy backdrop.
  ctx.shadowColor = 'rgba(8,11,7,0.9)';
  ctx.shadowBlur = size * 0.9;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLOR.lime;
  ctx.fillText('WHATIFONHOOD.COM', x, y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// State and rendering
// ---------------------------------------------------------------------------

interface State {
  template: MemeTemplate;
  pose: PoseId;
  backdrop: BackdropId;
  text: Map<string, string>;
}

function templateById(id: string): MemeTemplate {
  return MEME_TEMPLATES.find((t) => t.id === id) ?? MEME_TEMPLATES[0]!;
}

async function render(canvas: HTMLCanvasElement, state: State): Promise<void> {
  const { template } = state;
  const w = template.width;
  const h = template.height;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  if (template.splitPanels) {
    paintPanels(ctx, w, h);
  } else {
    paintBackdrop(ctx, state.backdrop, w, h, template.id);
  }

  // Poses are same-origin, so the canvas stays untainted and can export a PNG.
  const slots = template.characters;
  const images = await Promise.all(
    slots.map((slot) => loadImage(POSE_SRC(slot.pose ?? state.pose)).catch(() => null)),
  );
  for (const [index, slot] of slots.entries()) {
    const image = images[index];
    if (image) drawCharacter(ctx, image, slot, w, h);
  }

  for (const slot of template.text) {
    drawTextSlot(ctx, slot, state.text.get(slot.id) ?? '', w, h);
  }

  drawWatermark(ctx, w, h);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Makes sure the faces are ready before the first paint.
 *
 * Without this the first render can use a fallback font and only snap to the
 * real one when something else triggers a redraw.
 */
async function readyFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.all([
    document.fonts.load(`italic 900 100px ${FONT_STACK}`),
    document.fonts.load(`600 100px ${FONT_STACK}`),
    document.fonts.load(`700 40px ${MONO_STACK}`),
  ]).catch(() => undefined);
  await document.fonts.ready;
}

export function initMemeMaker(locale: string): void {
  const root = document.querySelector<HTMLElement>('[data-maker]');
  if (!root) return;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-maker-canvas]');
  const fieldsHost = root.querySelector<HTMLElement>('[data-maker-fields]');
  const poseGroup = root.querySelector<HTMLElement>('[data-maker-poses]');
  const backdropGroup = root.querySelector<HTMLElement>('[data-maker-backdrops]');
  const downloadButton = root.querySelector<HTMLButtonElement>('[data-maker-download]');
  const shareButton = root.querySelector<HTMLButtonElement>('[data-maker-share]');
  const shuffleButton = root.querySelector<HTMLButtonElement>('[data-maker-shuffle]');
  const status = root.querySelector<HTMLElement>('[data-maker-status]');
  if (!canvas || !fieldsHost) return;

  const labels = {
    fields: JSON.parse(root.dataset.fieldLabels ?? '{}') as Record<string, string>,
    shareText: root.dataset.shareText ?? '',
    saved: root.dataset.labelSaved ?? '',
    failed: root.dataset.labelFailed ?? '',
  };

  const state: State = {
    template: templateById(root.dataset.template ?? DEFAULT_TEMPLATE_ID),
    pose: 'arms-crossed',
    backdrop: templateById(root.dataset.template ?? DEFAULT_TEMPLATE_ID).backdrop,
    text: new Map(),
  };

  // One render per frame however fast somebody types.
  let queued = false;
  const draw = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      void render(canvas, state);
    });
  };

  const say = (message: string) => {
    if (status) status.textContent = message;
  };

  /** Rebuilds the inputs when the template changes; keeps text people typed. */
  const buildFields = () => {
    fieldsHost.textContent = '';
    for (const slot of state.template.text) {
      const wrap = document.createElement('label');
      wrap.className = 'maker-field';

      const name = document.createElement('span');
      name.className = 'maker-field-label';
      name.textContent = labels.fields[slot.field] ?? slot.field;

      const input = document.createElement('textarea');
      input.className = 'maker-input';
      input.rows = 2;
      input.maxLength = MAX_TEXT_LENGTH;
      input.value = state.text.get(slot.id) ?? '';
      input.setAttribute('enterkeyhint', 'done');
      input.addEventListener('input', () => {
        state.text.set(slot.id, input.value.slice(0, MAX_TEXT_LENGTH));
        draw();
      });

      wrap.append(name, input);
      fieldsHost.append(wrap);
    }
  };

  /** The pose control only makes sense when the template lets you choose one. */
  const syncControls = () => {
    const posesFixed = state.template.characters.every((slot) => slot.pose !== undefined);
    if (poseGroup) poseGroup.hidden = posesFixed;
    if (backdropGroup) backdropGroup.hidden = Boolean(state.template.lockBackdrop);

    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-template]')) {
      button.setAttribute('aria-pressed', String(button.dataset.template === state.template.id));
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-pose]')) {
      button.setAttribute('aria-pressed', String(button.dataset.pose === state.pose));
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-backdrop]')) {
      button.setAttribute('aria-pressed', String(button.dataset.backdrop === state.backdrop));
    }
  };

  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-template],[data-pose],[data-backdrop]',
    );
    if (!target) return;

    if (target.dataset.template) {
      state.template = templateById(target.dataset.template);
      // Always adopt the new format's backdrop. A locked template has no other
      // way to reach its own ground, and carrying a previous choice across a
      // format change is not what anyone expects.
      state.backdrop = state.template.backdrop;
      buildFields();
    } else if (target.dataset.pose) {
      state.pose = target.dataset.pose as PoseId;
    } else if (target.dataset.backdrop) {
      state.backdrop = target.dataset.backdrop as BackdropId;
    }
    syncControls();
    draw();
  });

  const fileName = () => `what-if-${state.template.id}.png`;

  const save = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName();
    link.click();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  downloadButton?.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    if (!blob) return say(labels.failed);
    save(blob);
    say(labels.saved);
  });

  /**
   * On a phone this hands the actual image to the share sheet, so the picture
   * reaches X in one step. Everywhere else it saves the file and opens the
   * compose window, because a browser cannot attach an image to a post for you.
   */
  shareButton?.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    if (!blob) return say(labels.failed);
    const file = new File([blob], fileName(), { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: labels.shareText });
        return;
      } catch {
        // Cancelled or unavailable — fall through to the manual route.
      }
    }
    save(blob);
    const intent = new URL('https://x.com/intent/post');
    intent.searchParams.set('text', labels.shareText);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
    say(labels.saved);
  });

  shuffleButton?.addEventListener('click', () => {
    const templates = MEME_TEMPLATES;
    state.template = templates[Math.floor(Math.random() * templates.length)]!;
    state.pose = POSES[Math.floor(Math.random() * POSES.length)]!;
    state.backdrop = state.template.backdrop;
    buildFields();
    syncControls();
    draw();
  });

  buildFields();
  syncControls();
  void readyFonts().then(draw);
  // Locale is accepted for parity with the other tools; the canvas carries no
  // translated strings of its own beyond what the visitor types.
  void locale;
}
