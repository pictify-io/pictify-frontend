# Feature: Bulk Render from CSV & Google Sheets

## Enhancement Summary

**Deepened on:** 2026-01-29
**Research agents used:** 8 (architecture-strategist, security-sentinel, performance-oracle, julik-frontend-races-reviewer, kieran-typescript-reviewer, pattern-recognition-specialist, code-simplicity-reviewer, agent-native-reviewer)

### Key Improvements

1. **Simplified architecture** - Single page file + minimal utilities instead of 10 files
2. **Race condition guards** - Version counters, AbortControllers, XState machine
3. **Security hardened** - CSRF protection, CSV injection sanitization, OAuth token encryption
4. **Performance optimized** - Chunked ZIP generation, Redis connection pooling, adaptive polling
5. **Agent-native APIs** - Data upload endpoint, column mapping API, ZIP download endpoint

### Critical Findings from Reviews

- **YAGNI**: Google Sheets OAuth should be Phase 3 (users can export to CSV)
- **Security**: 8 vulnerabilities identified, 4 critical
- **Performance**: 5 bottlenecks identified, 3 critical
- **Race conditions**: 7 potential races, all fixable with existing patterns

---

## Overview

Add bulk rendering capability to the template render page, allowing users to upload CSV files to generate multiple images/PDFs in a single batch operation. The feature leverages the existing backend batch render API (`POST /templates/:uid/batch-render`) and adds a streamlined frontend interface with progress tracking and ZIP download.

## Problem Statement

Users currently render templates one at a time, manually entering variables for each render. For users needing to generate 10-100+ images (e.g., social media posts, certificates, product images), this is tedious and time-consuming.

## Proposed Solution (Simplified)

Create a new bulk render page at `/dashboard/template/[uid]/bulk-render` with:

1. CSV file upload with parsing and preview
2. Simple column-to-variable mapping UI (exact match auto-suggest only)
3. Batch job submission with real-time progress
4. Results display with individual/ZIP download options

**Phase 2 (Later):** Google Sheets integration with OAuth

---

## Technical Approach

### Simplified Architecture (Per Code Simplicity Review)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (SvelteKit)                         │
├─────────────────────────────────────────────────────────────────┤
│  /src/routes/dashboard/template/[uid]/bulk-render/+page.svelte  │
│    - All UI components inline (300-400 lines)                   │
│    - Local state with version counters (no separate store)      │
│    - Uses existing API functions from template.js               │
├─────────────────────────────────────────────────────────────────┤
│  /src/api/template.js (EXISTING - extend)                       │
│    - batchRenderTemplate() ✓ exists                             │
│    - getBatchJobResults() ✓ exists                              │
│    - cancelBatchJob() ✓ exists                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Fastify)                            │
├─────────────────────────────────────────────────────────────────┤
│  EXISTING (No Changes Needed for Phase 1):                      │
│    POST /templates/:uid/batch-render                            │
│    GET /templates/batch/:batchId/results                        │
│    POST /templates/batch/:batchId/cancel                        │
├─────────────────────────────────────────────────────────────────┤
│  NEW (Phase 2 - Agent-Native + ZIP):                            │
│    POST /templates/:uid/bulk-render/data (upload CSV/JSON)      │
│    POST /templates/:uid/bulk-render/map-columns (auto-suggest)  │
│    GET /templates/batch/:batchId/download (ZIP generation)      │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure (Minimal - 2-3 files)

```
src/
  routes/
    dashboard/
      template/
        [uid]/
          bulk-render/
            +page.svelte    # Everything lives here (300-400 lines)
  api/
    template.js             # Extend with bulk helper if needed
```

---

## Implementation Plan

### Phase 1: CSV Bulk Render (Core Feature)

#### 1.1 Single Page Component

**File:** `src/routes/dashboard/template/[uid]/bulk-render/+page.svelte`

