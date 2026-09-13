<script>
	/**
	 * Links in body copy. Royal, underlined — a link in a 25k-character guide
	 * has to be findable while scanning, and colour alone is not enough.
	 *
	 * Only external links open in a new tab. The old renderer sent EVERY link
	 * to `target="_blank"`, including internal ones, so following a cross-link
	 * between two guides stranded the reader in a pile of tabs.
	 */
	export let href = '';
	export let title = undefined;

	$: external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?pictify\.io/i.test(href);
</script>

<a
	{href}
	{title}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	class="font-medium text-brand-royal underline decoration-brand-royal/35 underline-offset-[3px] transition-colors hover:decoration-brand-royal"
>
	<slot />
</a>
