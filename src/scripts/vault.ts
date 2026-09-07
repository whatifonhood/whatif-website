/**
 * Filtering and search for the meme vault.
 *
 * Everything is already in the page — this only shows and hides. The search box
 * is matched against a data attribute the server rendered, never interpolated
 * into markup, so there is nothing here that a typed string could break.
 */
export function initVault(): void {
  const root = document.querySelector<HTMLElement>('[data-vault]');
  if (!root) return;

  const search = root.querySelector<HTMLInputElement>('[data-vault-search]');
  const filters = root.querySelectorAll<HTMLButtonElement>('[data-vault-filter]');
  const cards = root.querySelectorAll<HTMLElement>('[data-vault-item]');
  const empty = root.querySelector<HTMLElement>('[data-vault-empty]');
  const count = root.querySelector<HTMLElement>('[data-vault-count]');

  const reset = root.querySelector<HTMLButtonElement>('[data-vault-reset]');

  /*
   * The filter and the search live in the address bar, so a reload keeps them
   * and "all the Robinhood memes" is a link somebody can send. Only values the
   * page itself offers are accepted from the URL.
   */
  const params = new URLSearchParams(window.location.search);
  const known = new Set([...filters].map((button) => button.dataset.vaultFilter ?? 'all'));
  const wanted = params.get('series') ?? 'all';
  let activeSeries = known.has(wanted) ? wanted : 'all';
  let query = (params.get('q') ?? '').slice(0, 80);
  if (search) search.value = query;

  const remember = () => {
    const url = new URL(window.location.href);
    if (activeSeries === 'all') url.searchParams.delete('series');
    else url.searchParams.set('series', activeSeries);
    if (query.trim() === '') url.searchParams.delete('q');
    else url.searchParams.set('q', query.trim());
    window.history.replaceState(null, '', url);
  };

  const markFilter = () => {
    for (const button of filters) {
      button.setAttribute(
        'aria-pressed',
        String((button.dataset.vaultFilter ?? 'all') === activeSeries),
      );
    }
  };

  const apply = () => {
    let visible = 0;
    const needle = query.trim().toLowerCase();

    for (const card of cards) {
      const series = card.dataset.series ?? '';
      const haystack = (card.dataset.search ?? '').toLowerCase();
      const matchesSeries = activeSeries === 'all' || series === activeSeries;
      const matchesQuery = needle === '' || haystack.includes(needle);
      const show = matchesSeries && matchesQuery;

      card.hidden = !show;
      if (show) visible += 1;
    }

    if (empty) empty.hidden = visible > 0;
    if (count) count.textContent = String(visible);
    remember();
  };

  for (const button of filters) {
    button.addEventListener('click', () => {
      activeSeries = button.dataset.vaultFilter ?? 'all';
      markFilter();
      apply();
    });
  }

  search?.addEventListener('input', () => {
    query = search.value;
    apply();
  });

  reset?.addEventListener('click', () => {
    activeSeries = 'all';
    query = '';
    if (search) search.value = '';
    markFilter();
    apply();
  });

  markFilter();
  apply();
}