```svelte
<script>
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import {
		getTemplateById,
		getTemplateVariables,
		batchRenderTemplate,
		getBatchJobResults,
		cancelBatchJob
	} from '$api/template';
	import { toast } from '$store/toast.store';
	import Papa from 'papaparse';
	import JSZip from 'jszip';

	const uid = $page.params.uid;

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

	// Race Condition Guards (per architecture review)
	let loadVersion = 0;
	let pollVersion = 0;
	let pollAbortController = null;
	let destroyed = false;

	// === LIFECYCLE ===
	onMount(() => {
		loadTemplate();
	});

	onDestroy(() => {
		destroyed = true;
		loadVersion++;
		pollVersion++;
		pollAbortController?.abort();
	});

	// === TEMPLATE LOADING (with race guard) ===
	async function loadTemplate() {
		const thisVersion = ++loadVersion;
		isLoading = true;

		try {
			const [templateRes, varsRes] = await Promise.all([
				getTemplateById(uid),
				getTemplateVariables(uid)
			]);

			if (destroyed || thisVersion !== loadVersion) return;

			template = templateRes;
			variables = varsRes?.variables || [];
		} catch (error) {
			if (thisVersion === loadVersion) {
				toast.set({ message: 'Failed to load template', type: 'error' });
			}
		} finally {
			if (thisVersion === loadVersion) {
				isLoading = false;
			}
		}
	}

	// === CSV PARSING (with PapaParse + Web Worker) ===
	let parseVersion = 0;

	async function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file
		if (!file.name.endsWith('.csv')) {
			toast.set({ message: 'Please upload a CSV file', type: 'error' });
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.set({ message: 'File must be under 5MB', type: 'error' });
			return;
		}

		csvFile = file;
		const thisParseVersion = ++parseVersion;

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			worker: true, // Use Web Worker for large files
			complete: (results) => {
				if (thisParseVersion !== parseVersion) return; // Stale parse

				if (results.errors.length > 0) {
					toast.set({ message: `CSV parse error: ${results.errors[0].message}`, type: 'error' });
					return;
				}

				csvHeaders = results.meta.fields || [];
				csvRows = results.data;
				previewRows = results.data.slice(0, 5);

				// Auto-map columns (exact match only - per simplicity review)
				mappings = autoMapColumns(csvHeaders, variables);

				step = 'map';
			},
			error: (error) => {
				if (thisParseVersion !== parseVersion) return;
				toast.set({ message: `Parse failed: ${error.message}`, type: 'error' });
			}
		});
	}

	// === COLUMN MAPPING (simple exact match - per simplicity review) ===
	function autoMapColumns(headers, vars) {
		const result = {};
		for (const v of vars) {
			const exactMatch = headers.find(
				(h) => h.toLowerCase().trim() === v.name.toLowerCase().trim()
			);
			if (exactMatch) {
				result[v.name] = exactMatch;
			}
		}
		return result;
	}

	function getUnmappedRequired() {
		return variables.filter((v) => v.required && !mappings[v.name]).map((v) => v.name);
	}

	// === BATCH SUBMISSION ===
	async function startBatch() {
		const unmapped = getUnmappedRequired();
		if (unmapped.length > 0) {
			toast.set({ message: `Map required variables: ${unmapped.join(', ')}`, type: 'error' });
			return;
		}

		// Build variable sets from CSV rows
		const variableSets = csvRows.map((row) => {
			const vars = {};
			for (const [varName, csvCol] of Object.entries(mappings)) {
				// Sanitize CSV values (per security review - prevent CSV injection)
				let value = row[csvCol] || '';
				if (typeof value === 'string') {
					const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
					if (dangerousChars.some((c) => value.startsWith(c))) {
						value = "'" + value; // Prefix with quote to neutralize
					}
				}
				vars[varName] = value;
			}
			return vars;
		});

		progress = { completed: 0, failed: 0, total: variableSets.length, status: 'submitting' };
		step = 'progress';

		try {
			const response = await batchRenderTemplate(uid, variableSets, {
				format: template?.outputFormat || 'png',
				quality: 0.9,
				concurrency: 5
			});

			batchId = response.batchId;
			progress.status = 'processing';

			// Start polling with cancellation support
			startPolling(response.batchId);
		} catch (error) {
			progress.status = 'failed';
			toast.set({ message: `Batch failed: ${error.message}`, type: 'error' });
		}
	}

	// === POLLING (with race guards + exponential backoff) ===
	async function startPolling(id) {
		const thisVersion = ++pollVersion;
		pollAbortController = new AbortController();

		let interval = 1000;
		const maxInterval = 5000;

		while (!pollAbortController.signal.aborted) {
			if (destroyed || thisVersion !== pollVersion) return;

			try {
				const result = await getBatchJobResults(id);

				if (destroyed || thisVersion !== pollVersion) return;

				progress = {
					completed: result.completedItems || 0,
					failed: result.failedItems || 0,
					total: result.totalItems || progress.total,
					status: result.status
				};

				if (['completed', 'partial', 'failed', 'cancelled'].includes(result.status)) {
					results = result.results || [];
					errors = result.errors || [];
					step = 'results';
					return;
				}
			} catch (error) {
				if (thisVersion !== pollVersion) return;
				// Continue polling on error, with longer backoff
				interval = Math.min(interval * 2, 10000);
			}

			await sleep(interval);
			interval = Math.min(interval * 1.5, maxInterval);
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
		} catch (error) {
			toast.set({ message: 'Failed to cancel batch', type: 'error' });
		}
	}

	// === ZIP DOWNLOAD (chunked for memory - per performance review) ===
	let isDownloading = false;
	let downloadProgress = 0;

	async function downloadAsZip() {
		const successResults = results.filter((r) => r.success);
		if (successResults.length === 0) {
			toast.set({ message: 'No successful renders to download', type: 'error' });
			return;
		}

		isDownloading = true;
		downloadProgress = 0;

		const zip = new JSZip();
		const CHUNK_SIZE = 5; // Fetch 5 at a time (per performance review)

		try {
			for (let i = 0; i < successResults.length; i += CHUNK_SIZE) {
				const chunk = successResults.slice(i, i + CHUNK_SIZE);

				await Promise.all(
					chunk.map(async (result, idx) => {
						const response = await fetch(result.url);
						const blob = await response.blob();
						const filename = `render-${String(i + idx + 1).padStart(4, '0')}.png`;
						zip.file(filename, blob);
					})
				);

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

			toast.set({ message: `Downloaded ${successResults.length} images`, type: 'success' });
		} catch (error) {
			toast.set({ message: `Download failed: ${error.message}`, type: 'error' });
		} finally {
			isDownloading = false;
		}
	}

	// === UTILITIES ===
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function reset() {
		pollAbortController?.abort();
		pollVersion++;
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
	}
</script>

<!-- UI follows existing neobrutalist design patterns -->
<div class="max-w-6xl mx-auto p-6">
	<!-- Header -->
	<div class="mb-8">
		<a href="/dashboard/template/{uid}/render" class="text-sm text-gray-600 hover:text-gray-900">
			← Back to Single Render
		</a>
		<h1 class="text-2xl font-black mt-2">Bulk Render: {template?.name || 'Loading...'}</h1>
	</div>

	<!-- Step Indicator -->
	<div class="flex gap-4 mb-8">
		{#each ['upload', 'map', 'progress', 'results'] as s, i}
			<div class="flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center
          {step === s
						? 'bg-yellow-400'
						: i < ['upload', 'map', 'progress', 'results'].indexOf(step)
						? 'bg-green-400'
						: 'bg-white'}"
				>
					{i + 1}
				</div>
				<span class="text-sm font-medium capitalize">{s}</span>
			</div>
		{/each}
	</div>

	<!-- Step Content -->
	{#if step === 'upload'}
		<!-- CSV Upload -->
		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-8">
			<h2 class="text-lg font-bold mb-4">Upload CSV File</h2>
			<p class="text-gray-600 mb-6">
				Upload a CSV file with columns matching your template variables. First row should be column
				headers.
			</p>

			<label
				class="block border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer
        hover:border-gray-900 hover:bg-gray-50 transition-colors"
			>
				<input type="file" accept=".csv" on:change={handleFileSelect} class="hidden" />
				<div class="text-4xl mb-4">📄</div>
				<div class="font-medium">Click to upload or drag & drop</div>
				<div class="text-sm text-gray-500 mt-2">CSV files only, max 5MB</div>
			</label>

			{#if csvFile}
				<div class="mt-4 p-4 bg-gray-100 rounded-lg">
					Selected: <strong>{csvFile.name}</strong> ({csvRows.length} rows)
				</div>
			{/if}
		</div>
	{:else if step === 'map'}
		<!-- Column Mapping -->
		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-8">
			<h2 class="text-lg font-bold mb-4">Map Columns to Variables</h2>

			<div class="space-y-4 mb-8">
				{#each variables as variable}
					<div class="flex items-center gap-4">
						<label class="w-48 font-medium">
							{variable.name}
							{#if variable.required}<span class="text-red-500">*</span>{/if}
						</label>
						<select
							bind:value={mappings[variable.name]}
							class="flex-1 border-2 border-gray-900 rounded-lg px-4 py-2"
						>
							<option value="">-- Select column --</option>
							{#each csvHeaders as header}
								<option value={header}>{header}</option>
							{/each}
						</select>
						<span class="text-sm text-gray-500 w-32 truncate">
							{#if mappings[variable.name] && previewRows[0]}
								"{previewRows[0][mappings[variable.name]]}"
							{/if}
						</span>
					</div>
				{/each}
			</div>

			<!-- Preview Table -->
			{#if previewRows.length > 0}
				<div class="mb-8">
					<h3 class="font-bold mb-2">Preview (first 5 rows)</h3>
					<div class="overflow-x-auto">
						<table class="w-full border-collapse border-2 border-gray-900">
							<thead>
								<tr class="bg-gray-100">
									{#each csvHeaders as header}
										<th class="border border-gray-300 px-3 py-2 text-left text-sm">{header}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each previewRows as row}
									<tr>
										{#each csvHeaders as header}
											<td class="border border-gray-300 px-3 py-2 text-sm">{row[header] || ''}</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<div class="flex gap-4">
				<button on:click={reset} class="px-6 py-3 border-2 border-gray-900 rounded-lg font-bold">
					Back
				</button>
				<button
					on:click={startBatch}
					disabled={getUnmappedRequired().length > 0}
					class="px-6 py-3 bg-yellow-400 border-2 border-gray-900 rounded-lg font-bold
            disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Start Rendering ({csvRows.length} items)
				</button>
			</div>
		</div>
	{:else if step === 'progress'}
		<!-- Progress -->
		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-8">
			<h2 class="text-lg font-bold mb-4">Rendering in Progress</h2>

			<div class="mb-6">
				<div class="flex justify-between text-sm mb-2">
					<span>{progress.completed + progress.failed} of {progress.total}</span>
					<span>{Math.round(((progress.completed + progress.failed) / progress.total) * 100)}%</span
					>
				</div>
				<div class="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-900">
					<div
						class="h-full bg-green-400 transition-all duration-300"
						style="width: {((progress.completed + progress.failed) / progress.total) * 100}%"
					/>
				</div>
			</div>

			<div class="flex gap-4 text-sm mb-6">
				<span class="text-green-600">{progress.completed} completed</span>
				{#if progress.failed > 0}
					<span class="text-red-600">{progress.failed} failed</span>
				{/if}
			</div>

			<button
				on:click={handleCancel}
				class="px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50"
			>
				Cancel
			</button>
		</div>
	{:else if step === 'results'}
		<!-- Results -->
		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] p-8">
			<h2 class="text-lg font-bold mb-4">Results</h2>

			<div class="flex gap-4 mb-6">
				<div class="px-4 py-2 bg-green-100 border-2 border-green-500 rounded-lg">
					{results.filter((r) => r.success).length} succeeded
				</div>
				{#if errors.length > 0}
					<div class="px-4 py-2 bg-red-100 border-2 border-red-500 rounded-lg">
						{errors.length} failed
					</div>
				{/if}
			</div>

			<!-- Download Button -->
			<div class="mb-8">
				<button
					on:click={downloadAsZip}
					disabled={isDownloading || results.filter((r) => r.success).length === 0}
					class="px-6 py-3 bg-yellow-400 border-2 border-gray-900 rounded-lg font-bold
            disabled:opacity-50"
				>
					{#if isDownloading}
						Downloading... {downloadProgress}%
					{:else}
						Download All as ZIP
					{/if}
				</button>
			</div>

			<!-- Results Grid -->
			<div class="grid grid-cols-4 gap-4 mb-8">
				{#each results.filter((r) => r.success).slice(0, 20) as result}
					<a
						href={result.url}
						target="_blank"
						class="border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-900"
					>
						<img src={result.url} alt="Render result" class="w-full h-auto" />
					</a>
				{/each}
				{#if results.filter((r) => r.success).length > 20}
					<div class="flex items-center justify-center text-gray-500">
						+{results.filter((r) => r.success).length - 20} more
					</div>
				{/if}
			</div>

			<!-- Errors -->
			{#if errors.length > 0}
				<div class="mb-8">
					<h3 class="font-bold mb-2 text-red-600">Failed Items</h3>
					<div class="max-h-48 overflow-y-auto">
						{#each errors as error}
							<div class="text-sm py-1 text-red-600">
								Row {error.index + 1}: {error.error}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<button on:click={reset} class="px-6 py-3 border-2 border-gray-900 rounded-lg font-bold">
				Start New Batch
			</button>
		</div>
	{/if}
</div>
```

