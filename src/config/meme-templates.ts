/**
 * The layouts behind the meme generator.
 *
 * A template is pure data: a canvas size, a backdrop, where IF Man stands, and
 * where the words go. Adding one is adding an object to `MEME_TEMPLATES` and a
 * label to `pages.memeMaker.templates` in each file under src/content/ —
 * TypeScript will not let you forget the second step.
 *
 * All positions are fractions of the canvas (0–1), never pixels, so a template
 * renders identically whatever size we export at. `x` and `y` on a character
 * are the centre of its feet-to-head box; `height` is how tall it stands as a
 * fraction of the canvas.
 *
 * The words themselves are never stored here. They are typed by the visitor,
 * drawn straight to a canvas on their own device, and never sent anywhere.
 */

/** The four transparent poses in public/machine/poses/. */
export const POSES = ['arms-crossed', 'facepalm', 'thinking', 'victory'] as const;
export type PoseId = (typeof POSES)[number];

/** Backdrops are painted in code — see `paintBackdrop` in src/scripts/meme-maker.ts. */
export const BACKDROPS = ['glow', 'void', 'grid', 'spotlight', 'stars', 'chart'] as const;
export type BackdropId = (typeof BACKDROPS)[number];

/**
 * How a block of text is set.
 *  - `impact`  heavy italic caps, white with a dark outline. The classic.
 *  - `display` heavy italic caps in brand lime, no outline. Cleaner.
 *  - `caption` plain sentence case on a light bar, like a quote-tweet.
 *  - `mono`    small uppercase monospace, for the mantra and tags.
 */
export type TextStyle = 'impact' | 'display' | 'caption' | 'mono';

/** Which localised label an input gets. Keeps copy generic across templates. */
export type FieldId = 'top' | 'bottom' | 'line' | 'first' | 'second';

export interface TextSlot {
  id: string;
  /** Box the text is fitted into, as fractions of the canvas. */
  x: number;
  y: number;
  w: number;
  h: number;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  style: TextStyle;
  /** Largest permitted size, as a fraction of canvas height. */
  maxSize: number;
  field: FieldId;
}

export interface CharacterSlot {
  /** Horizontal centre and vertical centre, as fractions of the canvas. */
  x: number;
  y: number;
  /** Height as a fraction of the canvas. */
  height: number;
  flip?: boolean;
  /** Fixed for this slot. Omit to let the visitor pick the pose. */
  pose?: PoseId;
  /** 0–1. Used to push a figure behind the type. */
  opacity?: number;
}

