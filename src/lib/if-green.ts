/**
 * Turning a photograph into an IF man.
 *
 * Everything here runs on the visitor's own device, on a canvas, with no model
 * and no network. That is the point: the Forge has to be free to run and safe
 * to offer, and a face is the most personal thing anybody will ever hand this
 * site. A photo that never leaves the phone cannot leak from a bucket we forgot
 * to lock.
 *
 * The look is not "a green filter". It is the four steps the character sheet
 * actually describes, in the order an engraver would do them:
 *
 *   1. POSTERISE  — collapse continuous tone onto the five locked brand greens,
 *                   which is what makes the result read as flat comic art
 *                   rather than as a tinted photograph.
 *   2. CONTOUR    — a Sobel pass laid down in near-black, for the thick
 *                   silhouette line every official rendering has.
 *   3. HATCH      — horizontal lines whose weight follows darkness. The canon
 *                   calls for "dense horizontal contour lines" wrapping the
 *                   skull and neck; driving line thickness from luminance
 *                   gets that for free, and it lands on the head hardest
 *                   because a lit face is darkest around the jaw and temples.
 *   4. VOID       — everything past the frame's circle fades out, so the figure
 *                   emerges from black space instead of from someone's kitchen.
 *
 * What this deliberately does NOT do is make anyone bald. Removing hair needs a
 * generative model; see src/config/forge.ts for the paid path that does. Here
 * the hair becomes an etched dark mass, which keeps the person recognisable —
 * and a portrait nobody recognises is not worth sharing.
 *
 * Palette source: what-if-meme/IF-MAN-CHARACTER-RESEARCH.md, sampled range.
 */

/** The five tones a pixel is allowed to be, darkest first. */
const RAMP: readonly [number, number, number][] = [
  [13, 23, 7], // near-void, the shadow side
  [48, 91, 5], // #305B05
  [134, 181, 11], // #86B50B
  [143, 206, 2], // #8FCE02
  [196, 220, 67], // #C4DC43
];

/** The contour and hatch ink. Matches --color-void. */
const INK: readonly [number, number, number] = [8, 11, 7];

/** How framing is expressed: a zoom, and a pan in fractions of the frame. */
export interface Framing {
  /** 1 fills the frame with the photo's short side. Above 1 crops in. */
  zoom: number;
  /** -1…1, left to right. */
  x: number;
  /** -1…1, top to bottom. */
  y: number;
}

export const DEFAULT_FRAMING: Framing = { zoom: 1.15, x: 0, y: -0.08 };

/** A photo, already decoded, plus the framing the visitor chose for it. */
export interface Portrait {
  image: CanvasImageSource;
  width: number;
  height: number;
  framing: Framing;
}

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  return canvas.getContext('2d', { willReadFrequently: true });
}

/**
 * Draws the photo into a square, cropped to fill, honouring the framing.
 *
 * "Cover" rather than "contain" because a letterboxed portrait inside a round
 * PFP is not a portrait, it is a mistake.
 */
function drawFramed(context: CanvasRenderingContext2D, portrait: Portrait, size: number): void {
  const { image, width, height, framing } = portrait;
  const scale = (size / Math.min(width, height)) * Math.max(0.5, framing.zoom);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  // Pan is expressed against the overhang, so the slider cannot push the photo
  // off the frame no matter how far it is dragged.
  const slackX = Math.max(0, drawWidth - size);
  const slackY = Math.max(0, drawHeight - size);
  const x = (size - drawWidth) / 2 + (clamp(framing.x, -1, 1) * slackX) / 2;
  const y = (size - drawHeight) / 2 + (clamp(framing.y, -1, 1) * slackY) / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

/**
 * A three-pass box blur over the luminance field.
 *
 * Posterising raw camera luminance bands the sensor noise as well as the face,
 * which comes out as green confetti across the cheeks. Softening the field
 * first — and only the field, never the output — is what keeps the flats flat.
 */
function blur(field: Float32Array, size: number, radius: number): Float32Array {
  let source = field;
  let target = new Float32Array(field.length);
  for (let pass = 0; pass < 2; pass += 1) {
    // Horizontal.
    for (let y = 0; y < size; y += 1) {
      const row = y * size;
      for (let x = 0; x < size; x += 1) {
        let total = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const sx = x + k;
          if (sx < 0 || sx >= size) continue;
          total += source[row + sx]!;
          count += 1;
        }
        target[row + x] = total / count;
      }
    }
    [source, target] = [target, source];
    // Vertical.
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let total = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const sy = y + k;
          if (sy < 0 || sy >= size) continue;
          total += source[sy * size + x]!;
          count += 1;
        }
        target[y * size + x] = total / count;
      }
    }
    [source, target] = [target, source];
  }
  return source;
}

/**
 * Stretches the middle of the histogram out to the full range.
 *
 * A selfie taken indoors at night — which is most of them — occupies about a
 * third of the available tones, and posterising that lands every pixel in two
 * of the five bands. Clipping the tails at the 2nd and 98th percentiles gives
 * the ramp something to work with, and does it from the photo's own numbers
 * rather than from a constant that only suits the picture it was tuned on.
 */
