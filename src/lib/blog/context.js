/**
 * Context key for the per-article heading state the markdown renderers share.
 *
 * A module-level symbol rather than a string: two components asking for
 * "headings" in different trees would otherwise collide, and svelte-markdown
 * mounts renderers deep inside its own component tree where a stray match is
 * hard to see.
 *
 * The value is `{ nextId(text), nextIndex() }` — see the post page, which
 * builds it from `headingSlugger()` so the rail and the headings share one
 * counter.
 */
export const BLOG_HEADINGS = Symbol('blog-headings');