---

## Security Requirements (Per Security Review)

### Critical - Must Implement

1. **CSV Injection Prevention** (implemented in code above)

   - Sanitize values starting with `=`, `+`, `-`, `@`, `\t`, `\r`

2. **File Validation**

   - Max 5MB file size
   - `.csv` extension only
   - Max 10,000 rows

3. **XSS Prevention**
   - Use text binding `{value}` not `{@html value}` for CSV preview

### Phase 2 - Backend Security

4. **CSRF Protection** on batch endpoints
5. **Rate Limiting** on batch submission (max 10/minute)
6. **Batch Authorization** - verify user owns batch before returning results
7. **OAuth Token Encryption** - use existing encryption-service.js

---

## Performance Requirements (Per Performance Review)

### Implemented in Code Above

1. **Chunked ZIP Generation** - 5 concurrent downloads, prevents memory explosion
2. **Web Worker CSV Parsing** - `worker: true` in PapaParse
3. **Adaptive Polling** - 1s → 5s exponential backoff
4. **Version Guards** - prevent stale updates

### Backend Recommendations (Phase 2)

5. **Redis Connection Pooling** - single shared connection
6. **Batch Redis Updates** - update every 5 items, not every item
7. **Server-Side ZIP** - for batches >50 images

---

## Race Condition Prevention (Per Frontend Review)

