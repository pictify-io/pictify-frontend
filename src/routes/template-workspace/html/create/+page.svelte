<script>
	/**
	 * /template-workspace/html/create — new template.
	 *
	 * A template has to exist before it can be edited: Say it needs a uid to
	 * edit against, and the html pane needs somewhere to save. So this creates
	 * an empty one immediately and hands straight over to the studio, rather
	 * than making the user fill in a form to earn the editor.
	 *
	 * `?mode=html` opens the studio in the code pane — that is the paste-your-own
	 * HTML entry point.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import backend from '../../../../service/backend';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';

	let error = null;

	$: mode = $page.url.searchParams.get('mode') === 'html' ? 'html' : 'say';

	onMount(async () => {
		try {
			const res = await backend.post('/templates', {
				name: 'Untitled template',
				engine: 'html',
				html: '',
				variables: [],
				variableDefinitions: [],
				width: 1080,
				height: 1080,
				outputFormat: 'image'
			});
			const uid = res?.template?.uid;
			if (!uid) {
				error = 'The template was created but came back without an id.';
				return;
			}
			goto(`/template-workspace/html/${uid}?mode=${mode}`, { replaceState: true });
		} catch (err) {
			// The saved-template cap lands here; say so plainly rather than
			// dumping the user on a blank screen.
			const status = err?.status || 0;
			if (status === 402 || err?.data?.code === 'template_limit_reached') {
				error = err?.message || "You're out of template slots — upgrade to add more.";
			} else if (status === 401 || status === 403) {
				error = 'Sign in to create a template.';
			} else {
				error = err?.message || 'Could not create a template.';
			}
			toast.set({ message: error, type: 'error', duration: 5000 });
		}
	});
</script>

<svelte:head>
	<title>New template | Pictify.io</title>
</svelte:head>

<Toast />

<div class="flex h-screen flex-col items-center justify-center gap-3 bg-brand-paper px-6 text-center">
	{#if error}
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">New template</span>
		<p class="max-w-[420px] font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">{error}</p>
		<a
			href="/dashboard/template"
			class="rounded-btn bg-brand-ink px-4 py-2 font-sans text-[13px] font-bold text-white hover:opacity-90"
		>
			Back to templates
		</a>
	{:else}
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">Opening studio…</span>
	{/if}
</div>
