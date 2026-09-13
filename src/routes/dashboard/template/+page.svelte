<script>
	/**
	 * The template library: one page for every template regardless of output —
	 * image and video templates are one collection with format chips, because
	 * that's how users think about them. The saved-template cap is visible
	 * from the first template (the count reads "n / cap"), not sprung at the
	 * moment of creation.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/telemetry.js';
	import { notify } from '../../../store/toast.store';
	import TemplateCard from '$lib/components/dashboard/v2/TemplateCard.svelte';
	import ProofSheet from '$lib/components/dashboard/v2/ProofSheet.svelte';
	import {
		getTemplates,
		getTemplateById,
		createTemplate,
		deleteTemplate
	} from '../../../api/template.js';
	import { getVideoTemplates, deleteVideoTemplate, duplicateVideoTemplate } from '../../../api/videoTemplates.js';
	import { plgStatus } from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import { PLAN_FEATURES, FEATURES, normalizePlan, PLAN_DISPLAY_NAMES } from '../../../config/plan-features.js';

	const FORMATS = ['ALL', 'PNG', 'PDF', 'GIF', 'MP4'];
	const SORTS = [
		{ value: 'newest', label: 'Newest' },
		{ value: 'usage', label: 'Most rendered' },
		{ value: 'name', label: 'Name' }
	];

	let loaded = false;
	let templates = [];
	let imageTotal = 0;
	let videoCount = 0;
	let search = '';
	let formatFilter = 'ALL';
	let sort = 'newest';
	let busyUid = '';
	let errorMessage = '';

	// QA escape hatch: ?preview=empty shows the empty state on any account.
	$: previewEmpty = $page.url.searchParams.get('preview') === 'empty';

	// A format filter with no matches is a creation opportunity, not a dead
	// end — the idle press plus each format's own pitch and seeded prompt.
	const FORMAT_EMPTY = {
		PNG: {
			noun: 'an image',
			line: 'Social cards, OG images, banners — rendered fresh for every page.',
			seed: 'An OG image for every blog post — post title, author name and our logo on our brand colors.',
			cta: 'Describe an image template'
		},
		PDF: {
			noun: 'a PDF',
			line: 'Invoices, certificates, statements — one document per row of data.',
			seed: 'An invoice PDF — our company details, line items with amounts, and a total, A4.',
			cta: 'Describe a PDF template'
		},
		GIF: {
			noun: 'a GIF',
			line: 'Countdowns and animated cards that move inside emails.',
			seed: 'A countdown GIF for our launch email — days remaining in big type on our brand colors.',
			cta: 'Describe a GIF template'
		},
		MP4: {
			noun: 'a video',
			line: 'Personalized recap and welcome videos, one per viewer.',
			seed: 'A short personalized welcome video — the viewer’s name and our logo on our brand colors.',
			cta: 'Describe a video template'
		}
	};

	function seedFormat(formatKey) {
		if (atCap) {
			openUpgradeModal('template_limit');
			return;
		}
		if (browser) sessionStorage.setItem('pictify_seed_prompt', FORMAT_EMPTY[formatKey].seed);
		analytics.track('templates_format_empty_seeded', { format: formatKey });
		// Straight into the studio: the seed becomes its first instruction, so
		// the user lands on the thing being built rather than on a composer.
		goto('/template-workspace/html/create');
	}

	$: total = imageTotal + videoCount;
	$: plan = normalizePlan($plgStatus?.plan || 'starter');
	$: cap = PLAN_FEATURES[plan]?.[FEATURES.TEMPLATES_SAVED] ?? null;
	$: atCap = cap !== null && total >= cap;
	$: planName = PLAN_DISPLAY_NAMES[plan] || 'Free';

	const cardFormat = (t) => {
		if (t.isVideo) return 'MP4';
		const f = (t.outputFormat || 'png').toLowerCase();
		if (f === 'image' || f === 'png' || f === 'jpg' || f === 'jpeg') return 'PNG';
		return f.toUpperCase();
	};

	$: visible = templates
		.filter((t) => formatFilter === 'ALL' || cardFormat(t) === formatFilter)
		.filter((t) => !search.trim() || (t.name || '').toLowerCase().includes(search.trim().toLowerCase()))
		.sort((a, b) => {
			if (sort === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
			if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
			return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
		});

	async function load() {
		let imagesData = null;
		let videosData = null;
		try {
			[imagesData, videosData] = await Promise.all([
				getTemplates({ page: 1, limit: 100, sort: 'newest' }),
				getVideoTemplates().catch(() => null)
			]);
		} catch (err) {
			// Inline, in the place the content would be — the list failing to
			// load is not an action anyone clicked, so it is not a toast.
			errorMessage = err?.data?.message || 'Could not load your templates. Reload the page.';
			loaded = true;
			return;
		}
		const images = (imagesData?.templates || []).map((t) => ({ ...t, isVideo: false }));
		imageTotal = imagesData?.pagination?.total ?? images.length;
		const videos = (videosData?.templates || videosData || []).map?.((t) => ({
			...t,
			isVideo: true,
			thumbnail: t.thumbnail || t.posterUrl,
			outputFormat: 'mp4'
		})) || [];
		videoCount = videos.length;
		templates = [...images, ...videos];
		loaded = true;
		analytics.track('templates_v2_viewed', { total, atCap });
	}

	onMount(load);

	function newTemplate() {
		if (atCap) {
			analytics.track('template_limit_hit', { surface: 'templates_page' });
			openUpgradeModal('template_limit');
			return;
		}
		goto('/dashboard');
	}

	function useStarter(event) {
		if (atCap) {
			openUpgradeModal('template_limit');
			return;
		}
		if (browser) sessionStorage.setItem('pictify_seed_prompt', event.detail.seed);
		goto('/template-workspace/html/create');
	}

	async function handleDuplicate(event) {
		const t = event.detail.template;
		if (atCap) {
			analytics.track('template_limit_hit', { surface: 'duplicate' });
			openUpgradeModal('template_limit');
			return;
		}
		busyUid = t.uid;
		errorMessage = '';
		try {
			if (t.isVideo) {
				await duplicateVideoTemplate(t.uid);
			} else {
				const full = await getTemplateById(t.uid);
				const source = full?.template || full;
				const created = await createTemplate({
					html: source.html,
					engine: source.engine || 'html',
					name: `${source.name || 'Untitled'} copy`,
					variables: source.variables,
					variableDefinitions: source.variableDefinitions,
					outputFormat: source.outputFormat,
					width: source.width,
					height: source.height
				});
				if (!created) throw new Error('Could not duplicate that template.');
			}
			await load();
		} catch (e) {
			/*
			 * A toast, not the page-top slot: the row the visitor clicked can be
			 * anywhere in a list of a hundred, and a sentence at the top of the
			 * page is off-screen exactly when it matters.
			 */
			notify.fail('Duplicate', e, { retry: () => handleDuplicate(event), id: `dup:${t.uid}` });
		} finally {
			busyUid = '';
		}
	}

	async function handleDelete(event) {
		const t = event.detail.template;
		// eslint-disable-next-line no-alert
		if (!confirm(`Delete "${t.name || 'this template'}"? Renders already made stay; callers using it will start failing.`)) return;
		busyUid = t.uid;
		errorMessage = '';
		try {
			if (t.isVideo) await deleteVideoTemplate(t.uid);
			else await deleteTemplate(t.uid);
			templates = templates.filter((x) => x.uid !== t.uid);
			if (t.isVideo) videoCount -= 1;
			else imageTotal -= 1;
			analytics.track('template_deleted', { isVideo: Boolean(t.isVideo) });
		} catch (e) {
			// The row stays: nothing was deleted, so nothing disappears.
			notify.fail('Delete', e, { retry: () => handleDelete(event), id: `del:${t.uid}` });
		} finally {
			busyUid = '';
		}
	}
