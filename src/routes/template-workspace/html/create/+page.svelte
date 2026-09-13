<script>
	/**
	 * /template-workspace/html/create — the Start state for a new template.
	 * PS-6 (board PS-04 `K7R-0`).
	 *
	 * THIS PAGE USED TO CREATE A ROW ON MOUNT and bounce straight into the
	 * studio, on the reasoning that a template has to exist before it can be
	 * edited. Two things were wrong with that. It spent a template slot on
	 * anyone who merely clicked New — and it posted `html: ''`, which the
	 * renderer's validation now rejects outright (422, "template source is
	 * required"), so new templates could not be made at all.
	 *
	 * Now nothing is created until the buyer presses Create or Continue. The row
	 * still comes before the editing — everything downstream is addressed by
	 * uid — but it comes with a document in it.
	 */
	import { goto } from '$app/navigation';
	import { createTemplate } from '../../../../api/template';
	import TemplateStart from '$lib/components/studio/v2/TemplateStart.svelte';
	import { toast } from '../../../../store/toast.store';

	let busy = false;
	let error = null;

	/**
	 * A described draft still needs a document to be created with.
	 *
	 * `html: ''` is refused by the renderer's validation, and an empty canvas is
	 * not a truthful starting point anyway — this is a real, sized, blank page
	 * that the AI's first result then replaces.
	 */
	const seedDocument = (width, height) =>
		`<html style="margin:0;padding:0">\n<body style="margin:0;padding:0;width:${width}px;height:${height}px;box-sizing:border-box;background:#FFFFFF;font-family:system-ui,sans-serif"></body>\n</html>`;

	async function create({ html, description, format, width, height }) {
		if (busy) return;
		busy = true;
		error = null;
		try {
			const created = await createTemplate({
				name: description ? description.slice(0, 80) : 'Untitled template',
				engine: 'html',
				type: 'custom',
				html: html || seedDocument(width, height),
				variables: [],
				variableDefinitions: [],
				width,
				height,
				// The model's enum is ['image', 'pdf'] — `png` is rejected outright
				// (500, ValidationError). The Start card's Image/PDF choice maps onto
				// those two, and the PNG-or-JPG distinction is a render option.
				outputFormat: format === 'pdf' ? 'pdf' : 'image'
			});
			/*
			 * `createTemplate` returns NULL on failure instead of throwing, so an
			 * unchecked caller navigates to `/undefined` and reports success. The
			 * plan-limit case arrives this way too, which is why the message names
			 * the likely cause rather than only saying it failed.
			 */
			const uid = created?.template?.uid || created?.uid;
			if (!uid) {
				error =
					'The template could not be created. You may be out of template slots — check your plan, then try again.';
				toast.set({ message: error, type: 'error', duration: 5000 });
				return;
			}
			return uid;
		} catch (err) {
			const status = err?.status || 0;
			if (status === 402 || err?.data?.code === 'template_limit_reached') {
				error = err?.message || "You're out of template slots — upgrade to add more.";
			} else if (status === 401 || status === 403) {
				error = 'Sign in to create a template.';
			} else {
				error = err?.data?.error || err?.message || 'Could not create a template.';
			}
			toast.set({ message: error, type: 'error', duration: 5000 });
		} finally {
			busy = false;
		}
	}

	/**
	 * Describe → create the row, then hand the instruction over on arrival.
	 *
	 * The instruction travels in the URL so the drafting run belongs to the
	 * template's own page: a reload mid-draft lands somewhere real rather than
	 * back here with nothing made.
	 */
	async function onCreate(event) {
		const { description, format, width, height } = event.detail;
		const uid = await create({ description, format, width, height });
		if (uid) {
			goto(`/template-workspace/html/${uid}?draft=${encodeURIComponent(description)}`, {
				replaceState: true
			});
		}
	}

	/** Paste → the design already exists, so it opens straight in Code. */
	async function onPaste(event) {
		const { html, format, width, height } = event.detail;
		const uid = await create({ html, format, width, height });
		if (uid) goto(`/template-workspace/html/${uid}?mode=html`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>New template | Pictify.io</title>
</svelte:head>


<div class="flex min-h-screen justify-center bg-brand-canvas px-6 py-10">
	<div class="h-fit w-full max-w-[420px] rounded-[12px] bg-brand-paper">
		<div class="flex items-center gap-2 border-b border-brand-rule px-4 py-3">
			<a href="/dashboard/template" class="font-sans text-[13px] text-brand-slate hover:underline"
				>Templates</a
			>
			<span class="font-mono text-[11px] text-brand-mute">/</span>
			<span class="font-sans text-[15px] font-semibold text-brand-ink">New template</span>
			<span class="ml-1 flex items-center gap-1.5">
				<span class="block h-2 w-2 border border-brand-mute" aria-hidden="true" />
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate"
					>Not saved yet</span
				>
			</span>
		</div>

		<TemplateStart {busy} on:create={onCreate} on:paste={onPaste} />

		{#if error}
			<p class="flex items-start gap-2 px-4 pb-4">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				<span class="font-sans text-[12.5px] leading-[17px] text-brand-slate">{error}</span>
			</p>
		{/if}
	</div>
</div>
