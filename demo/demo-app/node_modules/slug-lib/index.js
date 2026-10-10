/**
 * safe-slug v1.0.0 & v1.0.1
 * Completely benign package. Converts strings to URL-safe slugs.
 */

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