</script>

<svelte:head>
	<title>Templates | Pictify.io</title>
</svelte:head>

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-5">
		<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
			<div class="flex items-baseline gap-3">
				<h1 class="font-display text-[30px] font-extrabold tracking-[-0.03em] text-brand-ink">Templates</h1>
				{#if loaded}
					<span class="font-mono text-[11px] text-brand-slate">
						{cap !== null ? `${total} / ${cap}` : total}
					</span>
					{#if cap !== null}
						<span class="rounded-[3px] bg-brand-canvas px-[7px] py-0.5 font-mono text-[9px] tracking-[0.08em] text-brand-ink">
							{planName.toUpperCase()} PLAN
						</span>
					{/if}
				{/if}
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex items-center gap-2 rounded-btn border-[1.5px] border-brand-rule px-3.5 py-2 focus-within:border-brand-ink lg:w-[280px]">
					<span class="font-mono text-xs text-brand-mute" aria-hidden="true">⌕</span>
					<input
						type="search"
						bind:value={search}
						placeholder="Search templates…"
						class="w-full bg-transparent font-sans text-[13px] text-brand-ink outline-none placeholder:text-brand-mute"
					/>
				</div>
				{#if atCap}
					<button
						type="button"
						on:click={newTemplate}
						class="flex items-center gap-2 rounded-btn border-[1.5px] border-brand-rule px-[18px] py-2.5 opacity-75 hover:opacity-100"
						title="Template limit reached"
					>
						<span class="block h-2 w-2 border-[1.5px] border-brand-slate" aria-hidden="true"></span>
						<span class="font-sans text-[13.5px] font-semibold text-brand-slate">New template</span>
					</button>
				{:else}
					<button
						type="button"
						on:click={newTemplate}
						class="rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
					>
						New template
					</button>
				{/if}
			</div>
		</div>

		{#if loaded && atCap}
			<div class="relative flex flex-col justify-between gap-3 overflow-hidden rounded-[10px] bg-brand-field px-[22px] py-3.5 sm:flex-row sm:items-center">
				<div class="absolute right-0 top-0 flex" aria-hidden="true">
					<span class="block h-[11px] w-[11px] bg-brand-ink"></span>
					<span class="block h-[11px] w-[11px] bg-brand-pink"></span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-ink opacity-65">
						Template limit — {total} of {cap} used on {planName}
					</span>
					<span class="font-display text-lg font-extrabold tracking-[-0.02em] text-brand-ink">
						You're out of template slots — upgrade to add more.
					</span>
				</div>
				<div class="flex flex-shrink-0 items-center gap-3">
					<span class="font-sans text-[12.5px] font-semibold text-brand-ink underline underline-offset-[3px]">
						Or delete one you don't use
					</span>
					<button
						type="button"
						on:click={() => {
							analytics.track('template_limit_upgrade_clicked');
							openUpgradeModal('template_limit');
						}}
						class="rounded-btn bg-brand-ink px-4 py-[9px] font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90"
					>
						See plans
					</button>
				</div>
			</div>
		{/if}

		<div
			class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"
			class:hidden={loaded && (templates.length === 0 || previewEmpty)}
		>
			<div class="flex gap-1.5" role="group" aria-label="Filter by format">
				{#each FORMATS as f (f)}
					<button
						type="button"
						on:click={() => (formatFilter = f)}
						class="rounded-[4px] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.06em] {formatFilter === f
							? 'bg-brand-field text-brand-ink'
							: 'border-[1.5px] border-brand-rule text-brand-slate hover:border-brand-ink'}"
					>
						{f}
					</button>
				{/each}
			</div>
			<label class="flex items-center gap-1.5">
				<span class="font-sans text-[12.5px] text-brand-slate">Sort:</span>
				<select bind:value={sort} class="bg-transparent font-sans text-[12.5px] font-semibold text-brand-ink outline-none">
					{#each SORTS as s (s.value)}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if errorMessage}
			<p role="alert" class="flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-[14px] text-brand-ink">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
				{errorMessage}
			</p>
		{/if}

		{#if !loaded}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
				{#each Array(6) as _}
					<div class="h-[260px] animate-pulse rounded-[10px] bg-brand-canvas"></div>
				{/each}
			</div>
		{:else if errorMessage}
			<!-- Nothing further: "you have no templates" under "we could not load
			     your templates" is a claim the page cannot make. -->
		{:else if templates.length === 0 || previewEmpty}
			<div class="flex flex-col gap-6 pt-1">
				<!-- The empty state teaches: what a template is, the two ways to get
				     one, and — via the ghost card — what the first card here will
				     look like. A reserved seat, not a void. -->
				<div class="relative flex flex-col items-center gap-8 overflow-hidden rounded-tile border-[1.5px] border-brand-rule px-8 py-9 lg:flex-row lg:gap-10 lg:px-10">
					<div class="absolute right-0 top-0 flex" aria-hidden="true">
						<span class="block h-3 w-3 bg-brand-powder"></span>
						<span class="block h-3 w-3 bg-brand-blue"></span>
					</div>
					<div class="flex flex-1 flex-col gap-3">
						<h2 class="font-display text-[28px] font-extrabold leading-[34px] tracking-[-0.03em] text-brand-ink">
							Nothing on the shelf yet.
						</h2>
						<p class="max-w-[400px] font-sans text-[14.5px] leading-[22px] text-brand-slate">
							A template is one HTML file with
							<span class="font-mono text-[13px] text-brand-royal">&#123;&#123;variables&#125;&#125;</span>. Your code,
							a spreadsheet, or an agent fills them — and files come out.
						</p>
						<div class="mt-1 flex flex-wrap gap-2.5">
							<button
								type="button"
								on:click={newTemplate}
								class="flex items-center gap-2 rounded-btn bg-brand-ink px-5 py-[11px] font-sans text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
							>
								Describe your first template
								<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
							</button>
							<button
								type="button"
								on:click={() => document.getElementById('starters')?.scrollIntoView({ behavior: 'smooth' })}
								class="rounded-btn border-[1.5px] border-brand-ink px-[18px] py-[11px] font-sans text-[13.5px] font-semibold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white"
							>
								Pick a starter below
							</button>
						</div>
						<span class="font-mono text-[10.5px] text-brand-mute">the agent writes the HTML — plain English is fine</span>
					</div>

					<div class="flex w-full max-w-[330px] flex-shrink-0 flex-col overflow-hidden rounded-[10px] border-[1.5px] border-dashed border-brand-mute opacity-85" aria-hidden="true">
						<div class="flex h-[130px] flex-col items-center justify-center gap-2 bg-brand-canvas">
							<span class="flex">
								<span class="block h-2.5 w-2.5 bg-brand-field"></span>
								<span class="block h-2.5 w-2.5"></span>
								<span class="block h-2.5 w-2.5 bg-brand-field opacity-50"></span>
							</span>
							<span class="font-mono text-[10px] tracking-[0.1em] text-brand-mute">ITS LAST RENDER LANDS HERE</span>
						</div>
						<div class="flex items-center justify-between px-3.5 pb-1.5 pt-2.5">
							<span class="font-sans text-[13.5px] font-bold text-brand-mute">your-first-template</span>
							<span class="rounded-[3px] border border-brand-rule px-[7px] py-0.5 font-mono text-[9px] tracking-[0.06em] text-brand-mute">PNG</span>
						</div>
						<div class="px-3.5 pb-2">
							<span class="font-mono text-[10px] text-brand-mute">renders count up here</span>
						</div>
						<div class="flex gap-1.5 border-t border-dashed border-brand-rule bg-[#F4F6F4] px-3.5 py-[7px]">
							<span class="font-mono text-[9.5px] text-brand-royal opacity-70">&#123;&#123;whatever&#125;&#125;</span>
							<span class="font-mono text-[9.5px] text-brand-royal opacity-70">&#123;&#123;it&#125;&#125;</span>
							<span class="font-mono text-[9.5px] text-brand-royal opacity-70">&#123;&#123;needs&#125;&#125;</span>
						</div>
					</div>
				</div>

				<div id="starters" class="flex items-center gap-3">
					<h2 class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-mute">
						Starters — real templates, yours in one click
					</h2>
					<span class="flex" aria-hidden="true">
						<span class="block h-2.5 w-2.5 bg-brand-blue"></span>
						<span class="block h-2.5 w-2.5 bg-brand-pink"></span>
						<span class="block h-2.5 w-2.5 bg-brand-field"></span>
						<span class="block h-2.5 w-2.5 bg-brand-ink"></span>
					</span>
				</div>
				<ProofSheet starters hideHeader templates={[]} on:use={useStarter} />
			</div>
		{:else if visible.length === 0}
			{#if search.trim()}
				<div class="flex items-center gap-3 pt-2">
					<p class="font-sans text-[15px] text-brand-slate">
						Nothing matches "{search.trim()}".
					</p>
					<button
						type="button"
						on:click={() => (search = '')}
						class="font-sans text-[13px] font-semibold text-brand-ink underline underline-offset-[3px]"
					>
						Clear search
					</button>
				</div>
			{:else if FORMAT_EMPTY[formatFilter]}
				<!-- The idle press: mascot centered, V5's voice. The one place the
				     print metaphor survives in the dashboard — the machine on
				     screen explains it. -->
				<div class="flex min-h-[58vh] items-center justify-center">
					<div class="relative flex w-full max-w-[640px] flex-col items-center gap-4 overflow-hidden rounded-tile border-[1.5px] border-brand-rule px-10 py-10 text-center">
						<div class="absolute right-0 top-0 flex" aria-hidden="true">
							<span class="block h-3 w-3 bg-brand-powder"></span>
							<span class="block h-3 w-3 bg-brand-blue"></span>
						</div>
						<img
							src="/landing/mascot-press-empty.jpg"
							alt=""
							class="h-[230px] w-[310px] object-contain"
							aria-hidden="true"
						/>
						<div class="flex flex-col items-center gap-1.5">
							<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
								No {formatFilter} templates yet
							</span>
							<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">
								The press is idling. Feed it {FORMAT_EMPTY[formatFilter].noun} template.
							</span>
							<span class="font-sans text-[13.5px] text-brand-slate">
								{FORMAT_EMPTY[formatFilter].line}
							</span>
						</div>
						<button
							type="button"
							on:click={() => seedFormat(formatFilter)}
							class="mt-1 flex items-center gap-2 rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90"
						>
							{FORMAT_EMPTY[formatFilter].cta}
							<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
						</button>
					</div>
				</div>
			{:else}
				<p class="pt-2 font-sans text-[15px] text-brand-slate">Nothing here yet.</p>
			{/if}
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 {busyUid ? 'opacity-70' : ''}">
				{#each visible as t (t.uid)}
					<TemplateCard template={t} on:duplicate={handleDuplicate} on:delete={handleDelete} />
				{/each}
			</div>
		{/if}
	</div>
</div>
