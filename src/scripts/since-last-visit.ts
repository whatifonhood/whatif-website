/**
 * What changed since this person last looked.
 *
 * A price is a number; a price next to the number you last saw is a story. This
 * remembers the figures at the end of each visit and, on the next one, says
 * what moved.
 *
 * Everything is kept in this browser's own `localStorage`. Nothing is sent
 * anywhere, there is no identifier, and the site works identically for somebody
 * who has storage turned off — the panel simply never appears.
 */
import { formatUsd } from '../lib/format.ts';

const KEY = 'if:last-visit';

/** Below this, "since you were last here" is just "since a moment ago". */
const MIN_GAP_MS = 60 * 60 * 1000;

/** Stop trusting a stored figure after a month; the gap stops being meaningful. */
const MAX_GAP_MS = 45 * 24 * 60 * 60 * 1000;

interface Visit {
  at: number;
  price?: number;
  burned?: number;
  holders?: number;
}

function read(): Visit | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Anything could be in storage — another tab, an older version of this
    // script, a person editing it by hand. Check every field before using it.
    if (typeof parsed !== 'object' || parsed === null) return null;
    const visit = parsed as Record<string, unknown>;
    if (typeof visit.at !== 'number' || !Number.isFinite(visit.at)) return null;

    const num = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

    return {
      at: visit.at,
      price: num(visit.price),
      burned: num(visit.burned),
      holders: num(visit.holders),
    };
  } catch {
    // Private browsing, storage disabled, or malformed JSON.
    return null;
  }
}

function write(visit: Visit): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(visit));
  } catch {
    /* nothing to do; the panel just will not appear next time */
  }
}

/** "3 days ago", in the reader's language. */
function ago(ms: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round(ms / 60_000);
  if (minutes < 90) return format.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 36) return format.format(-hours, 'hour');
  return format.format(-Math.round(hours / 24), 'day');
}

export function initSinceLastVisit(locale: string): void {
  const panel = document.querySelector<HTMLElement>('[data-since]');
  if (!panel) return;

  const labels = {
    lead: panel.dataset.labelLead ?? '',
    price: panel.dataset.labelPrice ?? '',
    burned: panel.dataset.labelBurned ?? '',
    holders: panel.dataset.labelHolders ?? '',
    nothing: panel.dataset.labelNothing ?? '',
  };

  const previous = read();

  /**
   * Called by the dashboard once the live figures land.
   *
   * Reading is separate from writing on purpose: the panel must describe the
   * *previous* visit, so the new figures are only stored after it has rendered.
   */
  const record = (now: Visit) => {
    write({ ...now, at: Date.now() });
  };

  const show = (now: Visit) => {
    if (!previous) return record(now);

    const gap = Date.now() - previous.at;
    if (gap < MIN_GAP_MS || gap > MAX_GAP_MS) return record(now);

    const lines: string[] = [];

    if (previous.price !== undefined && now.price !== undefined) {
      const change = ((now.price - previous.price) / previous.price) * 100;
      // Below a tenth of a percent there is nothing to report.
      if (Math.abs(change) >= 0.1) {
        lines.push(
          labels.price
            .replace(
              '{change}',
              // A decimal place is useful at 2.4% and noise at 1,009,900%.
              `${change >= 0 ? '+' : ''}${
                Math.abs(change) >= 100
                  ? Math.round(change).toLocaleString(locale)
                  : change.toFixed(1)
              }%`,
            )
            .replace('{price}', formatUsd(now.price, locale)),
        );
      }
    }

    if (previous.burned !== undefined && now.burned !== undefined && now.burned > previous.burned) {
      const burned = now.burned - previous.burned;
      lines.push(labels.burned.replace('{amount}', Math.round(burned).toLocaleString(locale)));
    }

    if (previous.holders !== undefined && now.holders !== undefined) {
      const change = now.holders - previous.holders;
      if (change !== 0) {
        lines.push(
          labels.holders
            .replace('{change}', `${change > 0 ? '+' : ''}${change.toLocaleString(locale)}`)
            .replace('{total}', now.holders.toLocaleString(locale)),
        );
      }
    }

    const list = panel.querySelector<HTMLElement>('[data-since-list]');
    const lead = panel.querySelector<HTMLElement>('[data-since-lead]');
    if (lead) lead.textContent = labels.lead.replace('{ago}', ago(gap, locale));

    if (list) {
      list.replaceChildren();
      for (const line of lines.length > 0 ? lines : [labels.nothing]) {
        const item = document.createElement('li');
        // textContent, never innerHTML: these strings are built from figures
        // that came off the network.
        item.textContent = line;
        list.append(item);
      }
    }

    panel.hidden = false;
    record(now);
  };

  // The dashboard hands over its figures once they arrive.
  document.addEventListener('if:stats', (event) => {
    show((event as CustomEvent<Visit>).detail);
  });
}
