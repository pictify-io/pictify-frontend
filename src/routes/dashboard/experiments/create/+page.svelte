<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		createExperimentAction,
		startExperimentAction,
		updateExperimentAction,
		checkSlugAction,
		experimentLoading,
	} from '../../../../store/experiments.store';
	import { toast } from '../../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import { user } from '../../../../store/user.store';
	import { getTemplatesAction, getTemplateAction, templates } from '../../../../store/template.store';
	import { getTemplateById } from '../../../../api/template';
	import { StaticCanvas } from 'fabric';
	import WizardStepper from '$lib/components/dashboard/WizardStepper.svelte';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';

	// ============== Wizard State ==============

	const wizardSteps = [
		{ id: 'setup', label: 'Setup' },
		{ id: 'variants', label: 'Variants' },
		{ id: 'launch', label: 'Goal & Launch' },
	];
	let currentStep = 'setup';

	// ============== Edit Mode ==============

	let isEditMode = false;
	let editExperimentUid = null;

	// ============== Form State ==============

	let form = {
		type: 'ab_test',
		name: '',
		slug: '',
		hypothesis: '',
		testMode: 'same_template', // 'same_template' | 'different_templates'
		templateUid: '', // shared template (same_template mode)
		outputConfig: { format: 'png', quality: 90 },
		goalConfig: { type: 'impressions_only', destinationUrl: '' },
		variants: [
			{ id: 'control', name: 'Control', weight: 5000, isDefault: true, variables: {}, templateUid: '', conditions: { operator: 'AND', rules: [] }, priority: 0 },
			{ id: 'variant-b', name: 'Variant B', weight: 5000, isDefault: false, variables: {}, templateUid: '', conditions: { operator: 'AND', rules: [] }, priority: 1 },
		],
	};

	let slugStatus = '';
	let slugTimeout;
	let isSubmitting = false;
	let templateList = [];
	let showAdvanced = false;

	// Variable editor state per variant (key-value pairs)
	let variantVarEditors = form.variants.map(() => []);

	// Template variable definitions cache (keyed by templateUid)
	let templateVarCache = {};
	let templateDataCache = {}; // { [uid]: { fabricJSData, width, height } }

	// Live preview state per variant (keyed by variant index)
	let variantPreviews = {}; // { [index]: { url, loading, error } }
	let previewTimeouts = {}; // debounce timers per variant

	// ============== Definitions ==============

	const outputFormats = [
		{ value: 'png', label: 'PNG', desc: 'Lossless, best for text & graphics' },
		{ value: 'jpeg', label: 'JPEG', desc: 'Smaller size, great for photos' },
		{ value: 'webp', label: 'WebP', desc: 'Modern format, best compression' },
	];

	const quickSplits = [
		{ label: 'Equal', fn: () => distributeWeightsEqually() },
		{ label: '70 / 30', fn: () => setWeights([7000, 3000]) },
		{ label: '80 / 20', fn: () => setWeights([8000, 2000]) },
	];

	// ============== Derived Values ==============

	$: totalWeight = form.variants.reduce((sum, v) => sum + (parseInt(v.weight) || 0), 0);
	$: weightIsValid = totalWeight === 10000;
	$: slugRegex = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
	$: slugDisplay = form.slug || 'your-slug';
	$: previewUrl = `pictify.io/s/${slugDisplay}.${form.outputConfig.format}`;
	$: clickTrackUrl = `pictify.io/s/${slugDisplay}/click`;
	$: pixelUrl = `pictify.io/s/${slugDisplay}/pixel.gif`;

	$: canGoStep2 = form.name.trim() !== '';

	$: canGoStep3 = (() => {
		if (form.testMode === 'same_template') {
			return form.templateUid !== '' && weightIsValid;
		} else {
			const allHaveTemplate = form.variants.every(v => v.templateUid !== '');
			return allHaveTemplate && weightIsValid;
		}
	})();

	$: canSubmit =
		form.name.trim() !== '' &&
		form.slug.trim() !== '' &&
		slugStatus === 'available' &&
		weightIsValid &&
		!isSubmitting &&
		(form.goalConfig.type !== 'click_through' || form.goalConfig.destinationUrl.trim() !== '') &&
		(form.testMode === 'same_template' ? form.templateUid !== '' : form.variants.every(v => v.templateUid !== ''));

	// In edit mode, slug is already set, so allow it
	$: canSubmitEdit =
		form.name.trim() !== '' &&
		form.slug.trim() !== '' &&
		(slugStatus === 'available' || slugStatus === 'existing') &&
		weightIsValid &&
		!isSubmitting &&
		(form.goalConfig.type !== 'click_through' || form.goalConfig.destinationUrl.trim() !== '') &&
		(form.testMode === 'same_template' ? form.templateUid !== '' : form.variants.every(v => v.templateUid !== ''));

	$: effectiveCanSubmit = isEditMode ? canSubmitEdit : canSubmit;

	// Get the available template variables for a given template UID
	$: activeTemplateUid = form.testMode === 'same_template' ? form.templateUid : null;

	let unsubscribeTemplates;

	// ============== Lifecycle ==============

	onMount(async () => {
		unsubscribeTemplates = templates.subscribe((value) => {
			templateList = value || [];
		});
		await getTemplatesAction({ limit: 100 });

		// Check if editing an existing experiment
		const editUid = $page.url.searchParams.get('edit');
		if (editUid) {
			await loadExperimentForEdit(editUid);
		}
	});

	onDestroy(() => {
		if (slugTimeout) clearTimeout(slugTimeout);
		if (unsubscribeTemplates) unsubscribeTemplates();
		Object.values(previewTimeouts).forEach(t => clearTimeout(t));
	});

	// ============== Edit Mode Functions ==============

	async function loadExperimentForEdit(uid) {
		try {
			const { getExperiment } = await import('../../../../api/experiments');
			const response = await getExperiment(uid);
			if (!response?.experiment) {
				toast.set({ message: 'Experiment not found', type: 'error' });
				goto('/dashboard/experiments');
				return;
			}

			const exp = response.experiment;
			isEditMode = true;
			editExperimentUid = exp.uid;

			// Detect test mode
			const hasDifferentTemplates = exp.variants?.some(v => v.templateUid);
			const testMode = hasDifferentTemplates ? 'different_templates' : 'same_template';

			form = {
				type: exp.type || 'ab_test',
				name: exp.name || '',
				slug: exp.slug || '',
				hypothesis: exp.hypothesis || '',
				testMode,
				templateUid: exp.templateUid || '',
				outputConfig: exp.outputConfig || { format: 'png', quality: 90 },
				goalConfig: exp.goalConfig || { type: 'impressions_only', destinationUrl: '' },
				variants: (exp.variants || []).map((v, i) => ({
					id: v.id,
					name: v.name || '',
					weight: v.weight || 5000,
					isDefault: v.isDefault || false,
					variables: v.variables || {},
					templateUid: v.templateUid || '',
					conditions: v.conditions || { operator: 'AND', rules: [] },
					priority: v.priority ?? i,
				})),
			};

			// Build variable editors from existing variables
			variantVarEditors = form.variants.map(v => {
				const vars = v.variables || {};
				return Object.entries(vars).map(([key, value]) => ({ key, value: String(value) }));
			});

			// Mark slug as existing (it's already saved)
			slugStatus = 'existing';

			// Pre-fetch template variable definitions and canvas data
			if (form.templateUid) {
				await fetchTemplateVariables(form.templateUid);
			}
			for (const v of form.variants) {
				if (v.templateUid) {
					await fetchTemplateVariables(v.templateUid);
				}
			}

			// Merge template variable definitions into existing editors
			// (editors were built from saved variables above, but template may have added new vars)
			for (let i = 0; i < form.variants.length; i++) {
				const tplUid = form.testMode === 'different_templates'
					? form.variants[i].templateUid
					: form.templateUid;
				if (!tplUid) continue;
				const vars = getTemplateVars(tplUid);
				if (vars.length > 0) {
					populateVarEditorFromTemplate(i, vars);
				}
			}
		} catch (err) {
			console.error('Failed to load experiment for editing:', err);
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
				// Combine both legacy variables array and new variableDefinitions
				const varDefs = [];

				if (tpl.variableDefinitions && tpl.variableDefinitions.length > 0) {
					for (const vd of tpl.variableDefinitions) {
						varDefs.push({
							name: vd.name,
							type: vd.type || 'text',
							defaultValue: vd.defaultValue ?? '',
							description: vd.description || '',
						});
					}
				} else if (tpl.variables && Array.isArray(tpl.variables) && tpl.variables.length > 0) {
					// Legacy variables: simple string array
					for (const v of tpl.variables) {
						const name = typeof v === 'string' ? v : v.name || '';
						if (name) {
							varDefs.push({
								name,
								type: 'text',
								defaultValue: '',
								description: '',
							});
						}
					}
				}

				templateVarCache[templateUid] = varDefs;
				templateVarCache = templateVarCache; // trigger reactivity

				// Cache fabricJSData for client-side preview
				if (tpl.fabricJSData) {
					templateDataCache[templateUid] = {
						fabricJSData: tpl.fabricJSData,
						width: tpl.width || tpl.fabricJSData?.width || 800,
						height: tpl.height || tpl.fabricJSData?.height || 600,
					};
				}
			}
		} catch (err) {
			console.error('Failed to fetch template variables:', err);
		}
	}

	function getTemplateVars(templateUid) {
		return templateVarCache[templateUid] || [];
	}

	// When shared template is selected (same_template mode)
	async function handleSharedTemplateSelect() {
		if (form.templateUid) {
			await fetchTemplateVariables(form.templateUid);
			// Auto-populate variable editors for all variants and trigger previews
			const vars = getTemplateVars(form.templateUid);
			for (let i = 0; i < form.variants.length; i++) {
				if (vars.length > 0) {
					populateVarEditorFromTemplate(i, vars);
				}
				triggerPreview(i);
			}
		}
	}

	// When per-variant template is selected (different_templates mode)
	async function handleVariantTemplateSelect(variantIndex) {
		const templateUid = form.variants[variantIndex].templateUid;
		if (templateUid) {
			await fetchTemplateVariables(templateUid);
			const vars = getTemplateVars(templateUid);
			if (vars.length > 0) {
				populateVarEditorFromTemplate(variantIndex, vars);
			}
			triggerPreview(variantIndex);
		}
		form.variants = form.variants; // trigger reactivity
	}

	function populateVarEditorFromTemplate(variantIndex, templateVars) {
		const existingEditor = variantVarEditors[variantIndex] || [];
		const existingMap = new Map(existingEditor.map(r => [r.key, r.value]));

		// Build rows for ALL template variables, preserving existing values
		const newRows = templateVars.map(tv => ({
			key: tv.name,
			value: existingMap.has(tv.name) ? existingMap.get(tv.name) : (tv.defaultValue != null ? String(tv.defaultValue) : ''),
		}));
		variantVarEditors[variantIndex] = newRows;
		variantVarEditors = variantVarEditors;
		syncVarsFromEditor(variantIndex);
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

	function handleNameInput() {
		if (isEditMode) return; // Don't auto-generate slug in edit mode
		const expectedSlug = generateSlug(form.name.slice(0, -1));
		if (!form.slug || form.slug === expectedSlug) {
			form.slug = generateSlug(form.name);
			checkSlug();
		}
	}

	function checkSlug() {
		if (slugTimeout) clearTimeout(slugTimeout);

		if (isEditMode && form.slug === '') {
			slugStatus = 'existing';
			return;
		}

		if (form.slug === '') {
			slugStatus = '';
			return;
		}

		if (!slugRegex.test(form.slug)) {
			slugStatus = 'invalid';
			return;
		}

		slugStatus = 'checking';
		slugTimeout = setTimeout(async () => {
			try {
				const result = await checkSlugAction(form.slug);
				slugStatus = result?.available ? 'available' : 'taken';
			} catch {
				slugStatus = 'taken';
			}
		}, 500);
	}

	// ============== Variant Functions ==============

	function addVariant() {
		const nextLetter = String.fromCharCode(65 + form.variants.length);
		form.variants = [...form.variants, {
			id: `variant-${nextLetter.toLowerCase()}-${Date.now()}`,
			name: `Variant ${nextLetter}`,
			weight: 0,
			isDefault: false,
			variables: {},
			templateUid: '',
			conditions: { operator: 'AND', rules: [] },
			priority: form.variants.length,
		}];
		variantVarEditors = [...variantVarEditors, []];
		distributeWeightsEqually();

		// If shared template is selected, pre-populate new variant's variables
		if (form.testMode === 'same_template' && form.templateUid) {
			const vars = getTemplateVars(form.templateUid);
			if (vars.length > 0) {
				populateVarEditorFromTemplate(form.variants.length - 1, vars);
			}
		}
	}

	function removeVariant(index) {
		if (form.variants.length <= 2) return;
		const removedWasDefault = form.variants[index].isDefault;
		form.variants = form.variants.filter((_, i) => i !== index);
		variantVarEditors = variantVarEditors.filter((_, i) => i !== index);
		if (removedWasDefault && form.variants.length > 0) {
			form.variants[0].isDefault = true;
		}
		distributeWeightsEqually();
	}

	function distributeWeightsEqually() {
		const count = form.variants.length;
		const baseWeight = Math.floor(10000 / count);
		const remainder = 10000 - baseWeight * count;
		form.variants = form.variants.map((v, i) => ({
			...v,
			weight: baseWeight + (i < remainder ? 1 : 0),
		}));
	}

	function setWeights(weights) {
		if (form.variants.length !== weights.length) {
			distributeWeightsEqually();
			return;
		}
		form.variants = form.variants.map((v, i) => ({ ...v, weight: weights[i] }));
	}

	function setDefault(index) {
		form.variants = form.variants.map((v, i) => ({ ...v, isDefault: i === index }));
	}

	// ============== Variable Editor Functions ==============

	function addVarRow(variantIndex) {
		variantVarEditors[variantIndex] = [...(variantVarEditors[variantIndex] || []), { key: '', value: '' }];
		variantVarEditors = variantVarEditors;
	}

	function removeVarRow(variantIndex, rowIndex) {
		variantVarEditors[variantIndex] = variantVarEditors[variantIndex].filter((_, i) => i !== rowIndex);
		variantVarEditors = variantVarEditors;
		syncVarsFromEditor(variantIndex);
	}

	function syncVarsFromEditor(variantIndex) {
		const rows = variantVarEditors[variantIndex] || [];
		const obj = {};
		for (const row of rows) {
			if (row.key.trim()) {
				obj[row.key.trim()] = row.value;
			}
		}
		form.variants[variantIndex].variables = obj;
		form.variants = form.variants;
		triggerPreview(variantIndex);
	}

	function selectVariableFromDropdown(variantIndex, varName, defaultValue) {
		const editors = variantVarEditors[variantIndex] || [];
		const existingKeys = editors.map(r => r.key);
		if (!existingKeys.includes(varName)) {
			variantVarEditors[variantIndex] = [...editors, { key: varName, value: defaultValue != null ? String(defaultValue) : '' }];
			variantVarEditors = variantVarEditors;
			syncVarsFromEditor(variantIndex);
		}
	}

	// ============== Preview ==============

	async function renderVariantPreview(variantIndex) {
		const tplUid = getResolvedTemplateUid(variantIndex);
		if (!tplUid) return;

		const tplData = templateDataCache[tplUid];
		if (!tplData?.fabricJSData) {
			variantPreviews[variantIndex] = { url: null, loading: false, error: 'No canvas data available for this template' };
			variantPreviews = variantPreviews;
			return;
		}

		const variables = form.variants[variantIndex]?.variables || {};

		variantPreviews[variantIndex] = { loading: true, error: null, url: variantPreviews[variantIndex]?.url || null };
		variantPreviews = variantPreviews;

		try {
			// Create offscreen canvas element
			const canvasEl = document.createElement('canvas');
			const width = tplData.width || 800;
			const height = tplData.height || 600;
			canvasEl.width = width;
			canvasEl.height = height;

			const staticCanvas = new StaticCanvas(canvasEl, { width, height });

			// Load the template's Fabric JSON
			await staticCanvas.loadFromJSON(tplData.fabricJSData);

			// Apply variable substitutions on text objects
			const objects = staticCanvas.getObjects();
			for (const obj of objects) {
				// Handle {{ variable }} text interpolation
				if ((obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') && obj.text) {
					if (obj.text.includes('{{')) {
						const processed = obj.text.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, varName) => {
							const val = variables[varName.trim()];
							return val !== undefined && val !== null ? String(val) : match;
						});
						obj.set('text', processed);
					}
				}
				// Handle isVariable bindings
				if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
					for (const binding of obj.variableBindings) {
						if (binding.variableName && variables[binding.variableName] !== undefined) {
							const val = variables[binding.variableName];
							if (binding.property === 'text' && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
								obj.set('text', String(val));
							} else if (binding.property === 'fill') {
								obj.set('fill', String(val));
							}
						}
					}
				}
			}

			staticCanvas.renderAll();

			// Export as data URL
			const dataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 1 });
			variantPreviews[variantIndex] = { url: dataUrl, loading: false, error: null };

			// Cleanup
			staticCanvas.dispose();
		} catch (err) {
			console.error('Preview render failed:', err);
			variantPreviews[variantIndex] = { url: null, loading: false, error: err?.message || 'Preview render failed' };
		}
		variantPreviews = variantPreviews;
	}

	function triggerPreview(variantIndex) {
		if (previewTimeouts[variantIndex]) clearTimeout(previewTimeouts[variantIndex]);
		previewTimeouts[variantIndex] = setTimeout(() => {
			renderVariantPreview(variantIndex);
		}, 300);
	}

	// Initialize variable editors and previews when entering Step 2
	function initStep2Previews() {
		for (let i = 0; i < form.variants.length; i++) {
			const tplUid = getResolvedTemplateUid(i);
			if (!tplUid) continue;

			// Populate variable editors from template definitions if not already populated
			const vars = getTemplateVars(tplUid);
			if (vars.length > 0 && (!variantVarEditors[i] || variantVarEditors[i].length === 0)) {
				populateVarEditorFromTemplate(i, vars);
			}

			// Trigger live preview
			triggerPreview(i);
		}
	}

	// ============== Navigation ==============

	function nextStep() {
		if (currentStep === 'setup' && canGoStep2) {
			if (!form.slug) {
				form.slug = generateSlug(form.name);
				checkSlug();
			}
			currentStep = 'variants';
			// Populate variable editors and trigger live previews for all variants
			initStep2Previews();
		} else if (currentStep === 'variants' && canGoStep3) {
			if (!form.slug) {
				form.slug = generateSlug(form.name);
			}
			if (slugStatus !== 'available' && slugStatus !== 'existing') {
				checkSlug();
			}
			currentStep = 'launch';
		}
	}

	function prevStep() {
		const idx = wizardSteps.findIndex(s => s.id === currentStep);
		if (idx > 0) currentStep = wizardSteps[idx - 1].id;
	}

	// ============== Submit ==============

	async function handleSubmit(startAfterCreate = false) {
		if (!effectiveCanSubmit) return;
		isSubmitting = true;

		try {
			const payload = {
				type: form.type,
				name: form.name.trim(),
				slug: form.slug.trim(),
				hypothesis: form.hypothesis.trim() || undefined,
				outputConfig: { ...form.outputConfig },
				goalConfig: { ...form.goalConfig },
				variants: form.variants.map((v) => ({
					id: v.id,
					name: v.name.trim(),
					weight: parseInt(v.weight),
					isDefault: v.isDefault,
					variables: v.variables || {},
					templateUid: form.testMode === 'different_templates' ? v.templateUid : undefined,
				})),
			};

			if (form.testMode === 'same_template') {
				payload.templateUid = form.templateUid;
			}

			if (isEditMode && editExperimentUid) {
				// Update existing experiment
				const updated = await updateExperimentAction(editExperimentUid, payload);
				if (updated?.uid) {
					if (startAfterCreate) {
						try {
							await startExperimentAction(updated.uid);
							toast.set({ message: 'Experiment updated and started!', type: 'success' });
						} catch {
							toast.set({ message: 'Experiment updated but failed to start.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Experiment updated!', type: 'success' });
					}
					goto(`/dashboard/experiments/${updated.uid}`);
				} else {
					toast.set({ message: 'Failed to update experiment.', type: 'error' });
				}
			} else {
				// Create new experiment
				const created = await createExperimentAction(payload);
				if (created?.uid) {
					if (startAfterCreate) {
						try {
							await startExperimentAction(created.uid);
							toast.set({ message: 'Experiment created and started!', type: 'success' });
						} catch {
							toast.set({ message: 'Experiment created but failed to start.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Experiment created as draft!', type: 'success' });
					}
					goto(`/dashboard/experiments/${created.uid}`);
				} else {
					toast.set({ message: 'Failed to create experiment.', type: 'error' });
				}
			}
		} catch (err) {
			toast.set({ message: err?.message || 'Something went wrong.', type: 'error' });
		} finally {
			isSubmitting = false;
		}
	}

	// ============== Helpers ==============

	function getTemplateName(uid) {
		const t = templateList.find(t => t.uid === uid);
		return t?.name || 'Unknown';
	}

	function getTemplateThumbnail(uid) {
		const t = templateList.find(t => t.uid === uid);
		return t?.thumbnail || null;
	}

	function getResolvedTemplateUid(variantIndex) {
		if (form.testMode === 'different_templates') {
			return form.variants[variantIndex]?.templateUid || '';
		}
		return form.templateUid || '';
	}

	function getAvailableVarsForVariant(variantIndex) {
		const tplUid = getResolvedTemplateUid(variantIndex);
		if (!tplUid) return [];
		const vars = getTemplateVars(tplUid);
		const usedKeys = (variantVarEditors[variantIndex] || []).map(r => r.key);
		return vars.filter(v => !usedKeys.includes(v.name));
	}
</script>

<Toast />

<div class="min-h-full px-4 py-8 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-5xl transition-all duration-300">
		<!-- Back Button -->
		<a
			href={isEditMode ? `/dashboard/experiments/${editExperimentUid}` : '/dashboard/experiments'}
			class="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
		>
			<svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
			</svg>
			{isEditMode ? 'Back to Experiment' : 'Back to Experiments'}
		</a>

		<!-- Page Header -->
		<div class="mb-6">
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				{isEditMode ? 'Edit A/B Test' : 'Create A/B Test'}
			</h1>
			<p class="mt-2 text-sm font-bold text-gray-500">
				{isEditMode ? 'Update your A/B test configuration.' : 'Split traffic randomly between variants to find the best performer.'}
			</p>
		</div>

		<!-- ============== STEPPER ============== -->
		<WizardStepper steps={wizardSteps} {currentStep} on:step={(e) => currentStep = e.detail} />

		<!-- ============== STEP 1: SETUP ============== -->
		{#if currentStep === 'setup'}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
				<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">What are you testing?</h2>
						<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">Foundation</p>
					</div>
				</div>
				<div class="p-6 space-y-6 bg-[#FFFDF8]">
					<!-- Experiment Name -->
					<div>
						<label for="experiment-name" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
							Experiment Name <span class="text-red-500">*</span>
						</label>
						<input
							id="experiment-name"
							type="text"
							bind:value={form.name}
							on:input={handleNameInput}
							placeholder="e.g. Homepage Hero Banner Test"
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#ffc480] focus:shadow-[4px_4px_0_0_#ffc480] placeholder-gray-400 transition-all shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]"
						/>
					</div>

					<!-- Test Mode -->
					<div class="pt-4 border-t-[2px] border-dashed border-gray-200">
						<label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">
							What do you want to compare?
						</label>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<button
								type="button"
								on:click={() => form.testMode = 'same_template'}
								class="text-left p-5 border-[3px] rounded-xl transition-all relative overflow-hidden group
									{form.testMode === 'same_template'
										? 'border-gray-900 bg-[#ffc480]/20 shadow-[6px_6px_0_0_#1f2937] translate-x-[-2px] translate-y-[-2px]'
										: 'border-gray-900 bg-white shadow-[card] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937]'}"
							>
								{#if form.testMode === 'same_template'}
									<div class="absolute top-4 right-4 w-6 h-6 bg-[#ffc480] border-[3px] border-gray-900 rounded-full flex items-center justify-center">
										<div class="w-3 h-3 bg-gray-900 rounded-full"></div>
									</div>
								{:else}
									<div class="absolute top-4 right-4 w-6 h-6 bg-gray-100 border-[3px] border-gray-300 rounded-full flex items-center justify-center border-dashed"></div>
								{/if}
								<div class="flex flex-col items-start gap-4 pr-8">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-[2px]
										{form.testMode === 'same_template' ? 'bg-[#ffc480] border-gray-900 shadow-[2px_2px_0_0_#000] shadow-[inset_2px_2px_0_0_rgba(255,255,255,0.7)]' : 'bg-gray-100 border-gray-300 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]'}">
										<svg class="w-5 h-5 {form.testMode === 'same_template' ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</div>
									<div>
										<div class="text-sm font-black text-gray-900 uppercase tracking-wide">Same Template</div>
										<div class="text-xs text-gray-600 mt-1 font-bold leading-relaxed">
											One template, different data. Test headlines, colors, CTAs by changing variables.
										</div>
									</div>
								</div>
							</button>

							<button
								type="button"
								on:click={() => form.testMode = 'different_templates'}
								class="text-left p-5 border-[3px] rounded-xl transition-all relative overflow-hidden group
									{form.testMode === 'different_templates'
										? 'border-gray-900 bg-[#ffc480]/20 shadow-[6px_6px_0_0_#1f2937] translate-x-[-2px] translate-y-[-2px]'
										: 'border-gray-900 bg-white shadow-[card] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937]'}"
							>
								{#if form.testMode === 'different_templates'}
									<div class="absolute top-4 right-4 w-6 h-6 bg-[#ffc480] border-[3px] border-gray-900 rounded-full flex items-center justify-center">
										<div class="w-3 h-3 bg-gray-900 rounded-full"></div>
									</div>
								{:else}
									<div class="absolute top-4 right-4 w-6 h-6 bg-gray-100 border-[3px] border-gray-300 rounded-full flex items-center justify-center border-dashed"></div>
								{/if}
								<div class="flex flex-col items-start gap-4 pr-8">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-[2px]
										{form.testMode === 'different_templates' ? 'bg-[#ffc480] border-gray-900 shadow-[2px_2px_0_0_#000] shadow-[inset_2px_2px_0_0_rgba(255,255,255,0.7)]' : 'bg-gray-100 border-gray-300 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]'}">
										<svg class="w-5 h-5 {form.testMode === 'different_templates' ? 'text-gray-900' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
										</svg>
									</div>
									<div>
										<div class="text-sm font-black text-gray-900 uppercase tracking-wide">Different Templates</div>
										<div class="text-xs text-gray-600 mt-1 font-bold leading-relaxed">
											Compare completely different designs. Each variant uses its own template.
										</div>
									</div>
								</div>
							</button>
						</div>
					</div>

					<!-- Hypothesis (optional) -->
					<div class="pt-4 border-t-[2px] border-dashed border-gray-200">
						<label for="hypothesis" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center justify-between">
							<span>Hypothesis</span>
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 border-[2px] border-gray-300 px-2 py-1 rounded shadow-[1px_1px_0_0_#d1d5db]">Optional</span>
						</label>
						<textarea
							id="hypothesis"
							bind:value={form.hypothesis}
							placeholder="I believe changing the headline will increase click-through rate by 15%..."
							rows="3"
							class="w-full px-4 py-3 border-[3px] border-gray-300 rounded-xl text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#ffc480] focus:shadow-[4px_4px_0_0_#ffc480] resize-none placeholder-gray-400 transition-all shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]"
						></textarea>
					</div>
				</div>

				<!-- Step 1 Footer -->
				<div class="px-6 py-4 bg-gray-50 border-t-[3px] border-gray-900 flex justify-between items-center">
					<a href={isEditMode ? `/dashboard/experiments/${editExperimentUid}` : '/dashboard/experiments'} class="px-4 py-2.5 text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-wide transition-colors flex items-center gap-2">
						Cancel
					</a>
					<button
						type="button"
						on:click={nextStep}
						disabled={!canGoStep2}
						class="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all border-[2px] flex items-center gap-2
							{canGoStep2
								? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937]'
								: 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed hidden'}"
					>
						Next Step
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- ============== STEP 2: VARIANTS ============== -->
		{#if currentStep === 'variants'}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] overflow-hidden">
				<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">Configure Variants</h2>
						<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">Traffic & Design</p>
					</div>
					<!-- Traffic Split Indicator -->
					<div class="flex flex-col sm:items-end gap-1.5">
						<span class="text-[10px] font-black uppercase tracking-widest {weightIsValid ? 'text-green-600' : 'text-red-500'}">
							Total Allocated: {(totalWeight / 100).toFixed(1)}%
						</span>
						<div class="w-full sm:w-48 h-3 rounded-full overflow-hidden flex shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.1)] border-[2px] {weightIsValid ? 'border-gray-900 bg-gray-100' : 'border-red-400 bg-red-100'}">
							{#each form.variants as variant, idx}
								{#if variant.weight > 0}
									<div
										class="h-full border-r border-[#1f2937]/20 transition-all"
										style="width: {(variant.weight / 100)}%; background-color: {idx === 0 ? '#4ade80' : idx === 1 ? '#ffc480' : idx === 2 ? '#60a5fa' : '#f472b6'};"
										title="{variant.name}: {(variant.weight / 100).toFixed(1)}%"
									></div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
				<div class="p-6 space-y-6 bg-[#FFFDF8]">
					<!-- Shared Template (same_template mode) -->
					{#if form.testMode === 'same_template'}
						<div class="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_0_#1f2937]">
							<label for="template-select" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
								Base Template <span class="text-red-500">*</span>
							</label>
							<TemplateSelector
								bind:value={form.templateUid}
								placeholder="Select a template to test variants on..."
								on:change={handleSharedTemplateSelect}
							/>
							{#if form.templateUid}
								{@const sel = templateList.find(t => t.uid === form.templateUid)}
								{#if sel}
									<div class="mt-4 flex items-center gap-4 p-4 bg-gray-50 border-[3px] border-gray-200 rounded-xl">
										{#if sel.thumbnail}
											<img src={sel.thumbnail} alt={sel.name} class="w-24 h-24 object-contain bg-white rounded-lg border-[2px] border-gray-300 shadow-sm" />
										{:else}
											<div class="w-24 h-24 bg-white rounded-lg border-[2px] border-gray-300 flex items-center justify-center shadow-sm">
												<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										{/if}
										<div>
											<div class="text-sm font-black text-gray-900">{sel.name || 'Untitled'}</div>
											<div class="text-sm font-bold text-gray-500 mt-1">{sel.width || '?'} &times; {sel.height || '?'} px</div>
											{#if getTemplateVars(form.templateUid).length > 0}
												<div class="inline-flex mt-2 items-center px-2 py-1 rounded bg-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700">
													{getTemplateVars(form.templateUid).length} editable variable{getTemplateVars(form.templateUid).length !== 1 ? 's' : ''}
												</div>
											{/if}
										</div>
									</div>
								{/if}
							{/if}
						</div>
					{/if}

					<!-- Traffic Split Quick Actions -->
					<div>
						<label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
							Traffic Split Shortcuts
						</label>
						<div class="flex flex-wrap gap-3">
							{#each quickSplits as qs}
								<button
									type="button"
									on:click={qs.fn}
									class="px-4 py-2 border-[2px] border-gray-900 rounded-lg text-xs font-black text-gray-900 uppercase tracking-wide bg-white shadow-[2px_2px_0_0_#1f2937] hover:bg-[#ffc480] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#1f2937] transition-all"
								>
									{qs.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Weight warning -->
					{#if !weightIsValid}
						<div class="flex items-center gap-3 px-5 py-4 bg-red-50 border-[3px] border-red-500 rounded-xl shadow-[4px_4px_0_0_#ef4444]">
							<svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<p class="text-sm font-black text-red-900 uppercase tracking-tight">
								Weights must add up to 100%. Currently at {(totalWeight / 100).toFixed(1)}%.
							</p>
						</div>
					{/if}

					<!-- Variant Cards — vertical stack -->
					<div class="space-y-6">
						{#each form.variants as variant, index (variant.id)}
							<div class="border-[3px] rounded-xl overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] transition-all relative
								{variant.isDefault ? 'border-[#ffc480] shadow-[6px_6px_0_0_#ffc480]' : 'border-gray-900 shadow-[8px_8px_0_0_#1f2937]'}">
								
								<!-- Background Grid Pattern -->
								<div class="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>

								<!-- Variant Header -->
								<div class="px-6 py-4 border-b-[3px] flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10
									{variant.isDefault ? 'bg-[#ffc480]/20 border-[#ffc480]' : 'bg-gray-50 border-gray-900'}">
									<div class="flex items-center gap-4">
										<div class="w-9 h-9 {index === 0 ? 'bg-[#4ade80]' : index === 1 ? 'bg-[#ffc480]' : index === 2 ? 'bg-[#60a5fa]' : 'bg-[#f472b6]'} border-[2px] border-gray-900 text-gray-900 rounded-lg flex items-center justify-center text-sm font-black shrink-0 shadow-[2px_2px_0_0_#1f2937]">
											{String.fromCharCode(65 + index)}
										</div>
										<input
											type="text"
											bind:value={variant.name}
											class="text-sm font-black bg-white/50 border-[2px] border-transparent hover:border-gray-300 focus:border-gray-900 focus:bg-white rounded-lg px-2 py-1 outline-none w-40 text-gray-900 transition-all"
											placeholder="Variant Name"
										/>
										{#if variant.isDefault}
											<span class="px-3 py-1 bg-[#ffc480] border-[2px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]">
												Default Variant
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-4">
										<div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
											<span class="text-xs font-black uppercase tracking-widest text-gray-500">Weight</span>
											<input
												type="number"
												min="0"
												max="10000"
												bind:value={variant.weight}
												class="w-16 bg-transparent text-sm font-black text-gray-900 text-right focus:outline-none"
											/>
											<span class="text-xs font-bold text-gray-400">
												/ 10000
											</span>
										</div>
										<span class="text-sm font-black {weightIsValid ? 'text-green-600' : 'text-gray-500'} bg-white border-[2px] border-gray-200 px-3 py-2.5 rounded-xl">
											{((parseInt(variant.weight) || 0) / 100).toFixed(0)}%
										</span>
										
										<div class="flex items-center gap-2 ml-2">
											{#if !variant.isDefault}
												<button type="button" on:click={() => setDefault(index)}
													class="p-2.5 bg-white border-[2px] border-gray-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] transition-all" title="Set as default">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
													</svg>
												</button>
											{/if}
											{#if form.variants.length > 2}
												<button type="button" on:click={() => removeVariant(index)}
													class="p-2.5 bg-white border-[2px] border-gray-300 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-600 hover:shadow-[2px_2px_0_0_#ef4444] transition-all" title="Remove Variant">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											{/if}
										</div>
									</div>
								</div>

								<!-- Variant Body -->
								<div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 bg-white/80 backdrop-blur-sm">
									<!-- Left: Config & Variables -->
									<div class="space-y-6">
										<!-- Per-variant Template -->
										{#if form.testMode === 'different_templates'}
											<div class="bg-gray-50 p-5 rounded-xl border-[3px] border-gray-200">
												<label class="block text-xs font-black uppercase tracking-widest text-gray-800 mb-2">
													Template Selection <span class="text-red-500">*</span>
												</label>
												<TemplateSelector
													bind:value={variant.templateUid}
													placeholder="Select template for this variant..."
													on:change={() => handleVariantTemplateSelect(index)}
												/>
											</div>
										{/if}

										<!-- Variable Overrides -->
										<div>
											<div class="flex items-center justify-between mb-3 border-b-[3px] border-gray-900 pb-2">
												<label class="text-sm font-black uppercase tracking-widest text-gray-900">
													Variables
												</label>
												{#if (variantVarEditors[index] || []).length > 0}
													<span class="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-2 py-1 rounded">
														{(variantVarEditors[index] || []).length} Editable
													</span>
												{/if}
											</div>
											
											{#if (variantVarEditors[index] || []).length > 0}
												<div class="space-y-3 bg-gray-50 p-4 rounded-xl border-[3px] border-gray-200">
													{#each variantVarEditors[index] as row, rowIndex}
														<div class="flex flex-col sm:flex-row sm:items-center gap-2">
															<label class="sm:w-1/3 px-3 py-2 bg-gray-200 border-[2px] border-gray-300 rounded-lg text-xs font-black text-gray-700 truncate font-mono shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.7)]" title={row.key}>
																{row.key}
															</label>
															<input
																type="text"
																bind:value={row.value}
																on:input={() => syncVarsFromEditor(index)}
																placeholder="Override value"
																class="flex-1 px-3 py-2 border-[2px] border-gray-400 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-gray-900 focus:bg-[#FFFDF8] transition-colors"
															/>
														</div>
													{/each}
												</div>
											{:else}
												<div class="bg-gray-50 border-[3px] border-dashed border-gray-300 rounded-xl p-6 text-center">
													{#if getResolvedTemplateUid(index)}
														<svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
														</svg>
														<p class="text-sm font-bold text-gray-500 uppercase tracking-widest">
															No variables defined.
														</p>
													{:else}
														<svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
														</svg>
														<p class="text-sm font-bold text-gray-500 uppercase tracking-widest">
															Select template to view variables.
														</p>
													{/if}
												</div>
											{/if}
										</div>

									</div>

									<!-- Right: Live Preview -->
									<div class="flex flex-col h-full">
										<div class="flex items-center justify-between mb-3 border-b-[3px] border-gray-900 pb-2">
											<label class="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
												<svg class="w-5 h-5 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
												Live Preview
											</label>
											{#if variantPreviews[index]?.loading}
												<span class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#ffc480] bg-gray-900 px-2 py-1 rounded">
													<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
														<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
														<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
													</svg>
													Rendering...
												</span>
											{/if}
										</div>

										<div class="flex-1 bg-gray-900 rounded-xl border-[4px] border-gray-900 overflow-hidden flex flex-col shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
											<!-- Subtle top bar for the "monitor" look -->
											<div class="h-6 bg-gray-800 flex items-center px-3 gap-1.5 shrink-0">
												<div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
												<div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
												<div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
											</div>
											<div class="flex-1 bg-[url('/noise.png')] bg-repeat bg-[#e5e7eb] flex items-center justify-center p-4 relative overflow-hidden min-h-[250px] lg:min-h-0">
												<!-- Transparent grid pattern -->
												<div class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none"></div>
												
												<!-- Canvas Container -->
												<div class="relative z-10 w-full h-full flex items-center justify-center">
													{#if variantPreviews[index]?.url}
														<img
															src={variantPreviews[index].url}
															alt="Preview {variant.name}"
															class="max-w-full max-h-[300px] lg:max-h-full object-contain pointer-events-none drop-shadow-[0_20px_25px_rgba(0,0,0,0.2)]"
														/>
													{:else if variantPreviews[index]?.error}
														<div class="bg-white px-6 py-4 rounded-xl border-[3px] border-red-500 shadow-[4px_4px_0_0_#ef4444] text-center max-w-xs">
															<svg class="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															<p class="text-xs font-black uppercase text-red-900">{variantPreviews[index].error}</p>
														</div>
													{:else}
														<div class="bg-white/80 backdrop-blur px-6 py-4 rounded-xl border-[3px] border-dashed border-gray-400 text-center text-gray-500 font-bold text-sm">
															Awaiting template...
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Add Variant Button -->
					<button
						type="button"
						on:click={addVariant}
						class="w-full py-4 mt-3 border-[3px] border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:bg-[#ffc480]/20 hover:shadow-[3px_3px_0_0_#1f2937] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
					>
						<div class="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-gray-900 group-hover:text-[#ffc480] flex items-center justify-center transition-colors">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
							</svg>
						</div>
						<span class="text-xs font-black uppercase tracking-wide text-inherit">Add Variant</span>
					</button>
				</div>

				<!-- Step 2 Footer -->
				<div class="px-6 py-4 bg-gray-50 border-t-[3px] border-gray-900 flex justify-between items-center">
					<button type="button" on:click={prevStep} class="px-4 py-2.5 text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-wide transition-colors flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
						</svg>
						Back
					</button>
					<button
						type="button"
						on:click={nextStep}
						disabled={!canGoStep3}
						class="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all border-[2px] flex items-center gap-2
							{canGoStep3
								? 'bg-gray-900 text-white border-gray-900 shadow-[4px_4px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#ffc480]'
								: 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed hidden'}"
					>
						Next Step
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- ============== STEP 3: GOAL & LAUNCH ============== -->
		{#if currentStep === 'launch'}
			<div class="space-y-6">
				<!-- Goal Section -->
				<div class="bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
					<div class="bg-gray-50 px-6 py-4 border-b-[3px] border-gray-900">
						<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">What counts as success?</h2>
						<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">Goal Configuration</p>
					</div>
					<div class="p-6 space-y-6 bg-[#FFFDF8]">
						<!-- Goal Type -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-[3px] border-gray-900 rounded-xl p-2 bg-gray-100 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
							<button
								type="button"
								on:click={() => form.goalConfig.type = 'impressions_only'}
								class="text-left p-4 border-[2px] rounded-lg transition-all relative
									{form.goalConfig.type === 'impressions_only'
										? 'border-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] z-10 scale-[1.02]'
										: 'border-transparent hover:bg-gray-200 text-gray-500'}"
							>
								{#if form.goalConfig.type === 'impressions_only'}
									<div class="absolute top-4 right-4 text-[#ffc480]">
										<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
									</div>
								{/if}
								<div class="flex flex-col gap-3">
									<div class="text-2xl">👁️</div>
									<div>
										<div class="text-xs font-black text-gray-900 uppercase tracking-wide">Impressions Only</div>
										<div class="text-sm font-bold mt-1 {form.goalConfig.type === 'impressions_only' ? 'text-gray-600' : 'text-gray-400'}">Track how many times each variant is viewed by users.</div>
									</div>
								</div>
							</button>

							<button
								type="button"
								on:click={() => form.goalConfig.type = 'click_through'}
								class="text-left p-4 border-[2px] rounded-lg transition-all relative
									{form.goalConfig.type === 'click_through'
										? 'border-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937] z-10 scale-[1.02]'
										: 'border-transparent hover:bg-gray-200 text-gray-500'}"
							>
								{#if form.goalConfig.type === 'click_through'}
									<div class="absolute top-4 right-4 text-[#ffc480]">
										<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
									</div>
								{/if}
								<div class="flex flex-col gap-3">
									<div class="text-2xl">🖱️</div>
									<div>
										<div class="text-xs font-black text-gray-900 uppercase tracking-wide">Click-Through</div>
										<div class="text-sm font-bold mt-1 {form.goalConfig.type === 'click_through' ? 'text-gray-600' : 'text-gray-400'}">Track CTA clicks via a generated redirect link.</div>
									</div>
								</div>
							</button>
						</div>

						<!-- Destination URL -->
						{#if form.goalConfig.type === 'click_through'}
							<div class="bg-gray-50 border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#1f2937]">
								<label for="destination-url" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
									Destination URL <span class="text-red-500">*</span>
									<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold shrink-0 cursor-help" title="Where users should end up after clicking your ad.">?</span>
								</label>
								<div class="relative">
									<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
									</div>
									<input
										id="destination-url"
										type="url"
										bind:value={form.goalConfig.destinationUrl}
										placeholder="https://example.com/landing-page"
										class="w-full pl-10 pr-4 py-3 border-[3px] border-gray-300 rounded-xl text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#ffc480] focus:shadow-[4px_4px_0_0_#ffc480] transition-all shadow-sm placeholder:text-gray-400"
									/>
								</div>
								<p class="mt-3 text-sm font-bold text-gray-500 bg-white px-4 py-3 rounded-lg border-[2px] border-gray-200">
									Use the tracking link on your CTA button — it records the click and redirects here.
								</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Advanced Settings (collapsed by default) -->
				<div class="bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
					<button
						type="button"
						on:click={() => showAdvanced = !showAdvanced}
						class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white border-b-[3px] {showAdvanced ? 'border-gray-900' : 'border-transparent'}"
					>
						<span class="text-xs font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
							<svg class="w-4 h-4 {showAdvanced ? 'text-[#ffc480]' : 'text-gray-400'} transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Advanced Settings
						</span>
						<div class="w-8 h-8 rounded-full border-[2px] border-gray-900 flex items-center justify-center transition-transform {showAdvanced ? 'rotate-180 bg-gray-900 text-white' : 'bg-transparent text-gray-900'}">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>

					{#if showAdvanced}
						<div class="p-6 space-y-6 bg-[#FFFDF8]">
							<!-- Slug -->
							<div>
								<label for="slug-input" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
									Custom URL Slug
								</label>
								<div class="relative">
									<input
										id="slug-input"
										type="text"
										bind:value={form.slug}
										on:input={() => { if (isEditMode) { slugStatus = 'existing'; } else { checkSlug(); } }}
										placeholder="my-experiment-slug"
										readonly={isEditMode}
										class="w-full px-4 py-3 pr-10 border-[3px] rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-0 shadow-sm transition-all
											{isEditMode
												? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
												: slugStatus === 'invalid' || slugStatus === 'taken'
													? 'border-red-500 focus:border-red-500 focus:shadow-[4px_4px_0_0_#ef4444]'
													: slugStatus === 'available'
														? 'border-green-500 focus:border-green-500 focus:shadow-[4px_4px_0_0_#22c55e]'
														: 'border-gray-400 focus:border-gray-900 focus:shadow-[4px_4px_0_0_#1f2937]'}"
									/>
									{#if !isEditMode}
										<div class="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1">
											{#if slugStatus === 'checking'}
												<svg class="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
												</svg>
											{:else if slugStatus === 'available'}
												<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
												</svg>
											{:else if slugStatus === 'taken'}
												<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
												</svg>
											{:else if slugStatus === 'invalid'}
												<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											{/if}
										</div>
									{/if}
								</div>
								{#if !isEditMode}
									{#if slugStatus === 'available'}
										<p class="mt-2 text-xs font-bold tracking-wider uppercase text-green-600">Slug Available</p>
									{:else if slugStatus === 'taken'}
										<p class="mt-2 text-xs font-bold tracking-wider uppercase text-red-600">Already taken</p>
									{:else if slugStatus === 'invalid'}
										<p class="mt-2 text-sm font-bold text-red-600">Must be 3-60 characters, lowercase letters, numbers, and hyphens only.</p>
									{/if}
								{:else}
									<p class="mt-2 text-sm font-bold text-gray-500">The slug cannot be changed for an existing experiment.</p>
								{/if}
								<div class="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-100 border-[3px] border-gray-200 rounded-xl overflow-hidden shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.05)]">
									<div class="bg-gray-900 text-white p-1.5 rounded-lg shrink-0">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
									</div>
									<code class="text-sm font-bold text-gray-700 truncate font-mono">{previewUrl}</code>
								</div>
							</div>

							<!-- Format & Quality -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-[3px] border-gray-200 pt-8">
								<div>
									<label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
										Output Format
									</label>
									<div class="flex flex-wrap sm:flex-nowrap gap-3">
										{#each outputFormats as fmt}
											<button
												type="button"
												on:click={() => form.outputConfig.format = fmt.value}
												class="flex-1 px-4 py-3 border-[3px] rounded-xl text-center text-sm font-black uppercase tracking-widest transition-all
													{form.outputConfig.format === fmt.value
														? 'border-gray-900 bg-[#ffc480]/20 shadow-[4px_4px_0_0_#1f2937] text-gray-900 -translate-y-[2px]'
														: 'border-gray-300 bg-white text-gray-500 hover:border-gray-900 hover:text-gray-900'}"
											>
												{fmt.label}
											</button>
										{/each}
									</div>
								</div>
								<div>
									<label for="quality" class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center justify-between">
										<span>Quality Compression</span>
										<span class="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm">{form.outputConfig.quality}%</span>
									</label>
									<div class="mt-4 px-2">
										<input
											id="quality"
											type="range"
											min="10"
											max="100"
											bind:value={form.outputConfig.quality}
											class="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
											style="background: linear-gradient(to right, #1f2937 0%, #1f2937 {form.outputConfig.quality}%, #e5e7eb {form.outputConfig.quality}%, #e5e7eb 100%);"
										/>
										<div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
											<span>Lightest</span>
											<span>Balanced</span>
											<span>Highest</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
					<!-- Summary Receipt -->
					<div class="lg:col-span-2 space-y-4">
						<h3 class="text-sm font-black uppercase tracking-widest text-gray-500 ml-2">Verification Receipt</h3>
						<div class="bg-white border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937] pb-6 pt-4 px-1 relative
							after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-4 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj4KICA8cG9seWdvbiBmaWxsPSIjZmZmIiBwb2ludHM9IjAsMTAgNSwwIDEwLDEwIi8+Cjwvc3ZnPg==')] after:bg-repeat-x after:-mb-1">
							
							<div class="text-center pb-6 border-b-[2px] border-dashed border-gray-300 mx-6 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.02)_100%)]">
								<h2 class="text-lg font-black uppercase tracking-tighter text-gray-900">Pictify.io</h2>
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Experiment Summary</p>
							</div>

							<div class="px-6 py-4">
								<div class="space-y-4 font-mono text-sm leading-relaxed">
									<div class="flex justify-between items-start gap-4">
										<span class="text-gray-500 font-bold shrink-0">EXP_NAME:</span>
										<span class="font-black text-gray-900 text-right break-words">{form.name || 'UNNAMED'}</span>
									</div>

									<div class="flex justify-between items-start gap-4">
										<span class="text-gray-500 font-bold shrink-0">RND_MODE:</span>
										<span class="font-black text-gray-900 text-right">{form.testMode === 'same_template' ? 'SHARED_TPL' : 'MULTI_TPL'}</span>
									</div>

									<div class="flex justify-between items-start gap-4">
										<span class="text-gray-500 font-bold shrink-0">VARIANTS:</span>
										<div class="text-right">
											<span class="font-black text-gray-900 block mb-1">{form.variants.length} CONFIGURED</span>
											{#each form.variants as v, i}
												<div class="text-xs text-gray-600 font-bold">
													[{String.fromCharCode(65 + i)}] {v.name} @ {(v.weight / 100).toFixed(0)}%
												</div>
											{/each}
										</div>
									</div>

									<div class="flex justify-between items-start gap-4">
										<span class="text-gray-500 font-bold shrink-0">TRACKING:</span>
										<div class="text-right">
											<span class="font-black {form.goalConfig.type === 'click_through' ? 'bg-[#ffc480] px-1' : ''} text-gray-900">
												{form.goalConfig.type === 'click_through' ? 'CLICKS' : 'IMPRESSIONS'}
											</span>
											{#if form.goalConfig.type === 'click_through' && form.goalConfig.destinationUrl}
												<div class="text-[10px] text-blue-600 truncate max-w-[150px] mt-1" title={form.goalConfig.destinationUrl}>
													-> {form.goalConfig.destinationUrl}
												</div>
											{/if}
										</div>
									</div>

									{#if form.hypothesis}
										<div class="pt-4 border-t-[2px] border-dashed border-gray-300 mt-4">
											<span class="text-gray-500 font-bold block mb-1">HYPOTHESIS:</span>
											<p class="text-xs text-gray-700 italic border-l-2 border-gray-300 pl-3 py-1 font-sans font-bold">
												"{form.hypothesis}"
											</p>
										</div>
									{/if}

									<div class="pt-4 border-t-[2px] border-dashed border-gray-300 mt-4">
										<div class="flex justify-between items-center text-xs">
											<span class="text-gray-400 font-bold">STATUS</span>
											<span class="bg-gray-200 text-gray-500 px-2 font-black">PENDING_SAVE</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Embed Code terminal display -->
					<div class="lg:col-span-3 space-y-4 flex flex-col">
						<h3 class="text-sm font-black uppercase tracking-widest text-gray-500 ml-2">Integration Points</h3>
						
						<div class="flex-1 bg-gray-900 rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937] flex flex-col">
							<!-- Terminal Header -->
							<div class="h-10 border-b-[3px] border-gray-700 flex items-center px-4 bg-gray-800 shrink-0">
								<div class="flex gap-2">
									<div class="w-3 h-3 rounded-full bg-red-500"></div>
									<div class="w-3 h-3 rounded-full bg-yellow-500"></div>
									<div class="w-3 h-3 rounded-full bg-green-500"></div>
								</div>
								<div class="flex-1 text-center font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest">
									bash — deploy
								</div>
							</div>
							
							<div class="p-6 flex-1 bg-gray-900 overflow-y-auto font-mono">
								<div class="space-y-6">
									<!-- Image URL -->
									<div class="space-y-2">
										<div class="text-[10px] uppercase font-black tracking-widest text-[#4ade80]">
											> Image Endpoint
										</div>
										<p class="text-xs text-gray-400 font-sans font-bold">Serve this URL inside an {@html '<code>&lt;img&gt;</code>'} or CSS background.</p>
										<div class="bg-black/50 p-3 rounded-lg border-[2px] border-gray-800 break-all text-sm text-[#ffc480]">
											{previewUrl}
										</div>
									</div>

									{#if form.goalConfig.type === 'click_through'}
										<!-- Click Tracking Link -->
										<div class="space-y-2">
											<div class="text-[10px] uppercase font-black tracking-widest text-[#60a5fa]">
												> CTA Link Endpoint
											</div>
											<p class="text-xs text-gray-400 font-sans font-bold">Use this URL for your button's href attribute.</p>
											<div class="bg-black/50 p-3 rounded-lg border-[2px] border-gray-800 break-all text-sm text-[#60a5fa]">
												{clickTrackUrl}
											</div>
										</div>

										<!-- HTML Snippet -->
										<div class="space-y-2">
											<div class="text-[10px] uppercase font-black tracking-widest text-[#f472b6]">
												> Example Implementation
											</div>
											<div class="bg-black/50 p-4 rounded-lg border-[2px] border-gray-800 overflow-x-auto text-xs leading-loose">
<span class="text-gray-500">&lt;!-- A/B Tested Dynamic Image --&gt;</span>
<span class="text-blue-400">&lt;img</span> <span class="text-green-400">src=</span><span class="text-amber-300">"{previewUrl}"</span> <span class="text-blue-400">/&gt;</span>

<span class="text-gray-500">&lt;!-- Call to Action Button --&gt;</span>
<span class="text-blue-400">&lt;a</span> <span class="text-green-400">href=</span><span class="text-amber-300">"{clickTrackUrl}"</span><span class="text-blue-400">&gt;</span>
  Continue
<span class="text-blue-400">&lt;/a&gt;</span>
											</div>
										</div>
									{:else}
										<!-- HTML Snippet -->
										<div class="space-y-2">
											<div class="text-[10px] uppercase font-black tracking-widest text-[#f472b6]">
												> Example Implementation
											</div>
											<div class="bg-black/50 p-4 rounded-lg border-[2px] border-gray-800 overflow-x-auto text-xs leading-loose">
<span class="text-gray-500">&lt;!-- A/B Tested Dynamic Image --&gt;</span>
<span class="text-blue-400">&lt;img</span> <span class="text-green-400">src=</span><span class="text-amber-300">"{previewUrl}"</span> <span class="text-green-400">alt=</span><span class="text-amber-300">"Dynamic presentation"</span> <span class="text-blue-400">/&gt;</span>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Launch Footer Component -->
				<div class="mt-8 bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[6px_6px_0_0_#1f2937] flex flex-col md:flex-row items-center justify-between gap-4">
					<button type="button" on:click={prevStep} class="w-full md:w-auto px-4 py-2.5 border-[2px] border-gray-300 bg-white rounded-lg text-xs font-black text-gray-500 hover:text-gray-900 hover:border-gray-900 uppercase tracking-wide transition-all shadow-sm hover:shadow-[3px_3px_0_0_#1f2937]">
						&larr; Previous Step
					</button>

					<div class="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
						<button
							type="button"
							on:click={() => handleSubmit(false)}
							disabled={!effectiveCanSubmit}
							class="w-full sm:w-auto px-5 py-2.5 border-[2px] rounded-lg text-xs font-black uppercase tracking-wide transition-all
								{effectiveCanSubmit
									? 'border-gray-900 text-gray-900 bg-white shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'
									: 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed hidden'}"
						>
							{#if isSubmitting}
								Saving...
							{:else if isEditMode}
								Save Changes
							{:else}
								Save as Draft
							{/if}
						</button>
						<button
							type="button"
							on:click={() => handleSubmit(true)}
							disabled={!effectiveCanSubmit}
							class="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all
								{effectiveCanSubmit
									? 'bg-[#4ade80] text-gray-900 border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'
									: 'bg-gray-200 text-gray-400 border-[2px] border-gray-300 cursor-not-allowed hidden'}"
						>
							{#if isSubmitting}
								<span class="flex items-center gap-2 justify-center">
									<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Running...
								</span>
							{:else if isEditMode}
								Update & Launch
							{:else}
								Create & Launch
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