function normalise(field: Float32Array): void {
  const buckets = new Uint32Array(256);
  for (let i = 0; i < field.length; i += 1) {
    buckets[clamp(Math.round(field[i]! * 255), 0, 255)] += 1;
  }
  const floor = field.length * 0.02;
  const ceiling = field.length * 0.98;
  let low = 0;
  let high = 255;
  let seen = 0;
  for (let i = 0; i < 256; i += 1) {
    seen += buckets[i]!;
    if (seen >= floor) {
      low = i;
      break;
    }
  }
  seen = 0;
  for (let i = 0; i < 256; i += 1) {
    seen += buckets[i]!;
    if (seen >= ceiling) {
      high = i;
      break;
    }
  }
  const span = Math.max(1, high - low) / 255;
  const base = low / 255;
  for (let i = 0; i < field.length; i += 1) {
    field[i] = clamp((field[i]! - base) / span, 0, 1);
  }
}

export interface EtchOptions {
  /** Side of the square canvas returned. */
  size: number;
  /** Distance from centre at which the figure has fully faded, 0…1 of radius. */
  fade?: number;
  /** Spacing of the engraving lines in pixels at 1024px, scaled with size. */
  hatch?: number;
}

/**
 * The etching itself: a square canvas holding the figure and nothing else.
 *
 * Transparent outside the fade, so the compositions below can put it on any
 * ground without a seam.
 */
export function etch(portrait: Portrait, options: EtchOptions): HTMLCanvasElement {
  const { size } = options;
  const fade = options.fade ?? 0.94;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = context2d(canvas);
  if (!context) return canvas;

  drawFramed(context, portrait, size);

  const frame = context.getImageData(0, 0, size, size);
  const pixels = frame.data;
  const count = size * size;

  // Rec. 709 luminance. Green-weighted, which is what a human eye does, and
  // matters here because the output is entirely green — a naive average makes
  // every face look flat.
  const luma = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const p = i * 4;
    luma[i] = (0.2126 * pixels[p]! + 0.7152 * pixels[p + 1]! + 0.0722 * pixels[p + 2]!) / 255;
  }
  normalise(luma);
  const smooth = blur(luma, size, Math.max(1, Math.round(size / 512)));

  // Sobel, on the smoothed field so the contour follows form and not grain.
  const edges = new Float32Array(count);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const i = y * size + x;
      const tl = smooth[i - size - 1]!;
      const tc = smooth[i - size]!;
      const tr = smooth[i - size + 1]!;
      const ml = smooth[i - 1]!;
      const mr = smooth[i + 1]!;
      const bl = smooth[i + size - 1]!;
      const bc = smooth[i + size]!;
      const br = smooth[i + size + 1]!;
      const gx = tl + 2 * ml + bl - (tr + 2 * mr + br);
      const gy = tl + 2 * tc + tr - (bl + 2 * bc + br);
      edges[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  const period = Math.max(3, Math.round(((options.hatch ?? 4) * size) / 1024));
  const centre = (size - 1) / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y += 1) {
    // Hatching is horizontal, so the whole row shares one phase. Computing it
    // per row rather than per pixel is the difference between this loop
    // finishing in a blink and the page hanging on a mid-range phone.
    const phase = y % period;
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const p = i * 4;

      const dx = (x - centre) / radius;
      const dy = (y - centre) / radius;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= fade) {
        pixels[p + 3] = 0;
        continue;
      }

      // Toward the rim the figure sinks into the void rather than being cut
      // out of it — the aura in the source artwork is light bleeding off a
      // body, not a sticker edge.
      const sink = clamp((distance - fade * 0.62) / (fade * 0.38), 0, 1);
      const level = clamp(smooth[i]! * (1 - sink * 0.85), 0, 1);

      const band = clamp(Math.floor(level * RAMP.length), 0, RAMP.length - 1);
      let [r, g, b] = RAMP[band]!;

      // Engraving: a line is laid down where the row's phase falls inside the
      // darkness of the pixel, so black areas are solid and lit areas are bare.
      const weight = (1 - level) * period;
      if (phase < weight - 0.35) {
        const strength = clamp(weight - phase, 0, 1) * 0.7;
        r += (INK[0] - r) * strength;
        g += (INK[1] - g) * strength;
        b += (INK[2] - b) * strength;
      }

      // Contour last, so nothing is drawn over the silhouette.
      const edge = clamp((edges[i]! - 0.55) / 0.75, 0, 1);
      if (edge > 0) {
        r += (INK[0] - r) * edge;
        g += (INK[1] - g) * edge;
        b += (INK[2] - b) * edge;
      }

      pixels[p] = r;
      pixels[p + 1] = g;
      pixels[p + 2] = b;
      pixels[p + 3] = Math.round(255 * (1 - sink * sink * 0.55));
    }
  }

  context.putImageData(frame, 0, 0);
  return canvas;
}
