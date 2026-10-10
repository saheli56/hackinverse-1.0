/**
 * Content API Service
 */
import { slugify } from 'slug-lib';

export function createPost(title, body) {
  const slug = slugify(title);
  return {
    id: 'post-101',
    title,
    slug,
    url: `/blog/${slug}`,
    body
  };
}
