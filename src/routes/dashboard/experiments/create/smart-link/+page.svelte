<script>
	import { onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
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
	import { getContextVariables } from '../../../../../api/experiments';
	import { StaticCanvas } from 'fabric';
	import WizardStepper from '$lib/components/dashboard/WizardStepper.svelte';
	import RuleBuilder from '$lib/components/experiments/RuleBuilder.svelte';
	import IntegrationPreview from '$lib/components/experiments/IntegrationPreview.svelte';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import SnippetThumbnail from '$lib/components/editor/html/SnippetThumbnail.svelte';

	// ============== Condition Normalization ==============

	function normalizeConditions(cond) {
		if (!cond) return { type: 'group', operator: 'AND', children: [] };
		if (cond.type === 'group') return cond;
		if (Array.isArray(cond.rules)) {
			return {
				type: 'group',
				operator: cond.operator || 'AND',
				children: (cond.rules || []).map((r) => ({ type: 'rule', ...r }))
			};
		}
		return { type: 'group', operator: 'AND', children: [] };
	}

	// ============== Wizard State ==============

	const wizardSteps = [
		{ id: 'basics', label: 'Basics' },
		{ id: 'rules', label: 'Rules & Launch' }
	];
	let currentStep = 'basics';

	// ============== Edit Mode ==============

	let isEditMode = false;
	let editExperimentUid = null;

	// ============== Form State ==============

	let form = {
		type: 'smart_link',
		name: '',
		slug: '',
		outputConfig: { format: 'png', quality: 90 },
		goalConfig: { type: 'impressions_only', destinationUrl: '' },
		variants: [
			{
				id: 'default',
				name: 'Fallback',
				weight: 10000,
				isDefault: true,
				variables: {},
				templateUid: '',
				conditions: { type: 'group', operator: 'AND', children: [] },
				priority: 0
			},
			{
				id: 'variant-1',
				name: 'Rule Variant 1',
				weight: 0,
				isDefault: false,
				variables: {},
				templateUid: '',
				conditions: { type: 'group', operator: 'AND', children: [] },
				priority: 1
			}
		]
	};

	let slugStatus = '';
	let slugTimeout;
	let isSubmitting = false;
	let templateList = [];
	let showAdvanced = false;

	// Variable editor state per variant
	let variantVarEditors = form.variants.map(() => []);

	// Context variables for smart link dynamic text
	let contextVariables = [];
	let showContextVars = {};
	let lastFocusedInput = {}; // { variantIndex, rowIndex }

	// Context variable categories for grouped display
	$: ctxVarsByCategory = {
		location: contextVariables.filter((v) => v.category === 'location'),
		device: contextVariables.filter((v) => v.category === 'device'),
		time: contextVariables.filter((v) => v.category === 'time'),
		other: contextVariables.filter((v) => v.category === 'other')
	};

	const ctxCategoryLabels = {
		location: 'Location',
		device: 'Device',
		time: 'Time',
		other: 'Other'
	};
	const ctxCategoryIcons = { location: '📍', device: '📱', time: '🕐', other: '🔗' };

	// Track input element refs for cursor position insertion
	let varInputRefs = {};

	function getInputRefKey(variantIndex, rowIndex) {
		return `${variantIndex}-${rowIndex}`;
	}

	function insertContextVar(variantIndex, rowIndex, ctxKey) {
		const rows = variantVarEditors[variantIndex];
		if (!rows || !rows[rowIndex]) return;
		const tag = `{{${ctxKey}}}`;
		const currentValue = rows[rowIndex].value || '';
		const refKey = getInputRefKey(variantIndex, rowIndex);
		const inputEl = varInputRefs[refKey];

		if (inputEl && typeof inputEl.selectionStart === 'number') {
			const start = inputEl.selectionStart;
			const end = inputEl.selectionEnd;
			rows[rowIndex].value = currentValue.substring(0, start) + tag + currentValue.substring(end);
			variantVarEditors = variantVarEditors;
			syncVarsFromEditor(variantIndex);
			// Restore cursor position after the inserted tag
			const newPos = start + tag.length;
			// Use tick to let Svelte update the DOM first
			setTimeout(() => {
				inputEl.focus();
				inputEl.setSelectionRange(newPos, newPos);
			}, 0);
		} else {
			// Fallback: append at end
			rows[rowIndex].value = currentValue + tag;
			variantVarEditors = variantVarEditors;
			syncVarsFromEditor(variantIndex);
		}
	}

	function toggleContextVars(variantIndex, rowIndex) {
		const key = `${variantIndex}-${rowIndex}`;
		showContextVars[key] = !showContextVars[key];
		showContextVars = showContextVars;
	}

	// Template variable definitions cache
	let templateVarCache = {};
	let templateDataCache = {};

	// Live preview state per variant
	let variantPreviews = {};
	let previewTimeouts = {};

	// Drawer state per variant
	let expandedVariants = {};

	// ============== Humanize Variable Names ==============

	function humanizeVarName(rawKey) {
		let name = rawKey;
		// Strip Fabric.js prefixes
		name = name.replace(
			/^(RECT_OBJ_|TEXT_OBJ_|IMAGE_OBJ_|GROUP_OBJ_|CIRCLE_OBJ_|PATH_OBJ_|I-TEXT_)/i,
			''
		);
		// Strip trailing random IDs
		name = name.replace(/_[A-Z0-9]{6,}$/i, '');
		// Strip timestamps
		name = name.replace(/\d{13,}/g, '');
		// Clean up underscores, trim, and title case
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

	$: canSubmit =
		form.name.trim() !== '' &&
		form.slug.trim() !== '' &&
		slugStatus === 'available' &&
		!isSubmitting &&
		form.variants.every((v) => v.templateUid !== '');

	$: canSubmitEdit =
		form.name.trim() !== '' &&
		form.slug.trim() !== '' &&
		(slugStatus === 'available' || slugStatus === 'existing') &&
		!isSubmitting &&
		form.variants.every((v) => v.templateUid !== '');

	$: effectiveCanSubmit = isEditMode ? canSubmitEdit : canSubmit;

	// Separate fallback and rule variants for display
	$: fallbackVariant = form.variants.find((v) => v.isDefault);
	$: fallbackIndex = form.variants.findIndex((v) => v.isDefault);
	$: ruleVariants = form.variants.filter((v) => !v.isDefault);
	$: ruleVariantIndices = form.variants
		.map((v, i) => ({ variant: v, index: i }))
		.filter((x) => !x.variant.isDefault);

	let unsubscribeTemplates;

	// ============== Lifecycle ==============

	onMount(async () => {
		unsubscribeTemplates = templates.subscribe((value) => {
			templateList = value || [];
		});
		await getTemplatesAction({ limit: 100 });
		getContextVariables().then((vars) => {
			contextVariables = vars || [];
		});

		const editUid = $page.url.searchParams.get('edit');
		if (editUid) {
			await loadExperimentForEdit(editUid);
		}
	});

	onDestroy(() => {
		if (slugTimeout) clearTimeout(slugTimeout);
		if (unsubscribeTemplates) unsubscribeTemplates();
		Object.values(previewTimeouts).forEach((t) => clearTimeout(t));
	});

	// ============== Edit Mode Functions ==============

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
			if (exp.type !== 'smart_link') {
				toast.set({ message: 'This experiment is not a smart link', type: 'error' });
				goto('/dashboard/experiments');
				return;
			}

			isEditMode = true;
			editExperimentUid = exp.uid;

			form = {
				type: 'smart_link',
				name: exp.name || '',
				slug: exp.slug || '',
				outputConfig: exp.outputConfig || { format: 'png', quality: 90 },
				goalConfig: exp.goalConfig || { type: 'impressions_only', destinationUrl: '' },
				variants: (exp.variants || []).map((v, i) => ({
					id: v.id,
					name: v.name || '',
					weight: v.weight || 0,
					isDefault: v.isDefault || false,
					variables: v.variables || {},
					templateUid: v.templateUid || exp.templateUid || '',
					conditions: normalizeConditions(v.conditions),
					priority: v.priority ?? i
				}))
			};

			// Sort by priority (default first, then by priority)
			form.variants.sort((a, b) => {
				if (a.isDefault) return -1;
				if (b.isDefault) return 1;
				return (a.priority || 0) - (b.priority || 0);
			});

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

				if (tpl.engine === 'html' && tpl.html) {
					templateDataCache[templateUid] = {
						engine: 'html',
						html: tpl.html,
						width: tpl.width || 1080,
						height: tpl.height || 1080
					};
				} else if (tpl.fabricJSData) {
					templateDataCache[templateUid] = {
						engine: 'fabric',
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
			triggerPreview(variantIndex);
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
		if (isEditMode) return;
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

	function addRuleVariant() {
		const num = ruleVariants.length + 1;
		const newVariant = {
			id: `rule-${num}-${Date.now()}`,
			name: `Rule Variant ${num}`,
			weight: 0,
			isDefault: false,
			variables: {},
			templateUid: '',
			conditions: { type: 'group', operator: 'AND', children: [] },
			priority: form.variants.length
		};
		form.variants = [...form.variants, newVariant];
		variantVarEditors = [...variantVarEditors, []];
	}

	function removeVariant(index) {
		if (form.variants[index].isDefault) return; // Can't remove fallback
		form.variants = form.variants.filter((_, i) => i !== index);
		variantVarEditors = variantVarEditors.filter((_, i) => i !== index);
		// Re-assign priorities
		let priority = 0;
		form.variants = form.variants.map((v) => {
			if (v.isDefault) return { ...v, priority: 0 };
			priority++;
			return { ...v, priority };
		});
	}

	function moveVariant(index, direction) {
		const variant = form.variants[index];
		if (variant.isDefault) return;

		const targetIndex = index + direction;
		// Can't move above fallback (index 0) or below end
		if (targetIndex < 1 || targetIndex >= form.variants.length) return;
		// Can't swap with fallback
		if (form.variants[targetIndex].isDefault) return;

		// Swap
		const temp = form.variants[targetIndex];
		form.variants[targetIndex] = form.variants[index];
		form.variants[index] = temp;

		// Swap editors too
		const tempEd = variantVarEditors[targetIndex];
		variantVarEditors[targetIndex] = variantVarEditors[index];
		variantVarEditors[index] = tempEd;

		// Re-assign priorities
		form.variants = form.variants.map((v, i) => ({ ...v, priority: i }));
		variantVarEditors = variantVarEditors;
	}

	// ============== Variable Editor Functions ==============

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

	// ============== Preview ==============

	async function renderVariantPreview(variantIndex) {
		const tplUid = getResolvedTemplateUid(variantIndex);
		if (!tplUid) return;

		const tplData = templateDataCache[tplUid];
		if (!tplData?.fabricJSData) {
			variantPreviews[variantIndex] = {
				url: null,
				loading: false,
				error: 'No canvas data available'
			};
			variantPreviews = variantPreviews;
			return;
		}

		const variables = form.variants[variantIndex]?.variables || {};

		variantPreviews[variantIndex] = {
			loading: true,
			error: null,
			url: variantPreviews[variantIndex]?.url || null
		};
		variantPreviews = variantPreviews;

		try {
			const canvasEl = document.createElement('canvas');
			const width = tplData.width || 800;
			const height = tplData.height || 600;
			canvasEl.width = width;
			canvasEl.height = height;

			const staticCanvas = new StaticCanvas(canvasEl, { width, height });
			await staticCanvas.loadFromJSON(tplData.fabricJSData);

			const objects = staticCanvas.getObjects();
			for (const obj of objects) {
				if ((obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') && obj.text) {
					if (obj.text.includes('{{')) {
						const processed = obj.text.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, varName) => {
							const val = variables[varName.trim()];
							return val !== undefined && val !== null ? String(val) : match;
						});
						obj.set('text', processed);
					}
				}
				if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
					for (const binding of obj.variableBindings) {
						if (binding.variableName && variables[binding.variableName] !== undefined) {
							const val = variables[binding.variableName];
							if (
								binding.property === 'text' &&
								(obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')
							) {
								obj.set('text', String(val));
							} else if (binding.property === 'fill') {
								obj.set('fill', String(val));
							}
						}
					}
				}
			}

			staticCanvas.renderAll();
			const dataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 1 });
			variantPreviews[variantIndex] = { url: dataUrl, loading: false, error: null };
			staticCanvas.dispose();
		} catch (err) {
			variantPreviews[variantIndex] = {
				url: null,
				loading: false,
				error: err?.message || 'Preview render failed'
			};
		}
		variantPreviews = variantPreviews;
	}

	function triggerPreview(variantIndex) {
		if (previewTimeouts[variantIndex]) clearTimeout(previewTimeouts[variantIndex]);
		previewTimeouts[variantIndex] = setTimeout(() => {
			renderVariantPreview(variantIndex);
		}, 300);
	}

	function initStep2Previews() {
		for (let i = 0; i < form.variants.length; i++) {
			const tplUid = getResolvedTemplateUid(i);
			if (!tplUid) continue;

			const vars = getTemplateVars(tplUid);
			if (vars.length > 0 && (!variantVarEditors[i] || variantVarEditors[i].length === 0)) {
				populateVarEditorFromTemplate(i, vars);
			}
			triggerPreview(i);
		}
	}

	// ============== Navigation ==============

	function nextStep() {
		if (currentStep === 'basics' && canGoStep2) {
			if (!form.slug) {
				form.slug = generateSlug(form.name);
				checkSlug();
			}
			currentStep = 'rules';
			initStep2Previews();
		}
	}

	function prevStep() {
		if (currentStep === 'rules') currentStep = 'basics';
	}

	// ============== Submit ==============

	async function handleSubmit(startAfterCreate = false) {
		if (!effectiveCanSubmit) return;
		isSubmitting = true;

		try {
			const payload = {
				type: 'smart_link',
				name: form.name.trim(),
				slug: form.slug.trim(),
				outputConfig: { ...form.outputConfig },
				goalConfig: { ...form.goalConfig },
				variants: form.variants.map((v, i) => ({
					id: v.id,
					name: v.name.trim(),
					weight: parseInt(v.weight) || 0,
					isDefault: v.isDefault,
					variables: v.variables || {},
					templateUid: v.templateUid,
					conditions: v.conditions || { type: 'group', operator: 'AND', children: [] },
					priority: v.priority ?? i
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
							toast.set({ message: 'Smart link updated and launched!', type: 'success' });
						} catch {
							toast.set({ message: 'Smart link updated but failed to launch.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Smart link updated!', type: 'success' });
					}
					goto(`/dashboard/experiments/${updated.uid}`);
				} else {
					toast.set({ message: 'Failed to update smart link.', type: 'error' });
				}
			} else {
				const created = await createExperimentAction(payload);
				if (created?.uid) {
					analytics.trackExperimentCreated({ type: 'smart_link', variant_count: payload.variants?.length || 2 });
					analytics.trackExperimentWizardCompleted({ type: 'smart_link' });
					if (startAfterCreate) {
						try {
							await startExperimentAction(created.uid);
							analytics.trackExperimentStarted({ type: 'smart_link', uid: created.uid });
							toast.set({ message: 'Smart link created and launched!', type: 'success' });
						} catch {
							toast.set({ message: 'Smart link created but failed to launch.', type: 'warning' });
						}
					} else {
						toast.set({ message: 'Smart link saved as draft!', type: 'success' });
					}
					goto(`/dashboard/experiments/${created.uid}`);
				} else {
					toast.set({ message: 'Failed to create smart link.', type: 'error' });
				}
			}
		} catch (err) {
			toast.set({ message: err?.message || 'Something went wrong.', type: 'error' });
		} finally {
			isSubmitting = false;
		}
	}

	// ============== Helpers ==============

	function getResolvedTemplateUid(variantIndex) {
		return form.variants[variantIndex]?.templateUid || '';
	}

	function buildRuleSummary(conditions) {
		if (!conditions) return null;

		// Handle new recursive tree format
		if (conditions.type === 'group') {
			if (!conditions.children || conditions.children.length === 0) return null;
			const parts = conditions.children.map((c) => buildRuleSummary(c)).filter(Boolean);
			if (parts.length === 0) return null;
			if (parts.length === 1) return parts[0];
			const joiner = conditions.operator === 'OR' ? ' OR ' : ' AND ';
			return `(${parts.join(joiner)})`;
		}

		if (conditions.type === 'rule') {
			if (!conditions.property || (conditions.value === '' && conditions.value !== 0)) return null;
			const label = conditions.property.split('.').pop();
			const opLabels = {
				eq: 'is',
				in: 'is one of',
				not_in: 'is not',
				gt: '>',
				lt: '<',
				gte: '>=',
				lte: '<=',
				contains: 'contains'
			};
			const op = opLabels[conditions.operator] || conditions.operator;
			const val = Array.isArray(conditions.value) ? conditions.value.join(', ') : conditions.value;
			return `${label} ${op} ${val}`;
		}

		// Legacy flat format fallback
		if (conditions.rules && conditions.rules.length > 0) {
			const parts = conditions.rules
				.filter((r) => r.property && r.value !== '' && r.value !== undefined)
				.map((r) => {
					const label = r.property.split('.').pop();
					const op = r.operator === 'eq' ? 'is' : r.operator === 'in' ? 'is one of' : r.operator;
					const val = Array.isArray(r.value) ? r.value.join(', ') : r.value;
					return `${label} ${op} ${val}`;
				})
				.filter(Boolean);
			if (parts.length === 0) return null;
			return parts.join(conditions.operator === 'OR' ? ' OR ' : ' AND ');
		}

		return null;
	}
</script>

<Toast />

<div class="min-h-full px-4 py-8 sm:px-6 lg:px-8">
	<div
		class="mx-auto transition-all duration-300 {currentStep === 'rules'
			? 'max-w-full'
			: 'max-w-5xl'}"
	>
		<!-- Back Button -->
		<a
			href={isEditMode ? `/dashboard/experiments/${editExperimentUid}` : '/dashboard/experiments'}
			class="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
		>
			<svg
				class="w-4 h-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			{isEditMode ? 'Back to Experiment' : 'Back to Experiments'}
		</a>

		<!-- Page Header -->
		<div class="mb-6">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					{isEditMode ? 'Edit Smart Link' : 'Create Smart Link'}
				</h1>
				<span
					class="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] bg-[#3b82f6]/20"
				>
					Smart Link
				</span>
			</div>
			<p class="mt-2 text-sm font-bold text-gray-500">
				{isEditMode
					? 'Update your smart link routing rules.'
					: 'Serve different images based on viewer context — device, location, time, and more.'}
			</p>
		</div>

		<!-- Stepper -->
		<WizardStepper steps={wizardSteps} {currentStep} on:step={(e) => (currentStep = e.detail)} />

		<!-- ============== STEP 1: BASICS ============== -->
		{#if currentStep === 'basics'}
			<div
				class="bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]"
			>
				<div class="bg-gray-50 border-b-[3px] border-gray-900 px-6 py-4">
					<h2 class="text-sm font-black uppercase tracking-widest text-gray-900">
						Configure your smart link
					</h2>
					<p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
						Rule-Based Routing
					</p>
				</div>
				<div class="p-6 space-y-6 bg-[#FFFDF8]">
					<!-- Name -->
					<div>
						<label
							for="experiment-name"
							class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3"
						>
							Name <span class="text-red-500">*</span>
						</label>
						<input
							id="experiment-name"
							type="text"
							bind:value={form.name}
							on:input={handleNameInput}
							placeholder="e.g. Mobile vs Desktop Banner"
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-[#ffc480] focus:shadow-[4px_4px_0_0_#ffc480] placeholder-gray-400 transition-all shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]"
						/>
					</div>

					<!-- Slug -->
					<div>
						<label
							for="slug-input"
							class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3"
						>
							URL Slug
						</label>
						<div class="relative">
							<input
								id="slug-input"
								type="text"
								bind:value={form.slug}
								on:input={() => {
									if (isEditMode) {
										slugStatus = 'existing';
									} else {
										checkSlug();
									}
								}}
								placeholder="my-smart-link-slug"
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
										<svg class="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
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
									{:else if slugStatus === 'available'}
										<svg
											class="w-5 h-5 text-green-500"
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
									{:else if slugStatus === 'taken'}
										<svg
											class="w-5 h-5 text-red-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									{:else if slugStatus === 'invalid'}
										<svg
											class="w-5 h-5 text-red-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									{/if}
								</div>
							{/if}
						</div>
						{#if !isEditMode}
							{#if slugStatus === 'available'}
								<p class="mt-2 text-xs font-bold tracking-wider uppercase text-green-600">
									Slug Available
								</p>
							{:else if slugStatus === 'taken'}
								<p class="mt-2 text-xs font-bold tracking-wider uppercase text-red-600">
									Already taken
								</p>
							{:else if slugStatus === 'invalid'}
								<p class="mt-2 text-sm font-bold text-red-600">
									Must be 3-60 characters, lowercase letters, numbers, and hyphens only.
								</p>
							{/if}
						{/if}
						<div
							class="mt-3 flex items-center gap-3 px-4 py-3 bg-gray-100 border-[3px] border-gray-200 rounded-xl overflow-hidden"
						>
							<div class="bg-gray-900 text-white p-1.5 rounded-lg shrink-0">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
							</div>
							<code class="text-sm font-bold text-gray-700 truncate font-mono">{previewUrl}</code>
						</div>
					</div>

					<!-- Output Format -->
					<div class="pt-4 border-t-[2px] border-dashed border-gray-200">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
									Output Format
								</label>
								<div class="flex flex-wrap sm:flex-nowrap gap-3">
									{#each outputFormats as fmt}
										<button
											type="button"
											on:click={() => (form.outputConfig.format = fmt.value)}
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
								<label
									for="quality"
									class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center justify-between"
								>
									<span>Quality</span>
									<span class="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm"
										>{form.outputConfig.quality}%</span
									>
								</label>
								<div class="mt-4 px-2">
									<input
										id="quality"
										type="range"
										min="10"
										max="100"
										bind:value={form.outputConfig.quality}
										class="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
										style="background: linear-gradient(to right, #1f2937 0%, #1f2937 {form
											.outputConfig.quality}%, #e5e7eb {form.outputConfig.quality}%, #e5e7eb 100%);"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 1 Footer -->
				<div
					class="px-6 py-4 bg-gray-50 border-t-[3px] border-gray-900 flex justify-between items-center"
				>
					<a
						href="/dashboard/experiments"
						class="px-4 py-2.5 text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-wide transition-colors"
					>
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
						Next: Rules & Launch
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- ============== STEP 2: RULES & LAUNCH ============== -->
		{#if currentStep === 'rules'}
			<div class="space-y-6">
				<!-- Explanation banner -->
				<div
					class="flex items-start gap-3 px-5 py-4 bg-blue-50 border-[2px] border-blue-200 rounded-xl"
				>
					<svg
						class="w-5 h-5 text-blue-500 mt-0.5 shrink-0"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
						/>
					</svg>
					<div>
						<p class="text-sm font-black text-blue-900">Rule-Based Routing</p>
						<p class="text-xs font-bold text-blue-700 mt-1">
							Rules are evaluated top-to-bottom. The first variant whose conditions match the viewer
							is shown. The fallback variant is served when no rules match.
						</p>
					</div>
				</div>

				<!-- ===== FALLBACK VARIANT (pinned at top) ===== -->
				{#if fallbackVariant}
					<div
						class="border-[3px] border-[#4ade80] rounded-xl overflow-hidden shadow-[6px_6px_0_0_#4ade80] transition-all relative"
					>
						<div
							class="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"
						/>

						<!-- Header -->
						<div
							class="px-6 py-4 border-b-[3px] border-[#4ade80] bg-[#4ade80]/20 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-9 h-9 bg-[#4ade80] border-[2px] border-gray-900 text-gray-900 rounded-lg flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#1f2937]"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										/>
									</svg>
								</div>
								<input
									type="text"
									bind:value={fallbackVariant.name}
									on:input={() => {
										form.variants = form.variants;
									}}
									class="text-sm font-black bg-white/50 border-[2px] border-transparent hover:border-gray-300 focus:border-gray-900 focus:bg-white rounded-lg px-2 py-1 outline-none w-40 text-gray-900 transition-all"
									placeholder="Fallback Name"
								/>
								<span
									class="px-3 py-1 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
								>
									Fallback
								</span>
							</div>
							<span
								class="text-[10px] font-black uppercase tracking-widest text-green-800 bg-[#4ade80]/30 px-3 py-1.5 rounded-lg border-[2px] border-green-300"
							>
								Always shown if no rules match
							</span>
						</div>

						<!-- Body -->
						<div class="relative z-10 bg-white/80 backdrop-blur-sm">
							<!-- Template select (full width) -->
							<div class="px-6 py-4 border-b-[2px] border-gray-200">
								<label
									class="block text-xs font-black uppercase tracking-widest text-gray-800 mb-2"
								>
									Template <span class="text-red-500">*</span>
								</label>
								<TemplateSelector
									bind:value={fallbackVariant.templateUid}
									on:change={() => handleVariantTemplateSelect(fallbackIndex)}
								/>
							</div>

							<!-- Variables + Preview (always visible, no drawer for fallback) -->
							<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
								<!-- Variables -->
								<div
									class="p-6 space-y-4 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-gray-200"
								>
									<div class="flex items-center justify-between">
										<label class="text-xs font-black uppercase tracking-widest text-gray-900"
											>Variables</label
										>
										{#if (variantVarEditors[fallbackIndex] || []).length > 0}
											<span
												class="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-2 py-1 rounded"
											>
												{(variantVarEditors[fallbackIndex] || []).length} Editable
											</span>
										{/if}
									</div>
									{#if (variantVarEditors[fallbackIndex] || []).length > 0}
										<div class="space-y-3">
											{#each variantVarEditors[fallbackIndex] as row, rowIndex}
												<div class="space-y-1.5">
													<div class="flex flex-col sm:flex-row sm:items-center gap-2">
														<label
															class="sm:w-1/3 px-3 py-2 bg-gray-200 border-[2px] border-gray-300 rounded-lg text-xs font-black text-gray-700 truncate"
															title={row.key}
														>
															{humanizeVarName(row.key)}
														</label>
														<div class="flex-1 flex gap-1.5">
															<input
																type="text"
																bind:this={varInputRefs[getInputRefKey(fallbackIndex, rowIndex)]}
																bind:value={row.value}
																on:input={() => syncVarsFromEditor(fallbackIndex)}
																placeholder="Override value or use dynamic tags →"
																class="flex-1 px-3 py-2 border-[2px] border-gray-400 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-gray-900 focus:bg-[#FFFDF8] transition-colors"
															/>
															{#if contextVariables.length > 0}
																<button
																	type="button"
																	on:click={() => toggleContextVars(fallbackIndex, rowIndex)}
																	class="px-2 py-2 border-[2px] rounded-lg text-xs font-black transition-all shrink-0 {showContextVars[
																		`${fallbackIndex}-${rowIndex}`
																	]
																		? 'border-[#ffc480] bg-[#ffc480]/20 text-gray-900'
																		: 'border-gray-300 bg-white text-gray-500 hover:border-gray-900 hover:text-gray-900'}"
																	title="Insert dynamic context variable"
																>
																	<svg
																		class="w-4 h-4"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																		><path
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			stroke-width="2"
																			d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
																		/></svg
																	>
																</button>
															{/if}
														</div>
													</div>
													{#if showContextVars[`${fallbackIndex}-${rowIndex}`]}
														<div
															class="ml-0 sm:ml-[calc(33.333%+0.5rem)] p-3 bg-gray-50 border-[2px] border-dashed border-[#ffc480] rounded-lg"
															transition:slide={{ duration: 150 }}
														>
															<p
																class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2"
															>
																Insert Dynamic Tag
															</p>
															<div class="space-y-2">
																{#each Object.entries(ctxVarsByCategory) as [cat, vars]}
																	{#if vars.length > 0}
																		<div>
																			<p
																				class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1"
																			>
																				{ctxCategoryIcons[cat]}
																				{ctxCategoryLabels[cat]}
																			</p>
																			<div class="flex flex-wrap gap-1">
																				{#each vars as cv}
																					<button
																						type="button"
																						on:click={() =>
																							insertContextVar(fallbackIndex, rowIndex, cv.key)}
																						class="px-2 py-1 bg-white border-[1.5px] border-gray-300 rounded-md text-[10px] font-bold text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
																						title="{cv.label} — e.g. {cv.example}"
																					>
																						{cv.label}
																					</button>
																				{/each}
																			</div>
																		</div>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<div
											class="bg-gray-50 border-[2px] border-dashed border-gray-300 rounded-xl p-4 text-center"
										>
											<p class="text-xs font-bold text-gray-400">
												{getResolvedTemplateUid(fallbackIndex)
													? 'No variables defined.'
													: 'Select template to view variables.'}
											</p>
										</div>
									{/if}
								</div>

								<!-- Preview (no browser chrome) -->
								<div class="p-5 bg-gray-50/50">
									<div class="flex items-center justify-between mb-2">
										<label
											class="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"
										>
											<svg
												class="w-3.5 h-3.5 text-[#ffc480]"
												fill="currentColor"
												viewBox="0 0 24 24"
												><path
													d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
												/></svg
											>
											Preview
										</label>
										{#if variantPreviews[fallbackIndex]?.loading}
											<svg
												class="w-3 h-3 animate-spin text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												><circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												/><path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
												/></svg
											>
										{/if}
									</div>
									<div
										class="rounded-lg border-[2px] border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center p-3 min-h-[180px]"
									>
										{#if templateDataCache[getResolvedTemplateUid(fallbackIndex)]?.engine === 'html'}
											{#key getResolvedTemplateUid(fallbackIndex)}
												<SnippetThumbnail
													body={templateDataCache[getResolvedTemplateUid(fallbackIndex)]?.html || ''}
													cardWidth={300}
													cardHeight={180}
													naturalWidth={templateDataCache[getResolvedTemplateUid(fallbackIndex)]?.width || 1080}
													naturalHeight={templateDataCache[getResolvedTemplateUid(fallbackIndex)]?.height || 1080}
													overrideVars={fallbackVariant.variables || {}}
												/>
											{/key}
										{:else if variantPreviews[fallbackIndex]?.url}
											<img
												src={variantPreviews[fallbackIndex].url}
												alt="Preview {fallbackVariant.name}"
												class="max-w-full max-h-[200px] object-contain pointer-events-none"
											/>
										{:else if variantPreviews[fallbackIndex]?.error}
											<p class="text-[10px] font-black uppercase text-red-600 text-center">
												{variantPreviews[fallbackIndex].error}
											</p>
										{:else}
											<p class="text-[10px] font-bold text-gray-400 text-center">
												Awaiting template...
											</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- ===== RULE VARIANT CARDS ===== -->
				{#each ruleVariantIndices as { variant, index }, ruleNum (variant.id)}
					<div
						class="border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937] transition-all relative"
					>
						<div
							class="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"
						/>

						<!-- Header -->
						<div
							class="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-9 h-9 bg-[#3b82f6] border-[2px] border-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-black shrink-0 shadow-[2px_2px_0_0_#1f2937]"
								>
									#{ruleNum + 1}
								</div>
								<input
									type="text"
									bind:value={variant.name}
									on:input={() => {
										form.variants = form.variants;
									}}
									class="text-sm font-black bg-white/50 border-[2px] border-transparent hover:border-gray-300 focus:border-gray-900 focus:bg-white rounded-lg px-2 py-1 outline-none w-40 text-gray-900 transition-all"
									placeholder="Variant Name"
								/>
							</div>
							<div class="flex items-center gap-2">
								<!-- Move Up -->
								<button
									type="button"
									on:click={() => moveVariant(index, -1)}
									disabled={index <= 1}
									class="p-2 bg-white border-[2px] border-gray-300 rounded-lg text-gray-500 hover:text-gray-900 hover:border-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
									title="Move Up"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M5 15l7-7 7 7"
										/></svg
									>
								</button>
								<!-- Move Down -->
								<button
									type="button"
									on:click={() => moveVariant(index, 1)}
									disabled={index >= form.variants.length - 1}
									class="p-2 bg-white border-[2px] border-gray-300 rounded-lg text-gray-500 hover:text-gray-900 hover:border-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
									title="Move Down"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M19 9l-7 7-7-7"
										/></svg
									>
								</button>
								<!-- Delete -->
								<button
									type="button"
									on:click={() => removeVariant(index)}
									class="p-2 bg-white border-[2px] border-gray-300 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-600 hover:shadow-[2px_2px_0_0_#ef4444] transition-all"
									title="Remove Variant"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/></svg
									>
								</button>
							</div>
						</div>

						<!-- Body: Rules-first layout -->
						<div class="relative z-10 bg-white/80 backdrop-blur-sm">
							<!-- Template select (full width) -->
							<div class="px-6 py-4 border-b-[2px] border-gray-200">
								<label
									class="block text-xs font-black uppercase tracking-widest text-gray-800 mb-2"
								>
									Template <span class="text-red-500">*</span>
								</label>
								<TemplateSelector
									bind:value={variant.templateUid}
									on:change={() => handleVariantTemplateSelect(index)}
								/>
							</div>

							<!-- Rules (full width — the star of the card) -->
							<div class="p-6">
								<RuleBuilder
									bind:conditions={variant.conditions}
									isDefault={false}
									on:change={() => {
										form.variants = form.variants;
									}}
								/>
							</div>

							<!-- Peek strip + Expandable drawer (wrapped for @const scope) -->
							{#if true}
								{@const varEditors = variantVarEditors[index] || []}
								{@const customizedCount = varEditors.filter(
									(r) => r.value && r.value.trim() !== ''
								).length}
								{@const previewValues = varEditors
									.filter((r) => r.value && r.value.trim() !== '')
									.slice(0, 2)}

								<!-- Peek strip -->
								<div
									class="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-t-[2px] border-gray-200"
								>
									<!-- Thumbnail -->
									<div
										class="w-14 h-10 rounded border-[1.5px] border-gray-200 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center"
									>
										{#if variantPreviews[index]?.url}
											<img
												src={variantPreviews[index].url}
												alt="Thumb"
												class="w-full h-full object-cover"
											/>
										{:else}
											<svg
												class="w-5 h-5 text-gray-300"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										{/if}
									</div>

									<!-- Variable summary -->
									<div class="flex-1 min-w-0">
										<p class="text-xs font-bold text-gray-600">
											{varEditors.length} variable{varEditors.length !== 1 ? 's' : ''}
											{#if customizedCount > 0}
												<span class="text-gray-400"> · </span>
												<span class="text-gray-900">{customizedCount} customized</span>
											{/if}
										</p>
										{#if previewValues.length > 0}
											<p class="text-[10px] text-gray-400 truncate mt-0.5">
												{previewValues
													.map((r) => `${humanizeVarName(r.key)}: ${r.value}`)
													.join(' · ')}
											</p>
										{/if}
									</div>

									<!-- Expand/collapse toggle -->
									<button
										type="button"
										on:click={() => {
											expandedVariants[variant.id] =
												expandedVariants[variant.id] === false ? true : false;
											expandedVariants = expandedVariants;
										}}
										class="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-gray-300 rounded-lg bg-white text-xs font-bold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all shrink-0"
									>
										{expandedVariants[variant.id] !== false ? 'Hide' : 'Edit'} Variables & Preview
										<svg
											class="w-3.5 h-3.5 transition-transform {expandedVariants[variant.id] !==
											false
												? 'rotate-180'
												: ''}"
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
								</div>

								<!-- Expandable drawer -->
								{#if expandedVariants[variant.id] !== false}
									<div transition:slide={{ duration: 200 }} class="border-t-[2px] border-gray-200">
										<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
											<!-- Variables -->
											<div
												class="p-5 space-y-3 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-gray-200"
											>
												<div class="flex items-center justify-between">
													<label class="text-xs font-black uppercase tracking-widest text-gray-900"
														>Variables</label
													>
													{#if varEditors.length > 0}
														<span
															class="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-2 py-1 rounded"
														>
															{varEditors.length} Editable
														</span>
													{/if}
												</div>
												{#if varEditors.length > 0}
													<div class="space-y-2.5">
														{#each variantVarEditors[index] as row, rowIndex}
															<div class="space-y-1.5">
																<div class="flex flex-col sm:flex-row sm:items-center gap-2">
																	<label
																		class="sm:w-1/3 px-3 py-2 bg-gray-200 border-[2px] border-gray-300 rounded-lg text-xs font-black text-gray-700 truncate"
																		title={row.key}
																	>
																		{humanizeVarName(row.key)}
																	</label>
																	<div class="flex-1 flex gap-1.5">
																		<input
																			type="text"
																			bind:this={varInputRefs[getInputRefKey(index, rowIndex)]}
																			bind:value={row.value}
																			on:input={() => syncVarsFromEditor(index)}
																			placeholder="Override value or use dynamic tags →"
																			class="flex-1 px-3 py-2 border-[2px] border-gray-400 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-gray-900 focus:bg-[#FFFDF8] transition-colors"
																		/>
																		{#if contextVariables.length > 0}
																			<button
																				type="button"
																				on:click={() => toggleContextVars(index, rowIndex)}
																				class="px-2 py-2 border-[2px] rounded-lg text-xs font-black transition-all shrink-0 {showContextVars[
																					`${index}-${rowIndex}`
																				]
																					? 'border-[#ffc480] bg-[#ffc480]/20 text-gray-900'
																					: 'border-gray-300 bg-white text-gray-500 hover:border-gray-900 hover:text-gray-900'}"
																				title="Insert dynamic context variable"
																			>
																				<svg
																					class="w-4 h-4"
																					fill="none"
																					stroke="currentColor"
																					viewBox="0 0 24 24"
																					><path
																						stroke-linecap="round"
																						stroke-linejoin="round"
																						stroke-width="2"
																						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
																					/></svg
																				>
																			</button>
																		{/if}
																	</div>
																</div>
																{#if showContextVars[`${index}-${rowIndex}`]}
																	<div
																		class="ml-0 sm:ml-[calc(33.333%+0.5rem)] p-3 bg-gray-50 border-[2px] border-dashed border-[#ffc480] rounded-lg"
																		transition:slide={{ duration: 150 }}
																	>
																		<p
																			class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2"
																		>
																			Insert Dynamic Tag
																		</p>
																		<div class="space-y-2">
																			{#each Object.entries(ctxVarsByCategory) as [cat, vars]}
																				{#if vars.length > 0}
																					<div>
																						<p
																							class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1"
																						>
																							{ctxCategoryIcons[cat]}
																							{ctxCategoryLabels[cat]}
																						</p>
																						<div class="flex flex-wrap gap-1">
																							{#each vars as cv}
																								<button
																									type="button"
																									on:click={() =>
																										insertContextVar(index, rowIndex, cv.key)}
																									class="px-2 py-1 bg-white border-[1.5px] border-gray-300 rounded-md text-[10px] font-bold text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
																									title="{cv.label} — e.g. {cv.example}"
																								>
																									{cv.label}
																								</button>
																							{/each}
																						</div>
																					</div>
																				{/if}
																			{/each}
																		</div>
																	</div>
																{/if}
															</div>
														{/each}
													</div>
												{:else}
													<p class="text-xs font-bold text-gray-400 text-center py-4">
														{getResolvedTemplateUid(index)
															? 'No variables defined.'
															: 'Select template first.'}
													</p>
												{/if}
											</div>

											<!-- Preview (no browser chrome) -->
											<div class="p-5 bg-gray-50/50">
												<div class="flex items-center justify-between mb-2">
													<label
														class="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"
													>
														<svg
															class="w-3.5 h-3.5 text-[#ffc480]"
															fill="currentColor"
															viewBox="0 0 24 24"
															><path
																d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
															/></svg
														>
														Preview
													</label>
													{#if variantPreviews[index]?.loading}
														<svg
															class="w-3 h-3 animate-spin text-gray-400"
															fill="none"
															viewBox="0 0 24 24"
															><circle
																class="opacity-25"
																cx="12"
																cy="12"
																r="10"
																stroke="currentColor"
																stroke-width="4"
															/><path
																class="opacity-75"
																fill="currentColor"
																d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
															/></svg
														>
													{/if}
												</div>
												<div
													class="rounded-lg border-[2px] border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center p-3 min-h-[140px]"
												>
													{#if templateDataCache[getResolvedTemplateUid(index)]?.engine === 'html'}
														{#key getResolvedTemplateUid(index)}
															<SnippetThumbnail
																body={templateDataCache[getResolvedTemplateUid(index)]?.html || ''}
																cardWidth={300}
																cardHeight={180}
																naturalWidth={templateDataCache[getResolvedTemplateUid(index)]?.width || 1080}
																naturalHeight={templateDataCache[getResolvedTemplateUid(index)]?.height || 1080}
																overrideVars={variant.variables || {}}
															/>
														{/key}
													{:else if variantPreviews[index]?.url}
														<img
															src={variantPreviews[index].url}
															alt="Preview {variant.name}"
															class="max-w-full max-h-[200px] object-contain pointer-events-none"
														/>
													{:else if variantPreviews[index]?.error}
														<p class="text-[10px] font-black uppercase text-red-600 text-center">
															{variantPreviews[index].error}
														</p>
													{:else}
														<p class="text-[10px] font-bold text-gray-400 text-center">
															Awaiting template...
														</p>
													{/if}
												</div>
											</div>
										</div>
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/each}

				<!-- Add Rule Variant Button -->
				<button
					type="button"
					on:click={addRuleVariant}
					class="w-full py-4 border-[3px] border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-blue-50 hover:shadow-[3px_3px_0_0_#3b82f6] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
				>
					<div
						class="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-[#3b82f6] group-hover:text-white flex items-center justify-center transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M12 4v16m8-8H4"
							/>
						</svg>
					</div>
					<span class="text-xs font-black uppercase tracking-wide text-inherit"
						>Add Rule Variant</span
					>
				</button>

				<!-- Integration Preview -->
				<div>
					<h3 class="text-sm font-black uppercase tracking-widest text-gray-500 ml-2 mb-4">
						Integration
					</h3>
					<IntegrationPreview
						slug={form.slug}
						format={form.outputConfig.format}
						experimentLabel="Smart Link"
					/>
				</div>

				<!-- Action Bar -->
				<div
					class="bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[6px_6px_0_0_#1f2937] flex flex-col md:flex-row items-center justify-between gap-4"
				>
					<button
						type="button"
						on:click={prevStep}
						class="w-full md:w-auto px-4 py-2.5 border-[2px] border-gray-300 bg-white rounded-lg text-xs font-black text-gray-500 hover:text-gray-900 hover:border-gray-900 uppercase tracking-wide transition-all shadow-sm hover:shadow-[3px_3px_0_0_#1f2937]"
					>
						&larr; Back to Basics
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
									Launching...
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