export interface MemeTemplate {
  id: string;
  width: number;
  height: number;
  backdrop: BackdropId;
  characters: CharacterSlot[];
  text: TextSlot[];
  /** Templates that paint their own ground do not offer a backdrop choice. */
  lockBackdrop?: boolean;
  /** Drawn across the middle, splitting the canvas into two panels. */
  splitPanels?: boolean;
}

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    // The universal format: words above, words below, character in the middle.
    id: 'classic',
    width: 1200,
    height: 1200,
    backdrop: 'glow',
    characters: [{ x: 0.5, y: 0.53, height: 0.62 }],
    text: [
      {
        id: 'top',
        x: 0.06,
        y: 0.04,
        w: 0.88,
        h: 0.18,
        align: 'center',
        valign: 'top',
        style: 'impact',
        maxSize: 0.095,
        field: 'top',
      },
      {
        id: 'bottom',
        x: 0.06,
        y: 0.78,
        w: 0.88,
        h: 0.18,
        align: 'center',
        valign: 'bottom',
        style: 'impact',
        maxSize: 0.095,
        field: 'bottom',
      },
    ],
  },
  {
    // Your take on a light bar, the picture underneath. How people quote-post.
    id: 'caption',
    width: 1200,
    height: 1200,
    backdrop: 'void',
    characters: [{ x: 0.5, y: 0.6, height: 0.66 }],
    text: [
      {
        id: 'line',
        x: 0.07,
        y: 0.045,
        w: 0.86,
        h: 0.19,
        align: 'left',
        valign: 'middle',
        style: 'caption',
        maxSize: 0.072,
        field: 'line',
      },
    ],
  },
  {
    // Two stacked panels. The sold-versus-held format.
    id: 'this-or-that',
    width: 1000,
    height: 1250,
    backdrop: 'void',
    splitPanels: true,
    lockBackdrop: true,
    characters: [
      { x: 0.73, y: 0.25, height: 0.44, pose: 'facepalm' },
      { x: 0.73, y: 0.75, height: 0.44, pose: 'victory' },
    ],
    text: [
      {
        id: 'first',
        x: 0.06,
        y: 0.08,
        w: 0.46,
        h: 0.32,
        align: 'left',
        valign: 'middle',
        style: 'impact',
        maxSize: 0.07,
        field: 'first',
      },
      {
        id: 'second',
        x: 0.06,
        y: 0.58,
        w: 0.46,
        h: 0.32,
        align: 'left',
        valign: 'middle',
        style: 'impact',
        maxSize: 0.07,
        field: 'second',
      },
    ],
  },
  {
    // All type. The one that reads on a timeline at thumbnail size.
    id: 'statement',
    width: 1200,
    height: 1200,
    backdrop: 'void',
    characters: [{ x: 0.79, y: 0.72, height: 0.4, opacity: 0.95 }],
    text: [
      {
        id: 'line',
        x: 0.08,
        y: 0.12,
        w: 0.84,
        h: 0.44,
        align: 'left',
        valign: 'middle',
        style: 'display',
        maxSize: 0.135,
        field: 'line',
      },
    ],
  },
  {
    // The house format: the question, the figure behind it, the mantra beneath.
    id: 'question',
    width: 1200,
    height: 1200,
    backdrop: 'glow',
    characters: [{ x: 0.5, y: 0.54, height: 0.95, opacity: 0.3 }],
    text: [
      {
        id: 'line',
        x: 0.09,
        y: 0.26,
        w: 0.82,
        h: 0.42,
        align: 'center',
        valign: 'middle',
        style: 'display',
        maxSize: 0.13,
        field: 'line',
      },
    ],
  },
  {
    // One line, one figure, a hard light. Good for a punchline.
    id: 'spotlight',
    width: 1200,
    height: 1200,
    backdrop: 'spotlight',
    characters: [{ x: 0.5, y: 0.48, height: 0.76 }],
    text: [
      {
        id: 'line',
        x: 0.07,
        y: 0.79,
        w: 0.86,
        h: 0.16,
        align: 'center',
        valign: 'bottom',
        style: 'impact',
        maxSize: 0.088,
        field: 'line',
      },
    ],
  },
  {
    // Market days. The chart does the talking, the figure reacts to it.
    id: 'chart',
    width: 1200,
    height: 1200,
    backdrop: 'chart',
    lockBackdrop: true,
    characters: [{ x: 0.74, y: 0.6, height: 0.68 }],
    text: [
      {
        id: 'line',
        x: 0.07,
        y: 0.07,
        w: 0.6,
        h: 0.26,
        align: 'left',
        valign: 'top',
        style: 'display',
        maxSize: 0.085,
        field: 'line',
      },
    ],
  },
  {
    // gm. The one that gets posted every single morning.
    id: 'gm',
    width: 1200,
    height: 1200,
    backdrop: 'stars',
    characters: [{ x: 0.5, y: 0.57, height: 0.7, pose: 'victory' }],
    text: [
      {
        id: 'top',
        x: 0.07,
        y: 0.06,
        w: 0.86,
        h: 0.13,
        align: 'center',
        valign: 'top',
        style: 'display',
        maxSize: 0.085,
        field: 'top',
      },
      {
        id: 'bottom',
        x: 0.07,
        y: 0.79,
        w: 0.86,
        h: 0.15,
        align: 'center',
        valign: 'bottom',
        style: 'impact',
        maxSize: 0.082,
        field: 'bottom',
      },
    ],
  },
];

/** The longest a single line of text may be. Keeps the canvas predictable. */
export const MAX_TEXT_LENGTH = 120;

export const DEFAULT_TEMPLATE_ID = 'classic';
