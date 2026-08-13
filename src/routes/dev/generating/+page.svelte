<script>
	/**
	 * Dev harness for the generating screen — replays a scripted agent run
	 * into the real GeneratingStep component. Costs nothing: no backend, no
	 * model, no render. This is how the screen gets designed and verified.
	 */
	import { onMount } from 'svelte';
	import GeneratingStep from '$lib/components/onboarding/v2/GeneratingStep.svelte';

	let lines = [];
	let variables = [];
	let stage = 0;
	let agentStages = {};

	const stageEvent = (s) => {
		const at = agentStages[s.id]?.at ?? Date.now();
		const tookMs = s.status === 'done' ? Date.now() - at : agentStages[s.id]?.tookMs;
		agentStages = { ...agentStages, [s.id]: { ...s, at, tookMs } };
	};

	const SCRIPT = [
		[0, () => stageEvent({ id: 'agent', status: 'start', label: 'Reading the brief' })],
		[1800, () => stageEvent({ id: 'agent', status: 'done', label: 'Reading the brief' })],
		[2000, () => stageEvent({ id: 'fetch_website#1', status: 'start', label: 'Reading the site' })],
		[5200, () => stageEvent({ id: 'fetch_website#1', status: 'done', label: 'Reading the site', detail: 'Stripe | Financial infrastructure' })],
		[5400, () => stageEvent({ id: 'generate_asset#2', status: 'start', label: 'Drawing a decoration' })],
		[16000, () => stageEvent({ id: 'generate_asset#2', status: 'done', label: 'Drawing a decoration', detail: 'confetti burst motif' })],
		[16200, () => stageEvent({ id: 'thinking', status: 'start', label: 'Working it out' })],
		[16400, () => stageEvent({ id: 'thinking', status: 'done', label: 'Working it out' })],
		[16400, () => stageEvent({ id: 'render_preview#3', status: 'start', label: 'Checking a proof' })],
		[24000, () => stageEvent({ id: 'render_preview#3', status: 'done', label: 'Checking a proof' })],
		[24100, () => stageEvent({ id: 'thinking', status: 'start', label: 'Working it out' })],
		[24400, () => stageEvent({ id: 'thinking', status: 'done', label: 'Working it out' })],
		[24400, () => stageEvent({ id: 'submit_template#4', status: 'start', label: 'Finalizing' })],
		[30000, () => {
			stageEvent({ id: 'submit_template#4', status: 'done', label: 'Finalizing' });
			const html = [
				'<div class="certificate">',
				'  <img class="logo" src="{{logoUrl}}">',
				'  <p class="eyebrow">Certificate of completion</p>',
				'  <h1>{{studentName}}</h1>',
				'  <p class="course">{{courseTitle}}</p>',
				'  <time>{{completionDate}}</time>',
				'</div>'
			];
			let i = 0;
			const feed = setInterval(() => {
				if (i >= html.length) return clearInterval(feed);
				lines = [...lines, html[i++]];
			}, 120);
		}],
		[31500, () => {
			stage = 1;
			const defs = [
				{ name: 'logoUrl', type: 'image' },
				{ name: 'studentName', type: 'text' },
				{ name: 'courseTitle', type: 'text' },
				{ name: 'completionDate', type: 'text' }
			];
			defs.forEach((v, i) => setTimeout(() => (variables = [...variables, v]), 400 * (i + 1)));
		}],
		[34000, () => (stage = 2)]
	];

	onMount(() => {
		const timers = SCRIPT.map(([delay, fn]) => setTimeout(fn, delay));
		return () => timers.forEach(clearTimeout);
	});
</script>

<svelte:head>
	<title>Generating preview | dev</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen w-full bg-brand-paper">
	<GeneratingStep
		prompt="A certificate for people who finish our course — our logo, their name, the date and the course title, in stripe.com's brand"
		{lines}
		{variables}
		{stage}
		{agentStages}
	/>
</div>
