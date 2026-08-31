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

  let activeSeries = 'all';
  let query = '';

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
  };

  for (const button of filters) {
    button.addEventListener('click', () => {
      activeSeries = button.dataset.vaultFilter ?? 'all';
      for (const other of filters) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      apply();
    });
  }

  search?.addEventListener('input', () => {
    query = search.value;
    apply();
  });

  apply();
}
