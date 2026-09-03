/**
 * Serialises structured data for a `<script type="application/ld+json">` block.
 *
 * `JSON.stringify` alone is not safe inside a script element. An HTML parser
 * does not know it is looking at JSON: it ends the script at the first
 * `</script`, wherever that appears — including inside a quoted string, where
 * JSON escaping would not have touched it. A value containing
 * `</script><img src=x onerror=...>` therefore closes the block early and what
 * follows is parsed as markup.
 *
 * Nothing on this site puts user input in the schema today; every field comes
 * from src/config/site.ts. This exists so that stays true by construction
 * rather than by everyone remembering, because the day somebody interpolates a
 * page title or a coin name into structured data is the day it would matter.
 *
 * Escaping `<` is still valid JSON — it parses back to the same string — and
 * leaves no `<` for the HTML parser to act on. U+2028 and U+2029 are escaped
 * for a separate reason: they are legal inside a JSON string but are line
 * terminators to a JavaScript parser.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
