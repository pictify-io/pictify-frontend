<script>
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTemplateById, getTemplateVariables, batchRenderFromCsv, uploadCsvForBatch, getBatchJobResults, cancelBatchJob } from '../../../../../api/template';
	import { getApiToken, createApiToken } from '../../../../../api/user';
	import { user } from '../../../../../store/user.store';
	import { toast } from '../../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import EmailVerificationRequired from '$lib/components/dashboard/EmailVerificationRequired.svelte';
	import { analytics } from '$lib/analytics.js';
	import Papa from 'papaparse';
	import JSZip from 'jszip';

	// === STATE ===
	let step = 'upload'; // upload | map | progress | results
	let template = null;
	let variables = [];
	let isLoading = true;

	// CSV State
	let csvFile = null;
	let csvHeaders = [];
	let csvRows = [];
	let previewRows = [];

	// Mapping State
	let mappings = {}; // { variableName: csvColumnName }

	// Batch State
	let batchId = null;
	let progress = { completed: 0, failed: 0, total: 0, status: 'pending' };
	let results = [];
	let errors = [];
	let batchError = null; // Error message to display prominently

	// API Key state
	let apiTokens = [];
	let selectedApiKey = '';
	let isCreatingToken = false;

	// Email verification state
	$: isEmailVerified = $user?.isEmailVerified;
	$: userEmail = $user?.email || '';

	// Race Condition Guards
	let loadVersion = 0;
	let parseVersion = 0;
	let pollVersion = 0;
	let pollAbortController = null;
	let destroyed = false;

	$: uid = $page.params.uid;

	// Debug: log step changes
	$: console.log('[Step Change] step is now:', step, 'isLoading:', isLoading, 'template:', template?.name || 'null');

	// Track previous UID to prevent unnecessary resets
	let previousUid = null;

	// Re-load when UID changes (only if actually different)
	$: if (uid && uid !== previousUid) {
		console.log('[UID Change] uid changed from', previousUid, 'to', uid, 'current step:', step);
		previousUid = uid;
		// Only reset and reload if not in the middle of a batch operation
		if (step === 'upload' || step === 'map') {
			console.log('[UID Change] Calling reset() and loadTemplate() because step is:', step);
			template = null;
			variables = [];
			reset();
			loadTemplate();
		} else {
			console.log('[UID Change] NOT calling reset/loadTemplate because step is:', step);
		}
		analytics.trackDashboardPage({ page_name: 'template_bulk_render', template_id: uid });
	}

	// === LIFECYCLE ===
	onDestroy(() => {
		destroyed = true;
		loadVersion++;
		parseVersion++;
		pollVersion++;
		pollAbortController?.abort();
	});

	// === TEMPLATE LOADING (with race guard) ===
	async function loadTemplate() {
		const thisVersion = ++loadVersion;
		isLoading = true;

		try {
			const [templateRes, varsRes, tokensRes] = await Promise.all([
				getTemplateById(uid),
				getTemplateVariables(uid),
				getApiToken()
			]);

			if (destroyed || thisVersion !== loadVersion) return;

			if (!templateRes?.template) {
				toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
				goto('/dashboard/template');
				return;
			}

			template = templateRes.template;
			variables = varsRes?.variables || [];
			apiTokens = tokensRes?.apiTokens || [];

			// Auto-select the first token if available
			if (apiTokens.length > 0 && !selectedApiKey) {
				selectedApiKey = apiTokens[0].token;
			}
		} catch (error) {
			if (thisVersion === loadVersion) {
				console.error('Error loading template:', error);
				toast.set({ message: 'Failed to load template', type: 'error', duration: 3000 });
			}
		} finally {
			if (thisVersion === loadVersion) {
				isLoading = false;
			}
		}
	}

	// === CSV PARSING (with PapaParse + Web Worker) ===
	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file
		if (!file.name.endsWith('.csv')) {
			toast.set({ message: 'Please upload a CSV file', type: 'error', duration: 3000 });
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.set({ message: 'File must be under 5MB', type: 'error', duration: 3000 });
			return;
		}

		csvFile = file;
		const thisParseVersion = ++parseVersion;

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			worker: true, // Use Web Worker for large files
			complete: (parseResults) => {
				if (thisParseVersion !== parseVersion) return; // Stale parse

				if (parseResults.errors.length > 0) {
					toast.set({ message: `CSV parse error: ${parseResults.errors[0].message}`, type: 'error', duration: 3000 });
					return;
				}

				if (parseResults.data.length === 0) {
					toast.set({ message: 'CSV file is empty', type: 'error', duration: 3000 });
					return;
				}

				csvHeaders = parseResults.meta.fields || [];
				csvRows = parseResults.data;
				previewRows = parseResults.data.slice(0, 5);

				// Auto-map columns (exact match only)
				mappings = autoMapColumns(csvHeaders, variables);

				step = 'map';
			},
			error: (error) => {
				if (thisParseVersion !== parseVersion) return;
				toast.set({ message: `Parse failed: ${error.message}`, type: 'error', duration: 3000 });
			}
		});
	}

	// === COLUMN MAPPING (simple exact match) ===
	function autoMapColumns(headers, vars) {
		const result = {};
		for (const v of vars) {
			const exactMatch = headers.find(h =>
				h.toLowerCase().trim() === v.name.toLowerCase().trim()
			);
			if (exactMatch) {
				result[v.name] = exactMatch;
			}
		}
		return result;
	}

	function getUnmappedRequired() {
		return variables
			.filter(v => v.required && !mappings[v.name])
			.map(v => v.name);
	}

	$: unmappedRequired = getUnmappedRequired();
	$: canStartBatch = unmappedRequired.length === 0 && csvRows.length > 0 && selectedApiKey;

	// === BATCH SUBMISSION ===
	let isBatchSubmitting = false;

	async function startBatch() {
		console.log('[startBatch] Called, isBatchSubmitting:', isBatchSubmitting);

		// Double-click guard
		if (isBatchSubmitting) {
			console.log('[startBatch] Already submitting, returning early');
			return;
		}

		if (!canStartBatch) {
			console.log('[startBatch] Cannot start batch - canStartBatch is false');
			if (!selectedApiKey) {
				toast.set({ message: 'Please select an API key', type: 'error', duration: 3000 });
			} else if (unmappedRequired.length > 0) {
				toast.set({ message: `Map required variables: ${unmappedRequired.join(', ')}`, type: 'error', duration: 3000 });
			}
			return;
		}

		if (!csvFile) {
			console.log('[startBatch] No CSV file');
			toast.set({ message: 'Please upload a CSV file', type: 'error', duration: 3000 });
			return;
		}

		console.log('[startBatch] Starting batch process');
		isBatchSubmitting = true;
		batchError = null; // Clear any previous error
		progress = { completed: 0, failed: 0, total: csvRows.length, status: 'uploading' };
		step = 'progress';
		console.log('[startBatch] Step set to:', step);

		try {
			// Step 1: Upload CSV to get URL
			console.log('[startBatch] Uploading CSV...');
			const uploadResult = await uploadCsvForBatch(csvFile);
			console.log('[startBatch] Upload result:', uploadResult);
			const csvUrl = uploadResult.url;

			if (!csvUrl) {
				throw new Error('Failed to get CSV URL from upload');
			}

			progress.status = 'submitting';
			console.log('[startBatch] CSV uploaded, submitting batch...');

			// Step 2: Send mappings directly as { templateVar: csvColumn }
			// This format allows multiple template variables to map to the same CSV column
			console.log('[startBatch] Mappings:', mappings);

			// Step 3: Call batch render with CSV URL and mappings
			// Note: template.outputFormat is 'image' or 'pdf', not the actual render format
			const response = await batchRenderFromCsv(uid, csvUrl, mappings, {
				format: 'png',
				quality: 0.9,
				concurrency: 5,
				headers: {
					'Authorization': `Bearer ${selectedApiKey}`
				}
			});
			console.log('[startBatch] Batch render response:', response);

			batchId = response.batchId;
			progress.total = response.totalItems;
			progress.status = 'processing';
			console.log('[startBatch] Batch created, batchId:', batchId, 'totalItems:', progress.total);

			// Track batch submission
			analytics.track('bulk_render_started', {
				template_id: uid,
				item_count: response.totalItems
			});

			// Start polling with cancellation support
			console.log('[startBatch] Starting polling for batchId:', response.batchId);
			startPolling(response.batchId);
			console.log('[startBatch] Batch started successfully, step:', step, 'batchId:', batchId);
		} catch (error) {
			console.error('[startBatch] Error:', error);
			isBatchSubmitting = false;
			progress.status = 'failed';
			step = 'map'; // Go back to mapping step so user can try again
			const errorMessage = error?.message || 'Unknown error occurred';
			batchError = errorMessage; // Store error for prominent display
			toast.set({ message: errorMessage, type: 'error', duration: 10000 });
		}
	}

	// === POLLING (with race guards + exponential backoff) ===
	async function startPolling(id) {
		console.log('[Polling] Starting polling for batch:', id, 'pollVersion:', pollVersion + 1);
		const thisVersion = ++pollVersion;
		pollAbortController = new AbortController();

		let interval = 1000;
		const maxInterval = 5000;
		let consecutiveErrors = 0;
		const maxConsecutiveErrors = 10;

		console.log('[Polling] Entering polling loop, thisVersion:', thisVersion);

		while (!pollAbortController.signal.aborted) {
			console.log('[Polling] Loop iteration - aborted:', pollAbortController.signal.aborted, 'destroyed:', destroyed, 'thisVersion:', thisVersion, 'pollVersion:', pollVersion);

			if (destroyed || thisVersion !== pollVersion) {
				console.log('[Polling] Stopped - destroyed:', destroyed, 'version mismatch:', thisVersion !== pollVersion);
				return;
			}

			try {
				console.log('[Polling] Fetching batch results for:', id, 'at', new Date().toISOString());
				const result = await getBatchJobResults(id);
				console.log('[Polling] Result:', result);

				if (destroyed || thisVersion !== pollVersion) return;

				if (result) {
					consecutiveErrors = 0; // Reset error count on success

					progress = {
						completed: result.completedItems || 0,
						failed: result.failedItems || 0,
						total: result.totalItems || progress.total,
						status: result.status
					};
					console.log('[Polling] Updated progress:', progress);

					if (['completed', 'partial', 'failed', 'cancelled'].includes(result.status)) {
						console.log('[Polling] Batch finished with status:', result.status);
						results = result.results || [];
						errors = result.errors || [];
						step = 'results';

						// Track completion
						analytics.track('bulk_render_completed', {
							template_id: uid,
							status: result.status,
							successful: results.filter(r => r.success).length,
							failed: errors.length
						});

						return;
					}
				} else {
					// Result is null - might be an auth error or batch not found
					consecutiveErrors++;
					console.warn(`[Polling] Returned null for batch ${id}, error count: ${consecutiveErrors}`);

					if (consecutiveErrors >= maxConsecutiveErrors) {
						console.error(`[Polling] Too many consecutive errors for batch ${id}, stopping`);
						toast.set({ message: 'Lost connection to batch job. Please refresh the page.', type: 'error', duration: 5000 });
						progress.status = 'failed';
						step = 'results';
						return;
					}
				}
			} catch (error) {
				if (thisVersion !== pollVersion) return;
				consecutiveErrors++;
				console.error(`[Polling] Error for batch ${id}:`, error);

				// Check for specific error messages that should stop polling immediately
				const errorMessage = error?.message || 'Unknown error';
				const isBlockedError = errorMessage.includes('blocked') || errorMessage.includes('suspended');
				const isAuthError = error?.status === 401 || error?.status === 403;

				if (isBlockedError || isAuthError) {
					// Show the actual error message to the user
					toast.set({ message: errorMessage, type: 'error', duration: 10000 });
					progress.status = 'failed';
					step = 'results';
					return;
				}

				if (consecutiveErrors >= maxConsecutiveErrors) {
					toast.set({ message: 'Failed to get batch status. Please refresh the page.', type: 'error', duration: 5000 });
					progress.status = 'failed';
					step = 'results';
					return;
				}

				// Continue polling on error, with longer backoff
				interval = Math.min(interval * 2, 10000);
			}

			await sleep(interval);
			// Only increase interval on consecutive errors
			if (consecutiveErrors > 0) {
				interval = Math.min(interval * 1.5, maxInterval);
			} else {
				interval = 1000; // Reset to fast polling on success
			}
		}
	}

	async function handleCancel() {
		if (!batchId) return;

		pollAbortController?.abort();
		pollVersion++;

		try {
			await cancelBatchJob(batchId);
			progress.status = 'cancelled';
			step = 'results';
			toast.set({ message: 'Batch cancelled', type: 'info', duration: 3000 });
		} catch (error) {
			toast.set({ message: 'Failed to cancel batch', type: 'error', duration: 3000 });
		}
	}

	// === ZIP DOWNLOAD (chunked for memory) ===
	let isDownloading = false;
	let downloadProgress = 0;

	async function downloadAsZip() {
		const successResults = results.filter(r => r.success);
		if (successResults.length === 0) {
			toast.set({ message: 'No successful renders to download', type: 'error', duration: 3000 });
			return;
		}

		isDownloading = true;
		downloadProgress = 0;

		const zip = new JSZip();
		const CHUNK_SIZE = 5; // Fetch 5 at a time

		try {
			for (let i = 0; i < successResults.length; i += CHUNK_SIZE) {
				const chunk = successResults.slice(i, i + CHUNK_SIZE);

				await Promise.all(chunk.map(async (result, idx) => {
					const response = await fetch(result.url);
					const blob = await response.blob();
					const ext = 'png';
					const filename = `render-${String(i + idx + 1).padStart(4, '0')}.${ext}`;
					zip.file(filename, blob);
				}));

				downloadProgress = Math.round(((i + chunk.length) / successResults.length) * 100);
			}

			const blob = await zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: { level: 6 }
			});

			// Trigger download
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `bulk-render-${batchId}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.set({ message: `Downloaded ${successResults.length} images`, type: 'success', duration: 3000 });

			// Track download
			analytics.trackDownload({
				content_type: 'bulk_render_zip',
				item_count: successResults.length,
				template_id: uid
			});
		} catch (error) {
			toast.set({ message: `Download failed: ${error.message}`, type: 'error', duration: 3000 });
		} finally {
			isDownloading = false;
		}
	}

	// === API KEY ===
	async function handleCreateToken() {
		if (isCreatingToken || destroyed) return;
		isCreatingToken = true;
		try {
			const result = await createApiToken();
			if (destroyed) return;
			if (result?.apiToken) {
				apiTokens = [...apiTokens, result.apiToken];
				selectedApiKey = result.apiToken.token;
				toast.set({ message: 'API key created', type: 'success', duration: 2000 });
			}
		} catch (error) {
			if (destroyed) return;
			toast.set({ message: 'Failed to create API key', type: 'error', duration: 3000 });
		} finally {
			if (!destroyed) {
				isCreatingToken = false;
			}
		}
	}

	// === UTILITIES ===
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function reset() {
		pollAbortController?.abort();
		pollVersion++;
		isBatchSubmitting = false;
		step = 'upload';
		csvFile = null;
		csvHeaders = [];
		csvRows = [];
		previewRows = [];
		mappings = {};
		batchId = null;
		progress = { completed: 0, failed: 0, total: 0, status: 'pending' };
		results = [];
		errors = [];
		batchError = null;
	}

	function downloadSingle(url, index) {
		const a = document.createElement('a');
		a.href = url;
		const ext = 'png';
		a.download = `render-${String(index + 1).padStart(4, '0')}.${ext}`;
		a.target = '_blank';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	// Steps for indicator
	const steps = ['upload', 'map', 'progress', 'results'];
	$: currentStepIndex = steps.indexOf(step);
</script>

<section class="min-h-full pb-12">

	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
		<div>
			<button
				class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1 transition-colors mb-2"
				on:click={() => goto('/dashboard/template')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
				Back to Templates
			</button>

			<div class="flex items-center gap-3">
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					{#if template}
						{template.name}
					{:else}
						Loading...
					{/if}
				</h1>
				<div class="px-2 py-1 bg-[#ff6b6b] text-white border-[2px] border-gray-900 rounded text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
					Bulk Render
				</div>
			</div>
			<p class="text-gray-600 font-bold mt-2 text-sm sm:text-base max-w-2xl">
				Upload a CSV file to generate multiple images in a single batch.
			</p>
		</div>

		<!-- Mode Tabs -->
		<div class="flex bg-gray-100 p-1.5 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-400 cursor-not-allowed border-[2px] border-transparent"
				disabled
			>
				Editor
			</button>
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 border-[2px] border-transparent"
				on:click={() => goto(`/dashboard/template/${uid}/render`)}
			>
				Render
			</button>
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all bg-[#ff6b6b] text-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				Bulk
			</button>
			<button
				class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 border-[2px] border-transparent"
				on:click={() => goto(`/dashboard/template/${uid}/dynamic`)}
			>
				Dynamic
			</button>
		</div>
	</div>

	<div>
		{#if isLoading}
			<div class="flex items-center justify-center py-32">
				<Loader size="16" show={true} />
			</div>
		{:else if template}
			<!-- Step Indicator -->
			<div class="flex gap-4 mb-8 px-1">
				{#each steps as s, i}
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl border-[3px] border-gray-900 flex items-center justify-center font-black text-sm shadow-[3px_3px_0_0_#1f2937] transition-all
							{currentStepIndex === i ? 'bg-[#ffc480] -translate-y-1' : i < currentStepIndex ? 'bg-[#4ade80] text-gray-900' : 'bg-white text-gray-400'}">
							{#if i < currentStepIndex}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<div class="hidden sm:flex flex-col">
							<span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Step {i + 1}</span>
							<span class="text-sm font-black capitalize text-gray-900 leading-tight">{s}</span>
						</div>
					</div>
					{#if i < steps.length - 1}
						<div class="flex-1 h-[3px] bg-gray-200 self-center rounded-full mx-2 {i < currentStepIndex ? 'bg-gray-900' : ''}"></div>
					{/if}
				{/each}
			</div>

			<!-- Step Content -->
			{#if step === 'upload'}
				<!-- CSV Upload -->
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div class="lg:col-span-7">
						<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
							<div class="bg-[#ffc480] border-b-[3px] border-gray-900 px-6 py-4 flex justify-between items-center">
								<h2 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
									Upload CSV Data
								</h2>
								<div class="px-2 py-0.5 bg-white/50 border-2 border-gray-900 rounded text-[10px] font-bold">.CSV ONLY</div>
							</div>
							<div class="p-8">
								<p class="text-gray-600 font-bold mb-6 text-sm">
									Upload a CSV file where columns match your template variables. The first row must be headers.
								</p>

								<label class="block relative border-[3px] border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer
									hover:border-gray-900 hover:bg-gray-50 hover:shadow-[4px_4px_0_0_#1f2937] transition-all group overflow-hidden">
									<input type="file" accept=".csv" on:change={handleFileSelect} class="hidden" />
									
									<div class="absolute inset-0 bg-stripes-gray opacity-5 pointer-events-none"></div>

									<div class="relative z-10">
										<div class="w-20 h-20 mx-auto bg-white border-[3px] border-gray-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-[4px_4px_0_0_#ccc] group-hover:shadow-[6px_6px_0_0_#1f2937]">
											<svg class="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
										</div>
										<div class="font-black text-xl text-gray-900 group-hover:underline decoration-4 decoration-[#ffc480]">
											Click to upload
										</div>
										<div class="text-sm font-bold text-gray-500 mt-2">or drag & drop your generic CSV file here</div>
									</div>
								</label>

								{#if csvFile}
									<div class="mt-6 p-4 bg-[#dcfce7] border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#166534] flex items-center justify-between animate-bounce-in">
										<div class="flex items-center gap-4">
											<div class="w-10 h-10 bg-white border-[2px] border-gray-900 rounded-lg flex items-center justify-center text-lg">
												<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
											</div>
											<div>
												<div class="font-black text-gray-900">{csvFile.name}</div>
												<div class="text-xs font-bold text-green-700 uppercase tracking-wide">{csvRows.length} rows detected</div>
											</div>
										</div>
										<button 
											class="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-600 hover:text-red-500"
											title="Remove file"
											on:click={reset}
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Variables Preview -->
					<div class="lg:col-span-5">
						<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden sticky top-8">
							<div class="bg-gray-100 border-b-[3px] border-gray-900 px-6 py-4">
								<h2 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
									<span class="w-3 h-3 bg-[#4ecdc4] border-2 border-gray-900 rounded-full shadow-[1px_1px_0_0_#000]"></span>
									Required Columns
								</h2>
							</div>
							<div class="p-6">
								<p class="text-gray-600 font-bold mb-4 text-xs uppercase tracking-wide">
									Your CSV needs these columns:
								</p>
								{#if variables.length > 0}
									<div class="space-y-3">
										{#each variables as variable}
											<div class="flex items-center justify-between p-3 bg-white rounded-lg border-[2px] border-gray-200 hover:border-gray-900 hover:shadow-[3px_3px_0_0_#1f2937] transition-all group">
												<span class="font-bold text-gray-900 flex items-center gap-2">
													<div class="w-1.5 h-1.5 rounded-full {variable.required ? 'bg-red-500' : 'bg-gray-300'}"></div>
													{variable.name}
												</span>
												<div class="flex gap-2">
													{#if variable.required}
														<span class="text-[10px] font-black uppercase px-1.5 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded">Req</span>
													{:else}
														<span class="text-[10px] font-black uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded">Opt</span>
													{/if}
													<span class="text-[10px] font-black uppercase px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded">{variable.type}</span>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-gray-500 text-sm italic border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">No variables defined for this template.</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

			{:else if step === 'map'}
				<!-- Column Mapping -->
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div class="lg:col-span-8">
						<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
							<div class="bg-[#60a5fa] border-b-[3px] border-gray-900 px-6 py-4">
								<h2 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 text-shadow-sm">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
									Map Columns to Variables
								</h2>
							</div>
							<div class="p-6 sm:p-8">
								<div class="space-y-6 mb-8">
									{#each variables as variable}
										<div class="group">
											<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
												<label class="w-48 font-bold flex items-center gap-2 text-gray-900">
													<div class="w-6 h-6 rounded bg-gray-100 border-2 border-gray-900 flex items-center justify-center text-xs font-black">
														{variable.name.charAt(0).toUpperCase()}
													</div>
													{variable.name}
													{#if variable.required}<span class="text-red-500 text-lg leading-none">*</span>{/if}
												</label>
												
												<div class="flex-1 flex items-center gap-3">
													<div class="relative flex-1">
														<select
															bind:value={mappings[variable.name]}
															class="w-full pl-4 pr-10 py-3 bg-white border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#60a5fa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all appearance-none cursor-pointer hover:bg-gray-50"
														>
															<option value="">-- Ignored --</option>
															{#each csvHeaders as header}
																<option value={header}>{header}</option>
															{/each}
														</select>
														<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
															<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
														</div>
													</div>
													
													<!-- Visual arrow pointing to preview -->
													<div class="hidden lg:block text-gray-300">
														<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
													</div>
												</div>
											</div>
											
											<!-- Preview Value -->
											<div class="sm:pl-[210px]">
												{#if mappings[variable.name] && previewRows[0]}
													<div class="inline-block px-3 py-1.5 bg-[#eff6ff] border border-blue-200 rounded text-xs font-mono text-blue-900 max-w-full truncate">
														<span class="font-bold text-blue-500 mr-1">Preview:</span> 
														"{previewRows[0][mappings[variable.name]]}"
													</div>
												{:else}
													<div class="h-8"></div>
												{/if}
											</div>
										</div>
										<hr class="border-gray-100 last:hidden">
									{/each}
								</div>

								{#if batchError}
									<div class="mb-8 p-4 bg-red-50 border-[3px] border-red-500 rounded-xl shadow-[4px_4px_0_0_#ef4444]">
										<div class="flex items-start gap-3">
											<svg class="w-8 h-8 text-red-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
											<div>
												<p class="font-black text-red-900 mb-1 uppercase tracking-wide">Batch Start Failed</p>
												<p class="text-sm font-bold text-red-700 leading-relaxed">{batchError}</p>
											</div>
										</div>
									</div>
								{/if}

								{#if unmappedRequired.length > 0}
									<div class="mb-8 p-4 bg-amber-50 border-[3px] border-amber-400 rounded-xl">
										<div class="flex gap-2">
											<svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
											<p class="text-sm font-bold text-amber-800">
												You must map these required fields: <span class="font-black underline">{unmappedRequired.join(', ')}</span>
											</p>
										</div>
									</div>
								{/if}

								<!-- API Key Selection -->
								<div class="bg-gray-50 rounded-xl border-[3px] border-gray-200 border-dashed p-6">
									<div class="flex items-center justify-between mb-4">
										<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
											<span class="w-6 h-6 rounded bg-gray-900 text-white flex items-center justify-center">
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
											</span>
											Select API Key
										</h3>
										<a href="/dashboard/settings" class="text-xs font-bold text-gray-500 hover:text-gray-900 underline">Manage Drafts</a>
									</div>
									
									{#if apiTokens.length > 0}
										<div class="flex gap-3">
											<div class="relative flex-1">
												<select
													bind:value={selectedApiKey}
													class="w-full pl-4 pr-10 py-3 bg-white border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1f2937] transition-all appearance-none"
												>
													{#each apiTokens as token}
														<option value={token.token}>
															{token.name || 'API Key'} (..{token.token.slice(-4)})
														</option>
													{/each}
												</select>
												<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
													<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
												</div>
											</div>
											<button
												type="button"
												class="px-4 bg-white hover:bg-gray-100 border-[3px] border-gray-900 rounded-lg text-gray-900 transition-colors disabled:opacity-50"
												on:click={handleCreateToken}
												disabled={isCreatingToken}
												title="Create new API key"
											>
												{#if isCreatingToken}
													<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
														<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
														<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
												{:else}
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
													</svg>
												{/if}
											</button>
										</div>
									{:else}
										<div class="text-center py-4">
											<p class="text-sm font-bold text-gray-500 mb-3">No API keys found.</p>
											<button
												type="button"
												class="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
												on:click={handleCreateToken}
												disabled={isCreatingToken}
											>
												Create One Now
											</button>
										</div>
									{/if}
								</div>
							</div>
							
							<div class="bg-gray-50 border-t-[3px] border-gray-900 px-6 py-4 flex justify-end gap-3">
								<button
									class="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
									on:click={reset}
								>
									Cancel
								</button>
								<button
									class="px-8 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-black rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-widest text-sm"
									on:click={startBatch}
									disabled={!canStartBatch || isBatchSubmitting}
								>
									{#if isBatchSubmitting}
										<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Starting...
									{:else}
										<span>Start Processing</span>
										<div class="bg-white/20 px-1.5 rounded text-[10px]">{csvRows.length} Items</div>
									{/if}
								</button>
							</div>
						</div>
					</div>
					
					<div class="lg:col-span-4">
						<div class="bg-[#eff6ff] border-[3px] border-[#60a5fa] rounded-xl p-6 shadow-[8px_8px_0_0_#bfdbfe]">
							<h3 class="font-black text-blue-900 uppercase tracking-widest text-sm mb-4">Tips</h3>
							<ul class="space-y-3">
								<li class="flex gap-2 text-sm text-blue-900 font-medium">
									<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
									<span>Images are generated in parallel. Large batches may take a few minutes.</span>
								</li>
								<li class="flex gap-2 text-sm text-blue-900 font-medium">
									<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
									<span>Results are stored for 24 hours. Download your ZIP file immediately.</span>
								</li>
								<li class="flex gap-2 text-sm text-blue-900 font-medium">
									<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
									<span>Check variable mappings carefully to avoid wasted credits.</span>
								</li>
							</ul>
						</div>
					</div>
				</div>

			{:else if step === 'progress'}
				<div class="max-w-3xl mx-auto">
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="bg-gray-900 text-white px-8 py-6 text-center">
							<h2 class="text-2xl font-black tracking-tighter mb-1">
								Computing Batch
							</h2>
							<p class="text-gray-400 text-sm font-bold uppercase tracking-widest">
								{progress.status === 'uploading' ? 'Uploading Data...' : 'Rendering Images...'}
							</p>
						</div>
						
						<div class="p-8 sm:p-12">
							<div class="mb-8 text-center">
								<svg class="w-16 h-16 mx-auto mb-4 text-gray-900 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
								<div class="text-6xl font-black text-gray-900 mb-2 tabular-nums">
									{Math.round((progress.completed / (progress.total || 1)) * 100)}%
								</div>
								<div class="flex justify-center gap-6 text-sm font-bold text-gray-500">
									<div class="flex items-center gap-1">
										<div class="w-3 h-3 bg-green-500 rounded-full"></div>
										<span class="text-gray-900">{progress.completed}</span> done
									</div>
									<div class="flex items-center gap-1">
										<div class="w-3 h-3 bg-red-500 rounded-full"></div>
										<span class="text-gray-900">{progress.failed}</span> failed
									</div>
									<div class="flex items-center gap-1">
										<div class="w-3 h-3 bg-gray-300 rounded-full"></div>
										<span class="text-gray-900">{progress.total}</span> total
									</div>
								</div>
							</div>
							
							<!-- Chunky Progress Bar -->
							<div class="h-8 w-full bg-gray-100 border-[3px] border-gray-900 rounded-lg overflow-hidden relative mb-8">
								<div class="absolute inset-0 bg-stripes-gray opacity-20"></div>
								<div 
									class="h-full bg-[#4ade80] border-r-[3px] border-gray-900 transition-all duration-300 relative overflow-hidden"
									style="width: {Math.max(5, (progress.completed / (progress.total || 1)) * 100)}%"
								>
									<div class="absolute inset-0 bg-stripes-white opacity-30 animate-slide"></div>
								</div>
							</div>
							
							{#if progress.status === 'failed'}
								<div class="text-center p-4 bg-red-50 border-2 border-red-100 rounded-xl mb-6">
									<p class="text-red-600 font-bold mb-2">Something went wrong.</p>
									<button class="text-sm font-black underline hover:text-red-800" on:click={() => step = 'map'}>Try Again</button>
								</div>
							{:else}
								<div class="flex justify-center">
									<button 
										class="text-gray-400 font-bold text-sm hover:text-red-500 transition-colors flex items-center gap-2"
										on:click={handleCancel}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
										Cancel Batch
									</button>
								</div>
							{/if}
						</div>
					</div>
					
					<div class="mt-8 text-center">
						<div class="inline-block px-4 py-2 bg-[#eff6ff] text-blue-700 border-2 border-blue-200 rounded-full text-xs font-bold animate-pulse">
							Running on {progress.total > 50 ? 'High-Performance' : 'Standard'} Cluster
						</div>
					</div>
				</div>

			{:else if step === 'results'}
				<div class="flex flex-col gap-8">
					<!-- Header Summary -->
					<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
						<div class="flex items-center gap-4">
							<div class="w-16 h-16 bg-[#4ade80] border-[3px] border-gray-900 rounded-full flex items-center justify-center text-gray-900 shadow-[4px_4px_0_0_#166534]">
								<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
							</div>
							<div>
								<h2 class="text-2xl font-black text-gray-900 tracking-tighter">Batch Complete!</h2>
								<div class="flex gap-4 text-sm font-bold text-gray-600">
									<span class="text-green-600">{results.filter(r => r.success).length} successful</span>
									{#if errors.length > 0}
										<span class="text-red-600">{errors.length} failed</span>
									{/if}
								</div>
							</div>
						</div>
						
						<div class="flex gap-3">
							<button
								class="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border-[3px] border-transparent hover:border-gray-900 transition-all"
								on:click={reset}
							>
								Start New Batch
							</button>
							<button
								class="px-8 py-3 bg-[#4ade80] hover:bg-[#22c55e] text-gray-900 font-black rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
								on:click={downloadAsZip}
								disabled={isDownloading || results.filter(r => r.success).length === 0}
							>
								{#if isDownloading}
									<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Zipping ({downloadProgress}%)...
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
									Download All
								{/if}
							</button>
						</div>
					</div>

					{#if errors.length > 0}
						<div class="bg-red-50 border-[3px] border-red-500 rounded-xl p-6">
							<h3 class="font-black text-red-900 uppercase tracking-widest text-sm mb-4">Failures ({errors.length})</h3>
							<div class="max-h-60 overflow-y-auto space-y-2 pr-2">
								{#each errors as error}
									<div class="flex items-start gap-2 bg-white p-3 rounded border border-red-200 text-xs text-red-700">
										<span class="font-bold shrink-0">Row {error.row}:</span>
										<span>{error.error}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Grid of Results -->
					{#if results.filter(r => r.success).length > 0}
						<div>
							<h3 class="font-black text-gray-900 uppercase tracking-widest text-sm mb-4 flex items-center justify-between">
								<span>Generated Images</span>
								<span class="text-gray-400 text-xs">Only showing first 50</span>
							</h3>
							
							<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
								{#each results.filter(r => r.success).slice(0, 50) as result, i}
									<div class="group relative aspect-square bg-gray-100 rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[4px_4px_0_0_#ccc] hover:shadow-[6px_6px_0_0_#999] transition-all hover:-translate-y-1">
										<img 
											src={result.url} 
											alt="Result {i}" 
											class="w-full h-full object-cover"
											loading="lazy"
										/>
										
										<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
											<button 
												class="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
												title="Download"
												on:click={() => downloadSingle(result.url, i)}
											>
												<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
											</button>
											<button 
												class="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
												title="Open New Tab"
												on:click={() => window.open(result.url, '_blank')}
											>
												<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
											</button>
										</div>
										
										<div class="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded backdrop-blur-sm">
											#{i + 1}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</section>

<style>
	/* Stripes Pattern for Progress Bar */
	.bg-stripes-white {
		background-image: linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.15) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.15) 50%,
			rgba(255, 255, 255, 0.15) 75%,
			transparent 75%,
			transparent
		);
		background-size: 1rem 1rem;
	}
	
	.bg-stripes-gray {
		background-image: linear-gradient(
			45deg,
			#000 25%,
			transparent 25%,
			transparent 50%,
			#000 50%,
			#000 75%,
			transparent 75%,
			transparent
		);
		background-size: 0.5rem 0.5rem;
	}

	@keyframes slide {
		from { background-position: 1rem 0; }
		to { background-position: 0 0; }
	}

	.animate-slide {
		animation: slide 1s linear infinite;
	}
	
	@keyframes bounce-in {
		0% { transform: scale(0.95); opacity: 0; }
		50% { transform: scale(1.02); }
		100% { transform: scale(1); opacity: 1; }
	}
	
	.animate-bounce-in {
		animation: bounce-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
	}

	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}
</style>
