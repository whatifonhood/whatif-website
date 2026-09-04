import type { APIRoute } from 'astro';
import { SITE } from '../config/site.ts';
import { ROADMAP } from '../config/roadmap.ts';

/**
 * The updates feed.
 *
 * Hand-written XML rather than a feed package: it is twenty lines, and a
 * dependency for twenty lines is a dependency to keep updated forever.
 */
const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  // Only shipped work goes in the feed; plans are not news.
  const items = ROADMAP.filter((item) => item.date)
    .map((update) => {
      const link = update.href ? new URL(update.href, SITE.url).href : `${SITE.url}/roadmap/`;
      return `    <item>
      <title>${escape(update.title)}</title>
      <link>${escape(link)}</link>
      <guid isPermaLink="false">${escape(`${update.date as string}-${update.title}`)}</guid>
      <pubDate>${new Date(`${update.date as string}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(update.body)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" /><title>${escape(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${escape(SITE.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
