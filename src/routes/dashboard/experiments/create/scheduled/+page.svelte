<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		createExperimentAction,
		startExperimentAction,
		updateExperimentAction,
		checkSlugAction,
		experimentLoading
	} from '../../../../../store/experiments.store';
	import { toast } from '../../../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import { analytics } from '$lib/analytics.js';
	import { getTemplatesAction, templates } from '../../../../../store/template.store';
	import { getTemplateById } from '../../../../../api/template';
	import WizardStepper from '$lib/components/dashboard/WizardStepper.svelte';
	import ScheduleEditor from '$lib/components/experiments/ScheduleEditor.svelte';
	import IntegrationPreview from '$lib/components/experiments/IntegrationPreview.svelte';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import VariableEditor from '$lib/components/experiments/VariableEditor.svelte';
	import VariantPreview from '$lib/components/experiments/VariantPreview.svelte';

	// ============== Wizard State ==============

	const wizardSteps = [
		{ id: 'basics', label: 'Basics' },
		{ id: 'variants', label: 'Variants' },
		{ id: 'schedule', label: 'Schedule' },
		{ id: 'launch', label: 'Launch' }
	];
	let currentStep = 'basics';

	// ============== Edit Mode ==============

	let isEditMode = false;
	let editExperimentUid = null;

	// ============== Form State ==============

	let form = {
		type: 'scheduled',
		name: '',
		slug: '',
		outputConfig: { format: 'png', quality: 90 },
		goalConfig: { type: 'impressions_only', destinationUrl: '' },
		expiresAt: '',
		fallbackImageUrl: '',
		variants: [
			{
				id: 'default',
				name: 'Default',
				weight: 5000,
				isDefault: true,
				variables: {},
				templateUid: '',
				schedule: { startAt: null, endAt: null }
			},
			{
				id: 'variant-b',
				name: 'Scheduled B',
				weight: 5000,
				isDefault: false,
				variables: {},
				templateUid: '',
				schedule: { startAt: null, endAt: null }
			}
		]
	};

	let slugStatus = '';
	let slugTimeout;
	let isSubmitting = false;
	let templateList = [];

	// Variable editor state per variant
	let variantVarEditors = form.variants.map(() => []);

	// Template variable definitions cache
	let templateVarCache = {};
	let templateDataCache = {};

	// Drawer state per variant
	let expandedVariants = {};

	// ============== Humanize Variable Names ==============

	function humanizeVarName(rawKey) {
		let name = rawKey;
		name = name.replace(
			/^(RECT_OBJ_|TEXT_OBJ_|IMAGE_OBJ_|GROUP_OBJ_|CIRCLE_OBJ_|PATH_OBJ_|I-TEXT_)/i,
			''
		);
		name = name.replace(/_[A-Z0-9]{6,}$/i, '');
		name = name.replace(/\d{13,}/g, '');
		name = name.replace(/_+/g, ' ').trim();
		if (!name) return rawKey;
		return name.replace(/\b\w/g, (c) => c.toUpperCase());
	}

	// ============== Definitions ==============

	const outputFormats = [
		{ value: 'png', label: 'PNG', desc: 'Lossless, best for text & graphics' },
		{ value: 'jpeg', label: 'JPEG', desc: 'Smaller size, great for photos' },
		{ value: 'webp', label: 'WebP', desc: 'Modern format, best compression' }
	];

	// ============== Derived Values ==============

	$: slugRegex = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
	$: slugDisplay = form.slug || 'your-slug';
	$: previewUrl = `pictify.io/s/${slugDisplay}.${form.outputConfig.format}`;

	$: canGoStep2 = form.name.trim() !== '';
	$: canGoStep3 = canGoStep2 && form.variants.every((v) => v.templateUid !== '');

	$: effectiveCanSubmit =
		form.name.trim() !== '' &&
		form.slug.trim() !== '' &&
		(isEditMode
			? slugStatus === 'available' || slugStatus === 'existing'
			: slugStatus === 'available') &&
		!isSubmitting &&
		form.variants.every((v) => v.templateUid !== '');

	let unsubscribeTemplates;

	// ============== Lifecycle ==============

	onMount(async () => {
		unsubscribeTemplates = templates.subscribe((value) => {
			templateList = value || [];
		});
		await getTemplatesAction({ limit: 100 });

		const editUid = $page.url.searchParams.get('edit');
		if (editUid) {
			await loadExperimentForEdit(editUid);
		}
	});

	onDestroy(() => {
		if (slugTimeout) clearTimeout(slugTimeout);
		if (unsubscribeTemplates) unsubscribeTemplates();
	});

	// ============== Edit Mode ==============

	async function loadExperimentForEdit(uid) {
		try {
			const { getExperiment } = await import('../../../../../api/experiments');
			const response = await getExperiment(uid);
			if (!response?.experiment) {
				toast.set({ message: 'Experiment not found', type: 'error' });
				goto('/dashboard/experiments');
				return;
			}

			const exp = response.experiment;
			if (exp.type !== 'scheduled') {
				toast.set({ message: 'This experiment is not a scheduled type', type: 'error' });
				goto('/dashboard/experiments');
				return;
			}

			isEditMode = true;
			editExperimentUid = exp.uid;

			form = {
				type: 'scheduled',
				name: exp.name || '',
				slug: exp.slug || '',
				outputConfig: exp.outputConfig || { format: 'png', quality: 90 },
				goalConfig: exp.goalConfig || { type: 'impressions_only', destinationUrl: '' },
				expiresAt: exp.expiresAt || '',
				fallbackImageUrl: exp.fallbackImageUrl || '',
				variants: (exp.variants || []).map((v) => ({
					id: v.id,
					name: v.name || '',
					weight: v.weight || 0,
					isDefault: v.isDefault || false,
					variables: v.variables || {},
					templateUid: v.templateUid || exp.templateUid || '',
					schedule: v.schedule || {
						startAt: null,
						endAt: null,
						recurrence: { type: 'none', cronExpression: '', timezone: 'UTC' }
					}
				}))
			};

			variantVarEditors = form.variants.map((v) => {
				const vars = v.variables || {};
				return Object.entries(vars).map(([key, value]) => ({ key, value: String(value) }));
			});

			slugStatus = 'existing';

			for (const v of form.variants) {
				if (v.templateUid) {
					await fetchTemplateVariables(v.templateUid);
				}
			}

			for (let i = 0; i < form.variants.length; i++) {
				const tplUid = form.variants[i].templateUid;
				if (!tplUid) continue;
				const vars = getTemplateVars(tplUid);
				if (vars.length > 0) {
					populateVarEditorFromTemplate(i, vars);
				}
			}
		} catch (err) {
			toast.set({ message: 'Failed to load experiment', type: 'error' });
		}
	}

	// ============== Template Variable Functions ==============

	async function fetchTemplateVariables(templateUid) {
		if (!templateUid || templateVarCache[templateUid]) return;

		try {
			const response = await getTemplateById(templateUid);
			if (response?.template) {
				const tpl = response.template;
				const varDefs = [];

				if (tpl.variableDefinitions && tpl.variableDefinitions.length > 0) {
					for (const vd of tpl.variableDefinitions) {
						varDefs.push({
							name: vd.name,
							type: vd.type || 'text',
							defaultValue: vd.defaultValue ?? '',
							description: vd.description || ''
						});
					}
				} else if (tpl.variables && Array.isArray(tpl.variables) && tpl.variables.length > 0) {
					for (const v of tpl.variables) {
						const name = typeof v === 'string' ? v : v.name || '';
						if (name) {
							varDefs.push({ name, type: 'text', defaultValue: '', description: '' });
						}
					}
				}

				templateVarCache[templateUid] = varDefs;
				templateVarCache = templateVarCache;

				if (tpl.fabricJSData) {
					templateDataCache[templateUid] = {
						fabricJSData: tpl.fabricJSData,
						width: tpl.width || tpl.fabricJSData?.width || 800,
						height: tpl.height || tpl.fabricJSData?.height || 600
					};
				}
			}
		} catch (err) {
			/* ignored */
		}
	}

	function getTemplateVars(templateUid) {
		return templateVarCache[templateUid] || [];
	}

	async function handleVariantTemplateSelect(variantIndex) {
		const templateUid = form.variants[variantIndex].templateUid;
		if (templateUid) {
			await fetchTemplateVariables(templateUid);
			const vars = getTemplateVars(templateUid);
			if (vars.length > 0) {
				populateVarEditorFromTemplate(variantIndex, vars);
			}
		}
		form.variants = form.variants;
	}

	function populateVarEditorFromTemplate(variantIndex, templateVars) {
		const existingEditor = variantVarEditors[variantIndex] || [];
		const existingMap = new Map(existingEditor.map((r) => [r.key, r.value]));

		const newRows = templateVars.map((tv) => ({
			key: tv.name,
			value: existingMap.has(tv.name)
				? existingMap.get(tv.name)
				: tv.defaultValue != null
				? String(tv.defaultValue)
				: ''
		}));
		variantVarEditors[variantIndex] = newRows;
		variantVarEditors = variantVarEditors;
		syncVarsFromEditor(variantIndex);
	}

	function syncVarsFromEditor(variantIndex) {
		const editor = variantVarEditors[variantIndex] || [];
		const vars = {};
		for (const row of editor) {
			if (row.key) vars[row.key] = row.value;
		}
		form.variants[variantIndex].variables = vars;
		form.variants = form.variants;
	}

	// ============== Slug Functions ==============

	function generateSlug(name) {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 60);
	}

	function handleNameInput(e) {
		form.name = e.target.value;
		if (!isEditMode) {
			form.slug = generateSlug(form.name);
			checkSlugDebounced(form.slug);
		}
	}

	function handleSlugInput(e) {
		form.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
		checkSlugDebounced(form.slug);
	}

	function checkSlugDebounced(slug) {
		if (slugTimeout) clearTimeout(slugTimeout);
		if (!slug || slug.length < 3) {
			slugStatus = '';
			return;
		}
		slugStatus = 'checking';
		slugTimeout = setTimeout(async () => {
			const result = await checkSlugAction(slug);
			if (result !== null) {
				slugStatus = result.available ? 'available' : 'taken';
			}
		}, 400);
	}

	// ============== Variant Management ==============

	let nextVariantNum = 3;

	function addVariant() {
		const id = `variant-${Date.now()}`;
		form.variants = [
			...form.variants,
			{
				id,
				name: `Scheduled ${String.fromCharCode(64 + nextVariantNum)}`,
				weight: 0,
				isDefault: false,
				variables: {},
				templateUid: '',
				schedule: { startAt: null, endAt: null }
			}
		];
		nextVariantNum++;
		variantVarEditors = [...variantVarEditors, []];
		// Redistribute weights evenly
		redistributeWeights();
	}

	function removeVariant(index) {
		if (form.variants.length <= 2) return;
		form.variants = form.variants.filter((_, i) => i !== index);
		variantVarEditors = variantVarEditors.filter((_, i) => i !== index);
		redistributeWeights();
	}

	function redistributeWeights() {
		const count = form.variants.length;
		const baseWeight = Math.floor(10000 / count);
		const remainder = 10000 - baseWeight * count;
		form.variants = form.variants.map((v, i) => ({
			...v,
			weight: baseWeight + (i === 0 ? remainder : 0)
		}));
	}

	// ============== Submit ==============

	async function handleSubmit(startAfterCreate = false) {
		if (!effectiveCanSubmit) return;
		isSubmitting = true;

		try {
			const payload = {
				type: 'scheduled',
				name: form.name.trim(),
				slug: form.slug.trim(),
				outputConfig: { ...form.outputConfig },
				goalConfig: { ...form.goalConfig },
				expiresAt: form.expiresAt || null,
				fallbackImageUrl: form.fallbackImageUrl || null,
				variants: form.variants.map((v) => ({
					id: v.id,
					name: v.name.trim(),
					weight: parseInt(v.weight) || 0,
					isDefault: v.isDefault,
					variables: v.variables || {},
					templateUid: v.templateUid,
					schedule: v.schedule || null
				}))
			};

			if (isEditMode && editExperimentUid) {
				// Strip immutable fields for updates
				delete payload.type;
				const updated = await updateExperimentAction(editExperimentUid, payload);
				if (updated?.uid) {
					if (startAfterCreate) {
						try {
							await startExperimentAction(updated.uid);
							toast.set({ message: 'Scheduled experiment updated and launched!', type: 'success' });
						} catch {
							toast.set({ message: 'Updated but failed to launch.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Scheduled experiment updated!', type: 'success' });
					}
					goto(`/dashboard/experiments/${updated.uid}`);
				} else {
					toast.set({ message: 'Failed to update.', type: 'error' });
				}
			} else {
				const created = await createExperimentAction(payload);
				if (created?.uid) {
					analytics.trackExperimentCreated({ type: 'scheduled', variant_count: payload.variants?.length || 2 });
					analytics.trackExperimentWizardCompleted({ type: 'scheduled' });
					if (startAfterCreate) {
						try {
							await startExperimentAction(created.uid);
							analytics.trackExperimentStarted({ type: 'scheduled', uid: created.uid });
							toast.set({ message: 'Scheduled experiment created and launched!', type: 'success' });
						} catch {
							toast.set({ message: 'Created but failed to launch.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Saved as draft!', type: 'success' });
					}
					goto(`/dashboard/experiments/${created.uid}`);
				} else {
					toast.set({ message: 'Failed to create.', type: 'error' });
				}
			}
		} catch (err) {
			toast.set({ message: err?.message || 'Something went wrong.', type: 'error' });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Toast />

<div class="max-w-5xl mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<a
			href="/dashboard/experiments"
			class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors mb-4"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			Back to Experiments
		</a>
		<h1 class="text-3xl font-black text-gray-900">
			{isEditMode ? 'Edit Scheduled Experiment' : 'Create Scheduled Experiment'}
		</h1>
		<p class="text-sm font-bold text-gray-500 mt-2">
			Schedule different images for different time periods. Set start and end dates per variant.
		</p>
	</div>

	<!-- Wizard Stepper -->
	<WizardStepper steps={wizardSteps} bind:currentStep />

	<!-- Step 1: Basics -->
	{#if currentStep === 'basics'}
		<div class="mt-8 space-y-6">
			<div
				class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] p-6 space-y-5"
			>
				<h3 class="text-sm font-black uppercase tracking-widest text-gray-900">Basic Setup</h3>

				<!-- Name -->
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>Experiment Name</label
					>
					<input
						type="text"
						value={form.name}
						on:input={handleNameInput}
						placeholder="e.g. Holiday Banner Schedule"
						class="w-full px-4 py-3 border-[3px] border-black rounded-xl text-sm font-bold bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:border-[#ffc480] transition-all"
					/>
				</div>

				<!-- Slug -->
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>URL Slug</label
					>
					<div class="flex items-center gap-3">
						<input
							type="text"
							value={form.slug}
							on:input={handleSlugInput}
							placeholder="holiday-banner"
							class="flex-1 px-4 py-3 border-[3px] border-black rounded-xl text-sm font-bold font-mono bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:border-[#ffc480] transition-all"
						/>
						{#if slugStatus === 'checking'}
							<span class="text-xs font-bold text-gray-400">Checking...</span>
						{:else if slugStatus === 'available'}
							<span class="text-xs font-bold text-green-600 flex items-center gap-1">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
								Available
							</span>
						{:else if slugStatus === 'taken'}
							<span class="text-xs font-bold text-red-600">Taken</span>
						{/if}
					</div>
					<p class="text-[10px] font-bold text-gray-400 mt-1.5">
						Public URL: <span class="font-mono text-gray-600">{previewUrl}</span>
					</p>
				</div>

				<!-- Output Format -->
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>Output Format</label
					>
					<div class="flex gap-3">
						{#each outputFormats as fmt}
							<button
								type="button"
								on:click={() => (form.outputConfig.format = fmt.value)}
								class="flex-1 p-3 border-[3px] rounded-xl text-center transition-all cursor-pointer
									{form.outputConfig.format === fmt.value
									? 'border-[#ffc480] bg-[#ffc480]/10 shadow-[4px_4px_0_0_#ffc480]'
									: 'border-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px]'}"
							>
								<span class="text-sm font-black">{fmt.label}</span>
								<p class="text-[9px] font-bold text-gray-500 mt-0.5">{fmt.desc}</p>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Next button -->
			<div class="flex justify-end">
				<button
					type="button"
					disabled={!canGoStep2}
					on:click={() => (currentStep = 'variants')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-[#ffc480] shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next: Variants
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 2: Variants -->
	{#if currentStep === 'variants'}
		<div class="mt-8 space-y-6">
			{#each form.variants as variant, i}
				<div
					class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] overflow-hidden"
				>
					<!-- Variant header -->
					<div
						class="flex items-center justify-between px-5 py-3 border-b-[3px] border-gray-200 bg-gray-50"
					>
						<div class="flex items-center gap-3">
							<span class="text-sm font-black text-gray-900">{variant.name}</span>
							{#if variant.isDefault}
								<span
									class="text-[9px] font-black uppercase tracking-widest bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md border border-gray-300"
									>Default</span
								>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								on:click={() => (expandedVariants[i] = !expandedVariants[i])}
								class="p-2 text-gray-400 hover:text-gray-900 transition-colors"
							>
								<svg
									class="w-4 h-4 transition-transform {expandedVariants[i] ? 'rotate-180' : ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{#if !variant.isDefault && form.variants.length > 2}
								<button
									type="button"
									on:click={() => removeVariant(i)}
									class="p-2 text-gray-300 hover:text-red-600 transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</div>

					<!-- Variant body -->
					<div class="p-5 space-y-4" class:hidden={!expandedVariants[i] && i > 0}>
						<!-- Variant Name -->
						<div>
							<label
								class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
								>Variant Name</label
							>
							<input
								type="text"
								bind:value={variant.name}
								class="w-full px-3 py-2.5 border-[3px] border-black rounded-xl text-sm font-bold bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:border-[#ffc480] transition-all"
							/>
						</div>

						<!-- Template Selection -->
						<div>
							<label
								class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
								>Template</label
							>
							<TemplateSelector
								bind:value={variant.templateUid}
								on:change={() => handleVariantTemplateSelect(i)}
							/>
						</div>

						<!-- Variable Editor -->
						{#if variant.templateUid && getTemplateVars(variant.templateUid).length > 0}
							<div>
								<label
									class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
									>Variables</label
								>
								<VariableEditor
									bind:rows={variantVarEditors[i]}
									templateVars={getTemplateVars(variant.templateUid)}
									{humanizeVarName}
									on:change={() => syncVarsFromEditor(i)}
								/>
							</div>
						{/if}

						<!-- Preview -->
						{#if variant.templateUid && templateDataCache[variant.templateUid]}
							<VariantPreview
								templateUid={variant.templateUid}
								variables={variant.variables}
								{templateDataCache}
								variantName={variant.name}
							/>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Add variant button -->
			<button
				type="button"
				on:click={addVariant}
				class="w-full px-4 py-3 border-[3px] border-dashed border-gray-300 rounded-xl text-sm font-black text-gray-400 hover:border-black hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Variant
			</button>

			<!-- Navigation -->
			<div class="flex justify-between">
				<button
					type="button"
					on:click={() => (currentStep = 'basics')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px] transition-all"
				>
					Back
				</button>
				<button
					type="button"
					disabled={!canGoStep3}
					on:click={() => (currentStep = 'schedule')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-[#ffc480] shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next: Schedule
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Schedule -->
	{#if currentStep === 'schedule'}
		<div class="mt-8 space-y-6">
			<ScheduleEditor
				bind:variants={form.variants}
				bind:expiresAt={form.expiresAt}
				bind:fallbackImageUrl={form.fallbackImageUrl}
			/>

			<!-- Navigation -->
			<div class="flex justify-between">
				<button
					type="button"
					on:click={() => (currentStep = 'variants')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px] transition-all"
				>
					Back
				</button>
				<button
					type="button"
					on:click={() => (currentStep = 'launch')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-[#ffc480] shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all"
				>
					Next: Launch
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 4: Launch -->
	{#if currentStep === 'launch'}
		<div class="mt-8 space-y-6">
			<!-- Goal Config -->
			<div
				class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] p-6 space-y-5"
			>
				<h3 class="text-sm font-black uppercase tracking-widest text-gray-900">Goal & Tracking</h3>

				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>Goal Type</label
					>
					<div class="flex gap-3">
						<button
							type="button"
							on:click={() => (form.goalConfig.type = 'impressions_only')}
							class="flex-1 p-3 border-[3px] rounded-xl text-center transition-all cursor-pointer
								{form.goalConfig.type === 'impressions_only'
								? 'border-[#ffc480] bg-[#ffc480]/10 shadow-[4px_4px_0_0_#ffc480]'
								: 'border-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px]'}"
						>
							<span class="text-sm font-black">Views Only</span>
							<p class="text-[9px] font-bold text-gray-500 mt-0.5">Track impressions</p>
						</button>
						<button
							type="button"
							on:click={() => (form.goalConfig.type = 'click_through')}
							class="flex-1 p-3 border-[3px] rounded-xl text-center transition-all cursor-pointer
								{form.goalConfig.type === 'click_through'
								? 'border-[#ffc480] bg-[#ffc480]/10 shadow-[4px_4px_0_0_#ffc480]'
								: 'border-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px]'}"
						>
							<span class="text-sm font-black">Click-through</span>
							<p class="text-[9px] font-bold text-gray-500 mt-0.5">Track clicks + views</p>
						</button>
					</div>
				</div>

				{#if form.goalConfig.type === 'click_through'}
					<div>
						<label
							class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
							>Destination URL</label
						>
						<input
							type="url"
							bind:value={form.goalConfig.destinationUrl}
							placeholder="https://yoursite.com/landing-page"
							class="w-full px-4 py-3 border-[3px] border-black rounded-xl text-sm font-bold font-mono bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:border-[#ffc480] transition-all placeholder:text-gray-300 placeholder:font-sans"
						/>
					</div>
				{/if}
			</div>

			<!-- Integration Preview -->
			<IntegrationPreview
				slug={form.slug}
				format={form.outputConfig.format}
				goalType={form.goalConfig.type}
				destinationUrl={form.goalConfig.destinationUrl}
			/>

			<!-- Summary -->
			<div class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] p-6">
				<h3 class="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Summary</h3>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
					<div class="p-3 bg-gray-50 rounded-xl border-[2px] border-gray-200">
						<p class="text-2xl font-black text-gray-900">{form.variants.length}</p>
						<p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Variants</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-xl border-[2px] border-gray-200">
						<p class="text-2xl font-black text-gray-900">
							{form.variants.filter((v) => v.schedule?.startAt).length}
						</p>
						<p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Scheduled</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-xl border-[2px] border-gray-200">
						<p class="text-2xl font-black text-gray-900">
							{form.outputConfig.format.toUpperCase()}
						</p>
						<p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Format</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-xl border-[2px] border-gray-200">
						<p class="text-2xl font-black text-gray-900">{form.expiresAt ? 'Yes' : 'No'}</p>
						<p class="text-[9px] font-black uppercase tracking-widest text-gray-500">Expiry Set</p>
					</div>
				</div>
			</div>

			<!-- Navigation & Submit -->
			<div class="flex justify-between">
				<button
					type="button"
					on:click={() => (currentStep = 'schedule')}
					class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-white shadow-[2px_2px_0_0_black] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[1px] transition-all"
				>
					Back
				</button>
				<div class="flex gap-3">
					<button
						type="button"
						disabled={!effectiveCanSubmit}
						on:click={() => handleSubmit(false)}
						class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-white shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isEditMode ? 'Update Draft' : 'Save Draft'}
					</button>
					<button
						type="button"
						disabled={!effectiveCanSubmit}
						on:click={() => handleSubmit(true)}
						class="px-6 py-3 border-[3px] border-black rounded-xl text-sm font-black bg-[#4ade80] shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<svg class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
						{/if}
						{isEditMode ? 'Update & Launch' : 'Create & Launch'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