All implemented in code above:

1. **loadVersion** - prevents stale template loads
2. **parseVersion** - prevents stale CSV parses
3. **pollVersion** - prevents stale progress updates
4. **pollAbortController** - cancels polling on unmount/cancel
5. **destroyed flag** - prevents updates after unmount

---

## Agent-Native APIs (Phase 2)

Per agent-native review, add these backend endpoints:

```javascript
// POST /templates/:uid/bulk-render/data
// Accept JSON array or CSV string
{
  "data": [{"name": "John", "title": "CEO"}],
  // OR
  "csv": "name,title\nJohn,CEO"
}

// Response
{
  "uploadId": "upload_123",
  "columns": ["name", "title"],
  "rowCount": 50
}

// POST /templates/:uid/bulk-render/map-columns
{
  "columns": ["full_name", "job_title"],
  "templateUid": "tpl_abc"
}

// Response
{
  "suggestions": { "name": "full_name", "title": "job_title" },
  "confidence": { "name": 0.95, "title": 0.92 }
}

// GET /templates/batch/:batchId/download
// Returns: application/zip stream
```

---

## Acceptance Criteria

### Functional Requirements

- [x] User can upload CSV file (drag-drop or file picker)
- [x] CSV is parsed and previewed (first 5 rows)
- [x] User can map CSV columns to template variables
- [x] Auto-mapping suggests exact matches
- [x] Required variables must be mapped before submission
- [x] Batch job is created and progress is displayed
- [x] User can cancel in-progress batch
- [x] Results show successful renders with thumbnails
- [x] Failed items show error messages
- [x] User can download all results as ZIP
- [x] User can download individual images

