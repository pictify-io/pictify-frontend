<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { fillDesignHtml } from '$lib/workflows/certificate-pack.js';
	import { getPack } from '$lib/workflows/packs.js';
	import { parseCsv, MAX_ROWS } from '$lib/workflows/csv.js';
	import { createTemplate, getTemplates, getTemplateById } from '../../../../api/template';
	import {
		createWorkflowRun,
		previewWorkflow,
		createWorkflowHook,
		listWorkflowHooks
	} from '../../../../api/workflow';
	import { analytics } from '$lib/analytics.js';

	// ?pack=<id> only picks which designs to show and which template-step
	// section comes first (harmless deep-link). Certificates is the default.
	const packParam = $page.url.searchParams.get('pack');
	const selectedPack = getPack(packParam) || getPack('certificates');
	const isCustomPack = !!selectedPack.custom;
	const packDesigns = selectedPack.designs || [];
	const packSampleRow = selectedPack.sampleRow || {};
	const packNounTitle = selectedPack.nounSingular.replace(/(^|\s)[a-z]/g, (c) => c.toUpperCase());
	const preselectSamples = !!packParam && !isCustomPack && packDesigns.length > 0;
	const sectionOrder = isCustomPack
		? { custom: 0, templates: 1, samples: 2 }
		: preselectSamples
		? { samples: 0, templates: 1, custom: 2 }
		: { templates: 0, samples: 1, custom: 2 };

	const CSV_STEPS = [
		{ key: 'source', label: 'Source' },
		{ key: 'data', label: 'Data' },
		{ key: 'template', label: 'Template' },
		{ key: 'mapping', label: 'Mapping' },
		{ key: 'preview', label: 'Preview' },
		{ key: 'deliver', label: 'Deliver' }
	];

	const WEBHOOK_STEPS = [
		{ key: 'source', label: 'Source' },
		{ key: 'template', label: 'Template' },
		{ key: 'fields', label: 'Fields' },
		{ key: 'hookDeliver', label: 'Delivery' },
		{ key: 'done', label: 'Done' }
	];

	function variableLabel(variable) {
		return String(variable)
			.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
			.replace(/^./, (c) => c.toUpperCase());
	}

	const pastePlaceholder = ['name,email', 'Ada Lovelace,ada@example.com'].join('\n');

	// ── Wizard state (single object) ─────────────────────────────────────
	let wizard = {
		// Step 1 — data
		fileName: '',
		headers: [],
		rows: [],
		truncated: false,
		totalRows: 0,
		// Step 2 — template
		templateUid: '',
		templateName: '',
		variables: [],
		fromSample: false,
		// Step 3 — mapping (varName → column header)
		mapping: {},
		// Step 4 — preview
		previews: [],
		previewsForKey: '',
		previewLoading: false,
		previewError: '',
		// Step 5 — delivery
		delivery: {
			method: 'download',
			emailColumn: '',
			subject: 'Your document',
			bodyText: 'Your document is attached below.'
		}
	};

	let step = 1;
	let source = '';
	let pasteText = '';
	let dragActive = false;
	let dataError = '';
	let isRunning = false;
	let runError = '';
	let fileInput;

	// ── Webhook-mode state ───────────────────────────────────────────────
	let hookMapping = {};
	let hookName = '';
	let hookDelivery = {
		method: 'download',
		emailKey: 'email',
		subject: 'Your document',
		bodyText: 'Your document is attached below.'
	};
	let createdHook = null;
	let hookCreatedKey = '';
	let hookCreating = false;
	let hookCreateError = '';
	let hookCopied = false;
	let hookStats = null;
	let hookPollTimer = null;
	let testSending = false;
	let testError = '';
	let testResult = null;

	// ── Step definitions driven by source ────────────────────────────────
	$: steps = source === 'webhook' ? WEBHOOK_STEPS : CSV_STEPS;
	$: currentKey = steps[Math.min(step, steps.length) - 1].key;

	// ── Step validity ────────────────────────────────────────────────────
	$: dataValid = wizard.rows.length > 0 && wizard.headers.length > 0;
	$: templateValid = !!wizard.templateUid;
	$: mappingValid = templateValid && wizard.variables.every((v) => !!wizard.mapping[v]);
	$: previewValid = mappingValid && wizard.previews.length > 0 && !wizard.previewError;
	$: deliverValid =
		previewValid && (wizard.delivery.method === 'download' || !!wizard.delivery.emailColumn);
	$: fieldsValid = templateValid && wizard.variables.every((v) => !!(hookMapping[v] || '').trim());
	$: hookDeliverValid =
		fieldsValid &&
		!!hookName.trim() &&
		(hookDelivery.method === 'download' || !!hookDelivery.emailKey.trim());
	$: validity = {
		source: !!source,
		data: dataValid,
		template: templateValid,
		mapping: mappingValid,
		preview: previewValid,
		deliver: deliverValid,
		fields: fieldsValid,
		hookDeliver: hookDeliverValid,
		done: !!createdHook
	};
	$: stepValidity = [true, ...steps.map((s) => validity[s.key])];

	$: emptyValueRowCount = wizard.rows.filter((row) =>
		wizard.variables.some((v) => wizard.mapping[v] && !row[wizard.mapping[v]])
	).length;

	function canEnterStep(target) {
		if (target <= 1) return true;
		// A step is reachable when every step before it is valid.
		for (let s = 1; s < target; s++) {
			if (!stepValidity[s]) return false;
		}
		return true;
	}

	function gotoStep(target) {
		if (!canEnterStep(target)) return;
		step = target;
		const key = steps[step - 1].key;
		if (key === 'mapping') prefillMapping();
		if (key === 'preview') loadPreviews();
		if (key === 'deliver') prefillEmailColumn();
		if (key === 'fields') prefillHookMapping();
		if (key === 'hookDeliver' && !hookName) hookName = `${wizard.templateName} hook`;
		if (key === 'done') createHook();
		if (key !== 'done') stopHookPolling();
	}

	function nextStep() {
		gotoStep(step + 1);
	}

	function prevStep() {
		if (step > 1) gotoStep(step - 1);
	}

	// ── Step 1: source ───────────────────────────────────────────────────
	function selectSource(value) {
		if (source === value) return;
		source = value;
	}

	// ── Step 1: CSV data ─────────────────────────────────────────────────
	function applyCsvText(text, fileName = '') {
		dataError = '';
		try {
			const result = parseCsv(text);
			if (!result.headers.length || !result.rows.length) {
				dataError = 'Could not find a header row plus at least one data row in that CSV.';
				return;
			}
			wizard = {
				...wizard,
				fileName,
				headers: result.headers,
				rows: result.rows,
				truncated: result.truncated,
				totalRows: result.totalRows,
				// Data changed — downstream steps must be redone.
				mapping: {},
				previews: [],
				previewsForKey: '',
				previewError: ''
			};
		} catch (error) {
			dataError = 'Failed to parse that CSV. Check the format and try again.';
		}
	}

	function handleFiles(files) {
		const file = files && files[0];
		if (!file) return;
		if (!/\.(csv|txt)$/i.test(file.name) && file.type !== 'text/csv') {
			dataError = 'Please upload a .csv file.';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => applyCsvText(String(reader.result || ''), file.name);
		reader.onerror = () => (dataError = 'Could not read that file.');
		reader.readAsText(file);
	}

	function handleDrop(event) {
		dragActive = false;
		handleFiles(event.dataTransfer?.files);
	}

	function handlePaste() {
		if (!pasteText.trim()) {
			dataError = 'Paste some CSV data first.';
			return;
		}
		applyCsvText(pasteText, '');
	}

	// ── Step 2: template selection ───────────────────────────────────────
	let templates = [];
	let templatesLoading = true;
	let templatesError = '';
	let selectingUid = '';
	let seedingId = '';
	let sampleError = '';
	let thumbWidth = 340;

	function parseHtmlVariables(html) {
		const names = [];
		const pattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
		let match;
		while ((match = pattern.exec(String(html || '')))) {
			if (!names.includes(match[1])) names.push(match[1]);
		}
		return names;
	}

	function definitionNames(template) {
		return (template?.variableDefinitions || []).map((d) => d?.name).filter(Boolean);
	}

	function variableCount(template) {
		const defs = definitionNames(template);
		return defs.length || parseHtmlVariables(template?.html).length;
	}

	async function loadTemplates() {
		templatesLoading = true;
		templatesError = '';
		const response = await getTemplates({ limit: 50 });
		if (!response) {
			templatesError = 'Failed to load your templates.';
		} else {
			templates = (response.templates || []).filter((t) => t.engine === 'html');
		}
		templatesLoading = false;
	}

	async function resolveVariables(template) {
		// The list API omits variableDefinitions — fetch the full template when needed.
		let names = definitionNames(template);
		if (names.length) return names;
		const response = await getTemplateById(template.uid);
		const full = response?.template;
		if (full) {
			names = definitionNames(full);
			if (names.length) return names;
			return parseHtmlVariables(full.html);
		}
		return parseHtmlVariables(template.html);
	}

	async function selectTemplate(template, { fromSample = false } = {}) {
		if (!template?.uid || wizard.templateUid === template.uid || selectingUid) return;
		selectingUid = template.uid;
		try {
			const variables = await resolveVariables(template);
			wizard = {
				...wizard,
				templateUid: template.uid,
				templateName: template.name || 'Untitled template',
				variables,
				fromSample,
				mapping: {},
				previews: [],
				previewsForKey: '',
				previewError: '',
				delivery: {
					...wizard.delivery,
					subject:
						fromSample && selectedPack.defaultSubject
							? selectedPack.defaultSubject
							: variables.includes('organizationName')
							? 'Your document from {{organizationName}}'
							: 'Your document'
				}
			};
			hookMapping = {};
			hookName = `${wizard.templateName} hook`;
		} finally {
			selectingUid = '';
		}
	}

	async function createSample(design) {
		if (seedingId) return;
		seedingId = design.id;
		sampleError = '';
		try {
			const response = await createTemplate({
				name: `${packNounTitle} — ${design.name}`,
				html: design.html,
				width: design.width,
				height: design.height,
				engine: 'html',
				variableDefinitions: design.variables.map((name) => ({ name, type: 'text' }))
			});
			const template = response?.template;
			if (!template?.uid) throw new Error('Failed to create the sample template.');
			templates = [template, ...templates];
			seedingId = '';
			await selectTemplate(template, { fromSample: true });
		} catch (error) {
			sampleError = error?.message || 'Failed to create the sample template.';
		} finally {
			seedingId = '';
		}
	}

	// ── Step 2: bring your own HTML ──────────────────────────────────────
	const customHtmlPlaceholder = [
		'<h1>Hello {{recipientName}}</h1>',
		'<p>Thanks for joining {{eventName}}.</p>'
	].join('\n');

	let customHtml = '';
	let customWidth = 1600;
	let customHeight = 1200;
	let customCreating = false;
	let customError = '';

	$: customVariables = parseHtmlVariables(customHtml);

	async function createCustomTemplate() {
		if (customCreating || selectingUid) return;
		customError = '';
		if (!customHtml.trim()) {
			customError = 'Paste your HTML first.';
			return;
		}
		const width = Math.round(Number(customWidth));
		const height = Math.round(Number(customHeight));
		if (!width || !height || width < 1 || height < 1) {
			customError = 'Enter a valid width and height in pixels.';
			return;
		}
		customCreating = true;
		try {
			const response = await createTemplate({
				name: 'Custom HTML template',
				html: customHtml,
				width,
				height,
				engine: 'html',
				variableDefinitions: customVariables.map((name) => ({ name, type: 'text' }))
			});
			const template = response?.template;
			if (!template?.uid) throw new Error('Failed to create the template.');
			templates = [template, ...templates];
			await selectTemplate(template);
		} catch (error) {
			customError = error?.message || 'Failed to create the template.';
		} finally {
			customCreating = false;
		}
	}

	// ── Step 3: mapping with fuzzy auto-match ────────────────────────────
	const MATCH_HINTS = {
		recipientName: [
			'recipientname',
			'recipient',
			'name',
			'fullname',
			'studentname',
			'student',
			'attendee',
			'participant',
			'employee',
			'person'
		],
		courseName: ['coursename', 'course', 'program', 'training', 'class', 'workshop', 'event'],
		date: ['date', 'completiondate', 'issuedate', 'issued', 'completedon', 'completed', 'day'],
		organizationName: [
			'organizationname',
			'organization',
			'organisation',
			'org',
			'company',
			'institution',
			'school',
			'issuer',
			'academy'
		],
		signatoryName: [
			'signatoryname',
			'signatory',
			'signature',
			'signedby',
			'instructor',
			'teacher',
			'director',
			'issuedby'
		],
		attendeeName: ['attendeename', 'attendee', 'name', 'fullname', 'guest', 'participant'],
		guestName: ['guestname', 'guest', 'name', 'fullname', 'attendee'],
		eventName: ['eventname', 'event', 'conference', 'festival', 'occasion', 'show'],
		role: ['role', 'jobtitle', 'title', 'position', 'designation'],
		company: ['company', 'organization', 'organisation', 'employer', 'org', 'team'],
		tableNumber: ['tablenumber', 'table', 'tableno', 'seat', 'seating'],
		ticketNumber: ['ticketnumber', 'ticket', 'ticketno', 'ticketid', 'serial', 'number'],
		venue: ['venue', 'location', 'place', 'address', 'hall']
	};

	function normalize(value) {
		return String(value || '')
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
	}

	function bestHeaderFor(variable, headers, used) {
		const hints = MATCH_HINTS[variable] || [normalize(variable)];
		const normalized = headers.map((h) => ({ header: h, norm: normalize(h) }));
		// Pass 1: exact hint match
		for (const hint of hints) {
			const hit = normalized.find((h) => h.norm === hint && !used.has(h.header));
			if (hit) return hit.header;
		}
		// Pass 2: header contains a hint (or vice versa)
		for (const hint of hints) {
			const hit = normalized.find(
				(h) =>
					!used.has(h.header) &&
					h.norm.length > 2 &&
					(h.norm.includes(hint) || hint.includes(h.norm))
			);
			if (hit) return hit.header;
		}
		return '';
	}

	function prefillMapping() {
		const mapping = { ...wizard.mapping };
		const used = new Set(Object.values(mapping).filter(Boolean));
		for (const variable of wizard.variables) {
			if (mapping[variable] && wizard.headers.includes(mapping[variable])) continue;
			const match = bestHeaderFor(variable, wizard.headers, used);
			if (match) {
				mapping[variable] = match;
				used.add(match);
			} else {
				mapping[variable] = '';
			}
		}
		wizard = { ...wizard, mapping };
	}

	function setMapping(variable, header) {
		wizard = {
			...wizard,
			mapping: { ...wizard.mapping, [variable]: header },
			previews: [],
			previewsForKey: '',
			previewError: ''
		};
	}

	// ── Step 4: previews ─────────────────────────────────────────────────
	$: previewKey = `${wizard.templateUid}::${JSON.stringify(wizard.mapping)}::${wizard.rows.length}`;

	async function loadPreviews() {
		if (wizard.previewLoading) return;
		if (wizard.previewsForKey === previewKey && wizard.previews.length && !wizard.previewError)
			return;

		wizard = { ...wizard, previewLoading: true, previewError: '', previews: [] };
		try {
			const sampleRows = wizard.rows.slice(0, 3);
			const results = await Promise.all(
				sampleRows.map((row) =>
					previewWorkflow({ templateUid: wizard.templateUid, row, columnMapping: wizard.mapping })
				)
			);
			wizard = {
				...wizard,
				previews: results.map((result, i) => ({
					url: result?.url || '',
					name: sampleRows[i][wizard.mapping[wizard.variables[0]]] || `Row ${i + 1}`
				})),
				previewsForKey: previewKey,
				previewLoading: false
			};
		} catch (error) {
			wizard = {
				...wizard,
				previewLoading: false,
				previewError: error?.message || 'Failed to render previews.'
			};
		}
	}

	// ── Step 5: delivery + run ───────────────────────────────────────────
	function prefillEmailColumn() {
		if (wizard.delivery.emailColumn) return;
		const emailHeader = wizard.headers.find((h) => normalize(h).includes('email'));
		if (emailHeader) {
			wizard = { ...wizard, delivery: { ...wizard.delivery, emailColumn: emailHeader } };
		}
	}

	function setDelivery(patch) {
		wizard = { ...wizard, delivery: { ...wizard.delivery, ...patch } };
	}

	// Shared delivery UI works on the CSV run delivery or the webhook delivery.
	$: activeDelivery = source === 'webhook' ? hookDelivery : wizard.delivery;

	function setActiveDelivery(patch) {
		if (source === 'webhook') hookDelivery = { ...hookDelivery, ...patch };
		else setDelivery(patch);
	}

	// ── Webhook flow: fields, delivery, done ─────────────────────────────
	function prefillHookMapping() {
		const mapping = { ...hookMapping };
		for (const variable of wizard.variables) {
			if (!mapping[variable]) mapping[variable] = variable;
		}
		hookMapping = mapping;
	}

	function setHookKey(variable, value) {
		hookMapping = { ...hookMapping, [variable]: value };
	}

	function sampleValueFor(variable) {
		if (packSampleRow[variable] != null) return packSampleRow[variable];
		const norm = normalize(variable);
		if (norm.includes('email')) return 'ada@example.com';
		if (norm.includes('date')) return 'June 12, 2026';
		if (norm.includes('name')) return 'Ada Lovelace';
		return 'Sample value';
	}

	function buildHookPayload(columnMapping, delivery) {
		const payload = {};
		for (const [variable, key] of Object.entries(columnMapping)) {
			payload[key] = sampleValueFor(variable);
		}
		const emailKey = delivery.method === 'email' ? delivery.emailKey.trim() : '';
		if (emailKey && payload[emailKey] == null) payload[emailKey] = 'ada@example.com';
		return payload;
	}

	$: hookColumnMapping = wizard.variables.reduce((acc, variable) => {
		acc[variable] = (hookMapping[variable] || variable).trim();
		return acc;
	}, {});
	$: hookRequestKey = JSON.stringify({
		templateUid: wizard.templateUid,
		columnMapping: hookColumnMapping,
		delivery: hookDelivery,
		name: hookName
	});
	$: hookUrl = createdHook?.path ? `${PUBLIC_BACKEND_URL}${createdHook.path}` : '';
	$: hookPayload = buildHookPayload(hookColumnMapping, hookDelivery);
	$: hookCurl = hookUrl
		? `curl -X POST ${hookUrl} -H 'Content-Type: application/json' -d '${JSON.stringify(
				hookPayload
		  )}'`
		: '';
	$: hookReceived = hookStats?.received || 0;
	$: hookRendered = hookStats?.rendered || 0;
	$: testUrl =
		testResult?.url || testResult?.image?.url || testResult?.item?.url || testResult?.render?.url;

	async function createHook() {
		if (hookCreating) return;
		if (createdHook && hookCreatedKey === hookRequestKey) {
			startHookPolling();
			return;
		}
		hookCreating = true;
		hookCreateError = '';
		createdHook = null;
		hookStats = null;
		testResult = null;
		testError = '';
		try {
			const delivery = { method: hookDelivery.method };
			if (hookDelivery.method === 'email') {
				delivery.emailColumn = hookDelivery.emailKey.trim();
				delivery.subject = hookDelivery.subject;
				delivery.bodyText = hookDelivery.bodyText;
			}
			const response = await createWorkflowHook({
				name: hookName.trim(),
				templateUid: wizard.templateUid,
				columnMapping: hookColumnMapping,
				delivery
			});
			createdHook = response?.hook || null;
			if (!createdHook) throw new Error('The webhook was created but no details were returned.');
			hookCreatedKey = hookRequestKey;
			analytics.track?.('Workflow Hook Created', {
				source: 'wizard',
				templateUid: wizard.templateUid,
				delivery: delivery.method
			});
			startHookPolling();
		} catch (error) {
			hookCreateError = error?.message || 'Failed to create the webhook. Please try again.';
		} finally {
			hookCreating = false;
		}
	}

	function startHookPolling() {
		stopHookPolling();
		pollHookStats();
	}

	function stopHookPolling() {
		clearTimeout(hookPollTimer);
		hookPollTimer = null;
	}

	async function pollHookStats() {
		if (!createdHook?.uid) return;
		try {
			const response = await listWorkflowHooks();
			const match = (response?.hooks || []).find((h) => h.uid === createdHook.uid);
			if (match) hookStats = match.stats || null;
		} catch (error) {
			/* keep polling */
		}
		hookPollTimer = setTimeout(pollHookStats, 3000);
	}

	async function copyHookUrl() {
		try {
			await navigator.clipboard.writeText(hookUrl);
			hookCopied = true;
			setTimeout(() => (hookCopied = false), 1500);
		} catch (error) {
			/* ignore */
		}
	}

	async function sendTestEvent() {
		if (!hookUrl || testSending) return;
		testSending = true;
		testError = '';
		testResult = null;
		try {
			const response = await fetch(hookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(hookPayload)
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(data?.message || `The webhook returned ${response.status}.`);
			}
			testResult = data || {};
		} catch (error) {
			testError = error?.message || 'Failed to send the test event.';
		} finally {
			testSending = false;
		}
	}

	async function startRun() {
		if (!deliverValid || isRunning) return;
		isRunning = true;
		runError = '';
		try {
			const delivery = { method: wizard.delivery.method };
			if (wizard.delivery.method === 'email') {
				delivery.emailColumn = wizard.delivery.emailColumn;
				delivery.subject = wizard.delivery.subject;
				delivery.bodyText = wizard.delivery.bodyText;
			}
			// The backend only knows 'certificates' | 'custom' — other packs run as custom.
			const packType =
				wizard.fromSample && selectedPack.id === 'certificates' ? 'certificates' : 'custom';
			const response = await createWorkflowRun({
				packType,
				templateUid: wizard.templateUid,
				rows: wizard.rows,
				columnMapping: wizard.mapping,
				delivery
			});
			const uid = response?.run?.uid;
			if (!uid) throw new Error('The run was created but no run id was returned.');
			analytics.track?.('workflow_run_started', {
				packType,
				pack: selectedPack.id,
				rows: wizard.rows.length,
				templateUid: wizard.templateUid,
				delivery: delivery.method
			});
			goto(`/dashboard/workflows/${uid}`);
		} catch (error) {
			runError = error?.message || 'Failed to start the run. Please try again.';
			isRunning = false;
		}
	}

	onMount(() => {
		analytics.page('Workflows New Run');
		loadTemplates();
	});

	onDestroy(() => {
		stopHookPolling();
	});
</script>

<svelte:head>
	<title>New run - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Header -->
	<div class="pt-4 mb-8">
		<a
			href="/dashboard/workflows"
			class="inline-flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors mb-4"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M7 16l-4-4m0 0l4-4m-4 4h18"
				/>
			</svg>
			Workflows
		</a>
		<h1
			class="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tighter leading-[0.95]"
		>
			New run.
		</h1>
	</div>

	<!-- Progress Indicator -->
	<div class="mb-10 overflow-x-auto pb-2">
		<div class="flex items-stretch gap-2 sm:gap-3 min-w-max">
			{#each steps as s, i (s.key)}
				<button
					on:click={() => gotoStep(i + 1)}
					disabled={!canEnterStep(i + 1)}
					class="flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] transition-all duration-200
						{step === i + 1
						? 'bg-brand-accent border-black shadow-brutal-md text-black'
						: canEnterStep(i + 1)
						? 'bg-white border-black shadow-brutal-sm text-black hover:shadow-brutal-md hover:-translate-y-0.5'
						: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}"
				>
					<span
						class="w-7 h-7 rounded-lg border-[2px] flex items-center justify-center text-xs font-black flex-shrink-0
							{stepValidity[i + 1] && step !== i + 1
							? 'bg-data-green border-black text-black'
							: step === i + 1
							? 'bg-black border-black text-white'
							: canEnterStep(i + 1)
							? 'bg-white border-black text-black'
							: 'bg-gray-200 border-gray-300 text-gray-400'}"
					>
						{#if stepValidity[i + 1] && step !== i + 1}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{:else}
							{i + 1}
						{/if}
					</span>
					<span class="text-xs font-black uppercase tracking-widest">{s.label}</span>
				</button>
				{#if i < steps.length - 1}
					<div class="flex items-center">
						<div class="w-4 sm:w-6 h-[3px] bg-black" />
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- ─── STEP: SOURCE ─────────────────────────────────────────────── -->
	{#if currentKey === 'source'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
			<!-- CSV option -->
			<button
				on:click={() => selectSource('csv')}
				class="text-left bg-white rounded-2xl border-[3px] p-6 transition-all duration-200
					{source === 'csv'
					? 'border-black shadow-brutal-2xl -translate-y-1'
					: 'border-black shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1'}"
			>
				<div class="flex items-start justify-between">
					<div
						class="w-12 h-12 bg-brand-accent/20 rounded-xl border-[3px] border-black shadow-brutal-sm flex items-center justify-center mb-4"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					{#if source === 'csv'}
						<span
							class="w-7 h-7 bg-data-green rounded-lg border-[2px] border-black flex items-center justify-center"
						>
							<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</span>
					{/if}
				</div>
				<h3 class="text-base font-black text-black uppercase tracking-wide">
					Upload a spreadsheet
				</h3>
				<p class="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
					Upload or paste a CSV and render every row in a one-time batch run.
				</p>
			</button>

			<!-- Webhook option -->
			<button
				on:click={() => selectSource('webhook')}
				class="text-left bg-white rounded-2xl border-[3px] p-6 transition-all duration-200
					{source === 'webhook'
					? 'border-black shadow-brutal-2xl -translate-y-1'
					: 'border-black shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1'}"
			>
				<div class="flex items-start justify-between">
					<div
						class="w-12 h-12 bg-data-violet/20 rounded-xl border-[3px] border-black shadow-brutal-sm flex items-center justify-center mb-4"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m7.5-2.344a4 4 0 015.656 0l.086.086a4 4 0 010 5.656l-1.5 1.5m-7.5-9.5l3-3a4 4 0 015.656 5.656l-1.5 1.5"
							/>
						</svg>
					</div>
					{#if source === 'webhook'}
						<span
							class="w-7 h-7 bg-data-green rounded-lg border-[2px] border-black flex items-center justify-center"
						>
							<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</span>
					{/if}
				</div>
				<h3 class="text-base font-black text-black uppercase tracking-wide">Connect a webhook</h3>
				<p class="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
					Your systems send rows one at a time — LMS completions, form submissions, Zapier or n8n.
				</p>
			</button>
		</div>
	{/if}

	<!-- ─── STEP: DATA (CSV) ─────────────────────────────────────────── -->
	{#if currentKey === 'data'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- Upload -->
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col"
			>
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-brand-accent rounded-sm border-[2px] border-black" />
					Upload CSV
				</h2>
				<div
					role="button"
					tabindex="0"
					on:click={() => fileInput?.click()}
					on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput?.click()}
					on:dragover|preventDefault={() => (dragActive = true)}
					on:dragleave={() => (dragActive = false)}
					on:drop|preventDefault={handleDrop}
					class="flex-1 min-h-[220px] rounded-xl border-[3px] border-dashed flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all duration-200
						{dragActive
						? 'border-black bg-brand-accent/20 shadow-brutal-md'
						: 'border-gray-400 bg-gray-50 hover:border-black hover:bg-brand-accent/10'}"
				>
					<div
						class="w-14 h-14 bg-white rounded-xl border-[3px] border-black shadow-brutal-md flex items-center justify-center mb-4 rotate-3"
					>
						<svg class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<p class="text-sm font-black text-black uppercase tracking-wider">Drop your CSV here</p>
					<p class="text-xs font-bold text-gray-500 mt-1">or click to browse</p>
					{#if wizard.fileName}
						<span
							class="mt-4 px-3 py-1 bg-data-green text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
						>
							{wizard.fileName}
						</span>
					{/if}
				</div>
				<input
					type="file"
					accept=".csv,text/csv,.txt"
					class="hidden"
					bind:this={fileInput}
					on:change={(e) => handleFiles(e.target.files)}
				/>
			</div>

			<!-- Paste -->
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col"
			>
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
					Or paste CSV
				</h2>
				<textarea
					bind:value={pasteText}
					rows="8"
					placeholder={pastePlaceholder}
					class="flex-1 w-full rounded-xl border-[3px] border-black p-4 font-mono text-xs text-black bg-gray-50 focus:outline-none focus:shadow-brutal-md focus:bg-white transition-all resize-none"
				/>
				<button
					on:click={handlePaste}
					class="mt-4 self-start inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors"
				>
					Use pasted data
				</button>
			</div>
		</div>

		{#if dataError}
			<div
				class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-6 text-sm font-bold text-brand-danger"
			>
				{dataError}
			</div>
		{/if}

		{#if dataValid}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden mb-8"
			>
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b-[3px] border-black bg-gray-50"
				>
					<span class="text-sm font-black text-black uppercase tracking-widest">
						Detected data
					</span>
					<div class="flex items-center gap-2 flex-wrap">
						<span
							class="px-3 py-1 bg-brand-accent text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
						>
							{wizard.headers.length} columns
						</span>
						<span
							class="px-3 py-1 bg-data-green text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
						>
							{wizard.rows.length} rows
						</span>
					</div>
				</div>
				{#if wizard.truncated}
					<div class="p-4 bg-brand-accent/20 border-b-[3px] border-black">
						<p class="text-xs font-black text-black uppercase tracking-wide">
							Your file has {wizard.totalRows} rows — only the first {MAX_ROWS} will be used in this
							run.
						</p>
					</div>
				{/if}
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr class="border-b-[3px] border-black bg-gray-50">
								{#each wizard.headers as header}
									<th
										class="px-4 py-3 text-[10px] font-black text-black uppercase tracking-widest whitespace-nowrap"
									>
										{header}
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y-[2px] divide-gray-200">
							{#each wizard.rows.slice(0, 3) as row}
								<tr>
									{#each wizard.headers as header}
										<td class="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
											{row[header]}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if wizard.rows.length > 3}
					<div
						class="p-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border-t-[2px] border-gray-200"
					>
						+ {wizard.rows.length - 3} more rows
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- ─── STEP 2: TEMPLATE ─────────────────────────────────────────── -->
	{#if currentKey === 'template'}
		<div class="flex flex-col gap-10 mb-8">
			<!-- Workspace templates -->
			<div style="order: {sectionOrder.templates}">
				<div class="flex items-center gap-3 mb-6">
					<h2
						class="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3"
					>
						<span class="w-3 h-3 bg-brand-accent rounded-sm border-[2px] border-black" />
						Your templates
					</h2>
				</div>

				{#if templatesLoading}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each Array(3) as _}
							<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md p-5">
								<div class="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
								<div class="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
							</div>
						{/each}
					</div>
				{:else if templatesError}
					<div
						class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center"
					>
						<p class="text-sm font-black text-black uppercase tracking-wider mb-4">
							{templatesError}
						</p>
						<button
							on:click={loadTemplates}
							class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
						>
							Retry
						</button>
					</div>
				{:else if templates.length === 0}
					<div
						class="bg-white rounded-2xl border-[3px] border-black border-dashed p-10 text-center flex flex-col items-center"
					>
						<p class="text-lg font-black text-black mb-2">No templates yet</p>
						<p class="text-sm font-bold text-gray-500 max-w-sm">
							Create one in the
							<a href="/dashboard/template" class="underline text-black hover:text-brand-danger">
								template editor
							</a>
							— or start from a sample below.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each templates as template (template.uid)}
							<button
								on:click={() => selectTemplate(template)}
								disabled={!!selectingUid && selectingUid !== template.uid}
								class="text-left bg-white rounded-2xl border-[3px] border-black p-5 transition-all duration-200
									{wizard.templateUid === template.uid
									? 'shadow-brutal-2xl -translate-y-1'
									: 'shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1'}"
							>
								<div class="flex items-start justify-between gap-3">
									<h3 class="text-base font-black text-black truncate">
										{template.name || 'Untitled template'}
									</h3>
									{#if wizard.templateUid === template.uid}
										<span
											class="w-7 h-7 bg-data-green rounded-lg border-[2px] border-black flex items-center justify-center flex-shrink-0"
										>
											<svg
												class="w-4 h-4 text-black"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 mt-3 flex-wrap">
									<span
										class="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
									>
										{template.width}&times;{template.height}
									</span>
									<span
										class="px-2.5 py-1 bg-brand-accent/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
									>
										{variableCount(template)}
										{variableCount(template) === 1 ? 'variable' : 'variables'}
									</span>
								</div>
								{#if selectingUid === template.uid}
									<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-3">
										Loading variables&hellip;
									</p>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Samples -->
			{#if packDesigns.length}
				<div style="order: {sectionOrder.samples}">
					<div class="flex items-center gap-3 mb-2">
						<h2
							class="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3"
						>
							<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
							Start from a sample
						</h2>
					</div>
					<p class="text-xs font-bold text-gray-500 mb-6">
						{packNounTitle} designs — one click creates a template in your workspace.
					</p>

					{#if sampleError}
						<div
							class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-6 text-sm font-bold text-brand-danger"
						>
							{sampleError}
						</div>
					{/if}

					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						{#each packDesigns as design (design.id)}
							<div
								class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md overflow-hidden"
							>
								<!-- Thumbnail: scaled iframe of the real design -->
								<div
									class="border-b-[3px] border-black relative overflow-hidden bg-gray-100"
									style="aspect-ratio: {design.width} / {design.height};"
									bind:clientWidth={thumbWidth}
								>
									<iframe
										title="{design.name} sample preview"
										srcdoc={fillDesignHtml(design.html, packSampleRow)}
										sandbox=""
										scrolling="no"
										loading="lazy"
										class="pointer-events-none select-none border-0 origin-top-left"
										style="width: {design.width}px; height: {design.height}px; transform: scale({thumbWidth /
											design.width});"
									/>
								</div>
								<div class="p-5">
									<h3 class="text-base font-black text-black uppercase tracking-wide">
										{design.name}
									</h3>
									<p class="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
										{design.description}
									</p>
									<button
										on:click={() => createSample(design)}
										disabled={!!seedingId || !!selectingUid}
										class="mt-4 inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{seedingId === design.id ? 'Creating…' : 'Use this sample'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Bring your own HTML -->
			<div style="order: {sectionOrder.custom}">
				<div class="flex items-center gap-3 mb-2">
					<h2
						class="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3"
					>
						<span class="w-3 h-3 bg-data-green rounded-sm border-[2px] border-black" />
						Bring your own HTML
					</h2>
				</div>
				<p class="text-xs font-bold text-gray-500 mb-6">
					Paste an HTML document with {'{{variables}}'} — one click creates a template in your workspace.
				</p>

				{#if customError}
					<div
						class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-6 text-sm font-bold text-brand-danger"
					>
						{customError}
					</div>
				{/if}

				<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md p-6">
					<textarea
						bind:value={customHtml}
						rows="10"
						placeholder={customHtmlPlaceholder}
						class="w-full rounded-xl border-[3px] border-black p-4 font-mono text-xs text-black bg-gray-50 focus:outline-none focus:shadow-brutal-md focus:bg-white transition-all resize-y"
					/>
					{#if customVariables.length}
						<div class="flex items-center gap-2 flex-wrap mt-4">
							<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
								Detected variables
							</span>
							{#each customVariables as variable (variable)}
								<span
									class="px-2.5 py-1 bg-brand-accent/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
								>
									{variable}
								</span>
							{/each}
						</div>
					{/if}
					<div class="flex flex-col sm:flex-row sm:items-end gap-4 mt-4">
						<div>
							<label
								for="custom-width"
								class="block text-xs font-black text-black uppercase tracking-widest mb-2"
							>
								Width (px)
							</label>
							<input
								id="custom-width"
								type="number"
								min="1"
								bind:value={customWidth}
								class="w-32 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
							/>
						</div>
						<div>
							<label
								for="custom-height"
								class="block text-xs font-black text-black uppercase tracking-widest mb-2"
							>
								Height (px)
							</label>
							<input
								id="custom-height"
								type="number"
								min="1"
								bind:value={customHeight}
								class="w-32 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
							/>
						</div>
						<button
							on:click={createCustomTemplate}
							disabled={customCreating || !!selectingUid}
							class="sm:ml-auto inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{customCreating ? 'Creating…' : 'Create template'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ─── STEP 3: MAPPING ──────────────────────────────────────────── -->
	{#if currentKey === 'mapping'}
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden mb-8"
		>
			<div class="p-5 border-b-[3px] border-black bg-gray-50">
				<span class="text-sm font-black text-black uppercase tracking-widest">
					Map CSV columns to template fields
				</span>
				<p class="text-xs font-bold text-gray-500 mt-1">
					We auto-matched what we could — check each field below.
				</p>
			</div>
			<div class="p-6 space-y-4">
				{#each wizard.variables as variable}
					<div
						class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pb-4 border-b-[2px] border-gray-100 last:border-b-0 last:pb-0"
					>
						<div class="sm:w-56 flex items-center gap-2">
							<span
								class="w-2 h-2 rounded-full border border-black {wizard.mapping[variable]
									? 'bg-data-green'
									: 'bg-brand-danger'}"
							/>
							<span class="text-xs font-black text-black uppercase tracking-widest">
								{variableLabel(variable)}
							</span>
						</div>
						<select
							value={wizard.mapping[variable] || ''}
							on:change={(e) => setMapping(variable, e.target.value)}
							class="flex-1 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						>
							<option value="">— Select a column —</option>
							{#each wizard.headers as header}
								<option value={header}>{header}</option>
							{/each}
						</select>
					</div>
				{:else}
					<p class="text-xs font-black text-gray-500 uppercase tracking-wide">
						This template has no variables — every file will look the same.
					</p>
				{/each}
			</div>
		</div>

		{#if !mappingValid}
			<div
				class="bg-brand-accent/20 border-[3px] border-black rounded-xl p-4 mb-8 text-xs font-black text-black uppercase tracking-wide"
			>
				Map every field to continue.
			</div>
		{:else if emptyValueRowCount > 0}
			<div
				class="bg-brand-accent/20 border-[3px] border-black rounded-xl p-4 mb-8 text-xs font-black text-black uppercase tracking-wide"
			>
				Heads up: {emptyValueRowCount}
				{emptyValueRowCount === 1 ? 'row has' : 'rows have'} empty values in mapped columns. Those files
				will have blank spots.
			</div>
		{/if}
	{/if}

	<!-- ─── STEP 4: PREVIEW ──────────────────────────────────────────── -->
	{#if currentKey === 'preview'}
		{#if wizard.previewLoading}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
				{#each Array(Math.min(3, wizard.rows.length)) as _}
					<div
						class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md overflow-hidden"
					>
						<div class="aspect-[4/3] bg-gray-100 animate-pulse" />
						<div class="p-4 border-t-[3px] border-black">
							<div class="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
						</div>
					</div>
				{/each}
			</div>
			<p class="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">
				Rendering previews&hellip; this can take a few seconds.
			</p>
		{:else if wizard.previewError}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center mb-8"
			>
				<div
					class="w-14 h-14 bg-brand-danger/10 rounded-xl border-[3px] border-brand-danger flex items-center justify-center mb-4"
				>
					<svg
						class="w-7 h-7 text-brand-danger"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<p class="text-sm font-black text-black uppercase tracking-wider mb-2">Preview failed</p>
				<p class="text-xs font-bold text-gray-500 mb-6 max-w-sm">{wizard.previewError}</p>
				<button
					on:click={loadPreviews}
					class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
				>
					Retry
				</button>
			</div>
		{:else if wizard.previews.length}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
				{#each wizard.previews as preview, i}
					<div
						class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg overflow-hidden"
					>
						<div class="aspect-[4/3] bg-gray-100 overflow-hidden">
							<img
								src={preview.url}
								alt="Preview for {preview.name}"
								class="w-full h-full object-cover"
							/>
						</div>
						<div class="p-4 border-t-[3px] border-black flex items-center justify-between gap-2">
							<span class="text-sm font-black text-black truncate">{preview.name}</span>
							<span
								class="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-[10px] font-bold text-gray-700 uppercase tracking-widest flex-shrink-0"
							>
								Row {i + 1}
							</span>
						</div>
					</div>
				{/each}
			</div>
			<p class="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">
				Showing the first {wizard.previews.length} of {wizard.rows.length} files.
			</p>
		{/if}
	{/if}

	<!-- ─── STEP: FIELDS (WEBHOOK) ───────────────────────────────────── -->
	{#if currentKey === 'fields'}
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden mb-8"
		>
			<div class="p-5 border-b-[3px] border-black bg-gray-50">
				<span class="text-sm font-black text-black uppercase tracking-widest">
					Map template fields to JSON keys
				</span>
				<p class="text-xs font-bold text-gray-500 mt-1">
					Keys of the JSON object your system will POST.
				</p>
			</div>
			<div class="p-6 space-y-4">
				{#each wizard.variables as variable (variable)}
					<div
						class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pb-4 border-b-[2px] border-gray-100 last:border-b-0 last:pb-0"
					>
						<div class="sm:w-56 flex items-center gap-2">
							<span
								class="w-2 h-2 rounded-full border border-black {(
									hookMapping[variable] || ''
								).trim()
									? 'bg-data-green'
									: 'bg-brand-danger'}"
							/>
							<span class="text-xs font-black text-black uppercase tracking-widest">
								{variableLabel(variable)}
							</span>
						</div>
						<input
							type="text"
							value={hookMapping[variable] || ''}
							placeholder={variable}
							on:input={(e) => setHookKey(variable, e.target.value)}
							class="flex-1 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-mono font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
					</div>
				{:else}
					<p class="text-xs font-black text-gray-500 uppercase tracking-wide">
						This template has no variables — every event will render the same file.
					</p>
				{/each}
			</div>
		</div>

		{#if !fieldsValid}
			<div
				class="bg-brand-accent/20 border-[3px] border-black rounded-xl p-4 mb-8 text-xs font-black text-black uppercase tracking-wide"
			>
				Give every field a JSON key to continue.
			</div>
		{/if}
	{/if}

	<!-- ─── STEP 5: DELIVER + RUN ────────────────────────────────────── -->
	{#if currentKey === 'deliver' || currentKey === 'hookDeliver'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
			<!-- Download option -->
			<button
				on:click={() => setActiveDelivery({ method: 'download' })}
				class="text-left bg-white rounded-2xl border-[3px] p-6 transition-all duration-200
					{activeDelivery.method === 'download'
					? 'border-black shadow-brutal-2xl -translate-y-1'
					: 'border-black shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1'}"
			>
				<div class="flex items-start justify-between">
					<div
						class="w-12 h-12 bg-brand-accent/20 rounded-xl border-[3px] border-black shadow-brutal-sm flex items-center justify-center mb-4"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</div>
					{#if activeDelivery.method === 'download'}
						<span
							class="w-7 h-7 bg-data-green rounded-lg border-[2px] border-black flex items-center justify-center"
						>
							<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</span>
					{/if}
				</div>
				<h3 class="text-base font-black text-black uppercase tracking-wide">Download links</h3>
				<p class="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
					{source === 'webhook'
						? 'Render each incoming event and collect the file links on the workflows page.'
						: 'Render every file and get a link for each one on the run page.'}
				</p>
			</button>

			<!-- Email option -->
			<button
				on:click={() => setActiveDelivery({ method: 'email' })}
				class="text-left bg-white rounded-2xl border-[3px] p-6 transition-all duration-200
					{activeDelivery.method === 'email'
					? 'border-black shadow-brutal-2xl -translate-y-1'
					: 'border-black shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1'}"
			>
				<div class="flex items-start justify-between">
					<div
						class="w-12 h-12 bg-data-violet/20 rounded-xl border-[3px] border-black shadow-brutal-sm flex items-center justify-center mb-4"
					>
						<svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					{#if activeDelivery.method === 'email'}
						<span
							class="w-7 h-7 bg-data-green rounded-lg border-[2px] border-black flex items-center justify-center"
						>
							<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</span>
					{/if}
				</div>
				<h3 class="text-base font-black text-black uppercase tracking-wide">
					Email each recipient
				</h3>
				<p class="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
					Send every file straight to the recipient's inbox.
				</p>
			</button>
		</div>

		{#if activeDelivery.method === 'email'}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8 space-y-5"
			>
				<div>
					<label
						for="email-column"
						class="block text-xs font-black text-black uppercase tracking-widest mb-2"
					>
						{source === 'webhook' ? 'Email key' : 'Email column'}
					</label>
					{#if source === 'webhook'}
						<input
							id="email-column"
							type="text"
							value={hookDelivery.emailKey}
							placeholder="email"
							on:input={(e) => setActiveDelivery({ emailKey: e.target.value })}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-mono font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
						<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
							Key of the JSON object that holds the recipient's email address.
						</p>
					{:else}
						<select
							id="email-column"
							value={wizard.delivery.emailColumn}
							on:change={(e) => setDelivery({ emailColumn: e.target.value })}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						>
							<option value="">— Select the column with email addresses —</option>
							{#each wizard.headers as header}
								<option value={header}>{header}</option>
							{/each}
						</select>
					{/if}
				</div>
				<div>
					<label
						for="email-subject"
						class="block text-xs font-black text-black uppercase tracking-widest mb-2"
					>
						Subject
					</label>
					<input
						id="email-subject"
						type="text"
						value={activeDelivery.subject}
						on:input={(e) => setActiveDelivery({ subject: e.target.value })}
						class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
					/>
					<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
						You can use {'{{variables}}'} from your mapping, e.g. {'{{organizationName}}'}.
					</p>
				</div>
				<div>
					<label
						for="email-body"
						class="block text-xs font-black text-black uppercase tracking-widest mb-2"
					>
						Message
					</label>
					<textarea
						id="email-body"
						rows="3"
						value={activeDelivery.bodyText}
						on:input={(e) => setActiveDelivery({ bodyText: e.target.value })}
						class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all resize-none"
					/>
				</div>
			</div>
		{/if}

		{#if source === 'webhook'}
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8">
				<label
					for="hook-name"
					class="block text-xs font-black text-black uppercase tracking-widest mb-2"
				>
					Webhook name
				</label>
				<input
					id="hook-name"
					type="text"
					bind:value={hookName}
					placeholder="{wizard.templateName} hook"
					class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
				/>
				<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
					So you can recognize this webhook later on the workflows page.
				</p>
			</div>
		{/if}

		{#if runError && source !== 'webhook'}
			<div
				class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-6 text-sm font-bold text-brand-danger"
			>
				{runError}
			</div>
		{/if}

		{#if source !== 'webhook'}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
			>
				<div>
					<p class="text-sm font-black text-black uppercase tracking-widest">Ready to run</p>
					<p class="text-xs font-bold text-gray-500 mt-1">
						{wizard.rows.length}
						{wizard.rows.length === 1 ? 'file' : 'files'} &middot; {wizard.templateName} template &middot;
						{wizard.delivery.method === 'email' ? 'emailed to recipients' : 'download links'}
					</p>
				</div>
				<button
					on:click={startRun}
					disabled={!deliverValid || isRunning}
					class="group flex items-center justify-center gap-3 bg-brand-danger border-[3px] border-black shadow-brutal-xl rounded-2xl px-8 py-4 hover:shadow-brutal-sm hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-brutal-xl disabled:hover:translate-x-0 disabled:hover:translate-y-0"
				>
					<span class="text-white font-black text-lg uppercase tracking-wide">
						{isRunning
							? 'Starting…'
							: `Run ${wizard.rows.length} ${wizard.rows.length === 1 ? 'file' : 'files'}`}
					</span>
					<div
						class="w-9 h-9 bg-white rounded-xl border-[3px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-brutal-sm"
					>
						<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
				</button>
			</div>
		{/if}
	{/if}

	<!-- ─── STEP: DONE (WEBHOOK) ─────────────────────────────────────── -->
	{#if currentKey === 'done'}
		{#if hookCreating}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-8 mb-8 text-center"
			>
				<p class="text-sm font-black text-black uppercase tracking-widest">
					Creating your webhook&hellip;
				</p>
			</div>
		{:else if hookCreateError}
			<div
				class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center mb-8"
			>
				<p class="text-sm font-black text-black uppercase tracking-wider mb-2">
					Webhook creation failed
				</p>
				<p class="text-xs font-bold text-gray-500 mb-6 max-w-sm">{hookCreateError}</p>
				<button
					on:click={createHook}
					class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
				>
					Retry
				</button>
			</div>
		{:else if createdHook}
			<!-- Webhook URL + curl -->
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8">
				<div class="flex items-center gap-3 mb-2">
					<div
						class="w-10 h-10 bg-data-green rounded-xl border-[3px] border-black flex items-center justify-center shadow-brutal-sm"
					>
						<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3 class="text-sm font-black text-black uppercase tracking-widest">
						Your webhook is live
					</h3>
				</div>
				<p class="text-xs font-bold text-gray-600 mb-4">
					POST one row of JSON to this URL and it renders (and delivers) automatically.
				</p>
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
					<code
						class="flex-1 min-w-0 truncate bg-gray-100 border-[2px] border-black rounded-lg px-3 py-2 text-xs font-bold text-black"
					>
						{hookUrl}
					</code>
					<button
						on:click={copyHookUrl}
						class="inline-flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wide border-[2px] border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex-shrink-0"
					>
						{hookCopied ? 'Copied!' : 'Copy URL'}
					</button>
				</div>
				<div class="overflow-x-auto">
					<code
						class="block whitespace-nowrap bg-black text-data-green rounded-lg px-3 py-2 text-[11px] font-bold"
					>
						{hookCurl}
					</code>
				</div>
			</div>

			<!-- Send a test event -->
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-8">
				<h3 class="text-sm font-black text-black uppercase tracking-widest mb-2">
					Send a test event
				</h3>
				<p class="text-xs font-bold text-gray-600 mb-4">
					Fires the sample payload above at your webhook straight from this browser.
				</p>
				<button
					on:click={sendTestEvent}
					disabled={testSending}
					class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-60"
				>
					{testSending ? 'Sending…' : 'Send a test event'}
				</button>
				{#if testError}
					<p class="text-xs font-bold text-brand-danger mt-3">{testError}</p>
				{/if}
				{#if testResult}
					{#if testUrl}
						<div class="mt-5 flex flex-col sm:flex-row sm:items-start gap-4">
							<div
								class="w-full sm:w-64 aspect-[4/3] bg-gray-100 rounded-xl border-[3px] border-black overflow-hidden flex-shrink-0"
							>
								<img src={testUrl} alt="Test render" class="w-full h-full object-cover" />
							</div>
							<div class="min-w-0">
								<p class="text-xs font-black text-black uppercase tracking-widest mb-2">
									Rendered file
								</p>
								<a
									href={testUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="block truncate text-xs font-bold text-black underline hover:text-brand-danger"
								>
									{testUrl}
								</a>
							</div>
						</div>
					{:else}
						<div class="mt-5 overflow-x-auto">
							<code
								class="block whitespace-pre bg-gray-100 border-[2px] border-black rounded-lg px-3 py-2 text-[11px] font-bold text-black"
							>
								{JSON.stringify(testResult, null, 2)}
							</code>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Waiting for first event -->
			{#if hookReceived > 0}
				<div
					class="bg-data-green/20 rounded-2xl border-[3px] border-black shadow-brutal-lg p-6 mb-8"
				>
					<div class="flex items-center gap-3 mb-2">
						<span class="w-3 h-3 bg-data-green rounded-full border-[2px] border-black" />
						<h3 class="text-sm font-black text-black uppercase tracking-widest">
							Your webhook is receiving events
						</h3>
					</div>
					<p class="text-xs font-bold text-gray-700 mb-4">
						{hookReceived}
						{hookReceived === 1 ? 'event' : 'events'} received &middot; {hookRendered}
						{hookRendered === 1 ? 'file' : 'files'} rendered
					</p>
					<a
						href="/dashboard/workflows"
						class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
					>
						Go to workflows
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/>
						</svg>
					</a>
				</div>
			{:else}
				<div
					class="bg-white rounded-2xl border-[3px] border-black border-dashed p-6 mb-8 flex items-center gap-4"
				>
					<span
						class="w-3 h-3 bg-brand-accent rounded-full border-[2px] border-black animate-pulse flex-shrink-0"
					/>
					<div>
						<p class="text-sm font-black text-black uppercase tracking-widest">
							Waiting for your first event&hellip;
						</p>
						<p class="text-xs font-bold text-gray-500 mt-1">
							We check every few seconds. Send a test event above or wire this URL into your system.
						</p>
					</div>
				</div>
			{/if}
		{/if}
	{/if}

	<!-- Back / Next navigation -->
	<div class="flex items-center justify-between border-t-[3px] border-black pt-6">
		<button
			on:click={prevStep}
			disabled={step === 1}
			class="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black shadow-brutal-md hover:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-brutal-md disabled:hover:translate-x-0 disabled:hover:translate-y-0"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M7 16l-4-4m0 0l4-4m-4 4h18"
				/>
			</svg>
			Back
		</button>
		{#if step < steps.length}
			<button
				on:click={nextStep}
				disabled={!stepValidity[step]}
				class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide border-[3px] border-black shadow-brutal-md hover:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-brutal-md disabled:hover:translate-x-0 disabled:hover:translate-y-0"
			>
				{steps[step]?.key === 'done' ? 'Create webhook' : 'Next'}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M17 8l4 4m0 0l-4 4m4-4H3"
					/>
				</svg>
			</button>
		{/if}
	</div>
</section>
