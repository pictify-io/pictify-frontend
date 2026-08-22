<script>
	import Wordmark from './Wordmark.svelte';
	import { page } from '$app/stores';

	export let ground = 'bg-brand-field';

	let open = false;

	// Tools leads: the free tools are the way in, and the formats family lives
	// under /tools/html-to-* — there is no /formats page and there should not be.
	const links = [
		{ label: 'Tools', href: '/tools' },
		{ label: 'Docs', href: '/docs' },
		{ label: 'Pricing', href: '/pricing' },
		{ label: 'Changelog', href: '/changelog' },
		{ label: 'Blog', href: '/blogs' }
	];

	// Prefix match, so a page at /tools/<slug> keeps Tools lit. Anchored with a
	// boundary check so a future /toolsomething cannot claim it.
	$: current = $page?.url?.pathname || '';
	$: isActive = (href) => current === href || current.startsWith(`${href}/`);
</script>

<header class="w-full {ground}">
	<nav
		class="mx-auto flex h-16 w-full max-w-page items-center justify-between px-5 lg:h-[88px] lg:px-10"
		aria-label="Main"
	>
		<a href="/" class="flex items-center gap-2.5" aria-label="Pictify home">
			<Wordmark />
		</a>

		<!-- Desktop links -->
		<ul class="hidden items-center gap-8 lg:flex">
			{#each links as link (link.href)}
				<li>
					<a
						href={link.href}
						aria-current={isActive(link.href) ? 'page' : undefined}
						class="font-sans text-base text-brand-ink hover:underline {isActive(link.href)
							? 'underline decoration-brand-ink decoration-2 underline-offset-[6px]'
							: ''}"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="flex items-center gap-4 lg:gap-4">
			<a href="/login" class="hidden font-sans text-base text-brand-slate hover:underline lg:block">
				Log in
			</a>
			<a
				href="/signup"
				class="flex items-center rounded-btn bg-brand-plum px-4 py-2 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 lg:px-6 lg:py-2.5 lg:text-base"
			>
				<span class="lg:hidden">Start</span>
				<span class="hidden lg:inline">Start rendering</span>
			</a>
			<button
				type="button"
				class="lg:hidden"
				aria-label={open ? 'Close menu' : 'Open menu'}
				aria-expanded={open}
				on:click={() => (open = !open)}
			>
				<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
					{#if open}
						<path
							d="M4 4 L18 18 M18 4 L4 18"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
						/>
					{:else}
						<path
							d="M2 6 H20 M2 11 H20 M2 16 H20"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
						/>
					{/if}
				</svg>
			</button>
		</div>
	</nav>

	{#if open}
		<ul class="flex flex-col gap-1 px-5 pb-5 lg:hidden">
			{#each links as link (link.href)}
				<li>
					<a href={link.href} class="block py-2 font-sans text-lg font-medium text-brand-ink">
						{link.label}
					</a>
				</li>
			{/each}
			<li>
				<a href="/login" class="block py-2 font-sans text-lg font-medium text-brand-slate">Log in</a
				>
			</li>
		</ul>
	{/if}
</header>