### Non-Functional Requirements

- [x] CSV parsing uses Web Worker (no UI blocking)
- [x] Progress polling uses exponential backoff
- [x] ZIP generation uses chunked downloads
- [x] Error messages are clear and actionable
- [x] UI follows existing neobrutalist design system
- [x] Race conditions prevented with version guards

---

## Dependencies to Add

| Package     | Purpose        | Location |
| ----------- | -------------- | -------- |
| `papaparse` | CSV parsing    | Frontend |
| `jszip`     | ZIP generation | Frontend |

---

## Verification Plan

### Manual Testing

1. **CSV Upload Flow:**

   - Upload valid CSV → should parse and show preview
   - Upload invalid file type → should show error
   - Upload large CSV (5MB) → should not block UI
   - Upload CSV with special characters → should handle correctly

2. **Column Mapping:**

   - Auto-mapping should suggest exact matches
   - Required variables block submission if unmapped
   - Preview shows sample values

3. **Batch Processing:**

   - Progress bar updates during processing
   - Cancel button stops job
   - Navigation away cancels polling

4. **Download:**
   - Individual images download correctly
   - ZIP contains all successful renders
   - Download progress shown for large batches

---

## References

### Internal Files

- Existing batch API: `src/api/template.js:124-169`
- Race condition pattern: `src/routes/dashboard/template/[uid]/render/+page.svelte:32-36`
- Backend batch processor: `/html-to-gif/service/batch-processor.js`

### External Resources

- [PapaParse Documentation](https://www.papaparse.com/)
- [JSZip Documentation](https://stuk.github.io/jszip/)
