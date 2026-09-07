/**
 * Writes a generated config file, formatted the way the repo expects.
 *
 * Every generator here builds its output with `JSON.stringify`, which emits
 * double quotes and trailing-comma-free arrays — neither of which matches the
 * project's Prettier settings. That made `npm run format:check` fail on any
 * file a generator had just written, so the daily refresh job would have
 * committed unformatted files and turned CI red the first time it ran on its
 * own. Doing it here means no generator has to remember.
 */
import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';

export async function writeConfig(path, source) {
  const options = await resolveConfig(path);
  writeFileSync(path, await format(source, { ...options, filepath: path }));
}
