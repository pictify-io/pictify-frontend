<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		createVideoTemplate,
		updateVideoTemplate,
		renderVideoTemplate
	} from '../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

	// Pass a saved template to edit it; leave null for a fresh one.
	export let template = null;

	const STARTER_TSX = `import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

export const schema = {
  title: { type: 'string', default: 'Hello from Pictify' },
  accentColor: { type: 'color', default: '#FACC15' }
};

export default function Scene({ title = 'Hello from Pictify', accentColor = '#FACC15' }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut
      }}
    >
      <h1
        style={{
          color: accentColor,
          fontSize: 120,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          transform: 'scale(' + pop + ')'
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
}
`;

	// ── Editor state ─────────────────────────────────────────────────────
	let uid = template?.uid || '';
	let name = template?.name || 'Untitled video template';
	let width = template?.width || 1080;
	let height = template?.height || 1920;
	let fps = template?.fps || 30;
	let durationSeconds =
		template?.durationInFrames && template?.fps
			? Math.round((template.durationInFrames / template.fps) * 100) / 100
			: 5;
	let tsx = template?.tsx || STARTER_TSX;
	let status = template?.status || 'draft';
	let schemaJson = template?.schemaJson ?? template?.schema ?? null;

	let saving = '';
	let saveError = '';
	let compileErrors = [];

	$: durationInFrames = Math.max(1, Math.round(Number(durationSeconds) * Number(fps)) || 1);
	$: lineNumbers = tsx.split('\n').map((_, i) => i + 1);
	$: maxFrame = Math.max(0, durationInFrames - 1);
	$: widthN = Math.max(1, Math.round(Number(width)) || 1);
	$: heightN = Math.max(1, Math.round(Number(height)) || 1);
	$: isPortrait = heightN > widthN;

	// ── Code editor (textarea + gutter) ──────────────────────────────────
	let editorEl;
	let gutterEl;

	function syncGutter() {
		if (gutterEl && editorEl) gutterEl.scrollTop = editorEl.scrollTop;
	}

	async function handleEditorKeydown(event) {
		if (event.key !== 'Tab') return;
		event.preventDefault();
		const el = event.target;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		tsx = tsx.slice(0, start) + '  ' + tsx.slice(end);
		await tick();
		el.selectionStart = el.selectionEnd = start + 2;
	}

	// ── Live player (React island, browser-only) ─────────────────────────
	let playerHost = null;
	let playerEl;
	let playerStatus = 'loading'; // loading | compiling | live | error
	let hostReady = false;
	let applyTimer = null;
	let currentFrame = 0;
	let liveFields = null;

	onMount(async () => {
		try {
			playerHost = await import('$lib/video/playerHost.js');
		} catch (error) {
			playerStatus = 'error';
			compileErrors = ['Failed to load the live player. Reload the page and try again.'];
			return;
		}
		applyCode();
		hostReady = true;
	});

	function applyCode() {
		if (!playerHost || !playerEl) return;
		playerStatus = 'compiling';
		const ok = playerHost.mountVideoPlayer(playerEl, {
			tsx,
			inputProps: variablesPayload(),
			width: widthN,
			height: heightN,
			fps: Math.max(1, Math.round(Number(fps)) || 30),
			durationInFrames,
			onError: handlePlayerError,
			onSchema: handleSchema,
			onFrame: handleFrame
		});
		if (ok) {
			playerStatus = 'live';
			compileErrors = [];
		}
	}

	function handlePlayerError(message) {
		playerStatus = 'error';
		compileErrors = [message];
	}

	function handleSchema(fields) {
		if (JSON.stringify(fields) !== JSON.stringify(liveFields)) liveFields = fields;
	}

	function handleFrame(frame) {
		currentFrame = frame;
	}

	function scheduleApply(delay) {
		if (!hostReady) return;
		playerStatus = 'compiling';
		clearTimeout(applyTimer);
		applyTimer = setTimeout(applyCode, delay);
	}

	// Debounced live recompile on code edits…
	$: scheduleCodeApply(tsx);
	function scheduleCodeApply() {
		scheduleApply(800);
	}

	// …and a fast remount when the composition settings change.
	$: scheduleSettingsApply(widthN, heightN, fps, durationInFrames);
	function scheduleSettingsApply() {
		scheduleApply(300);
	}

	function applyProps() {
		scheduleApply(150);
	}

	// ── Props form (auto-built from the live schema) ─────────────────────
	function toField(fieldName, def) {
		const meta = def && typeof def === 'object' ? def : {};
		let fallback = '';
		if (meta.default !== undefined) fallback = meta.default;
		else if (meta.defaultValue !== undefined) fallback = meta.defaultValue;
		return { name: fieldName, type: meta.type || 'string', default: fallback };
	}

	function parseSchema(raw) {
		let schema = raw;
		if (typeof schema === 'string') {
			try {
				schema = JSON.parse(schema);
			} catch (error) {
				return [];
			}
		}
		if (!schema || typeof schema !== 'object') return [];
		const source = Array.isArray(schema)
			? schema
			: schema.properties || schema.variables || schema.fields || schema;
		if (Array.isArray(source)) {
			return source.filter((f) => f && f.name).map((f) => toField(f.name, f));
		}
		if (!source || typeof source !== 'object') return [];
		return Object.entries(source).map(([key, def]) => toField(key, def));
	}

	let variables = {};
	$: schemaFields = liveFields ?? parseSchema(schemaJson);
	$: syncVariables(schemaFields);

	function syncVariables(fields) {
		const next = {};
		for (const field of fields) {
			next[field.name] =
				variables[field.name] !== undefined ? variables[field.name] : field.default;
		}
		variables = next;
	}

	function variablesPayload() {
		const out = {};
		for (const field of schemaFields) {
			const value = variables[field.name];
			if (field.type === 'number') out[field.name] = Number(value) || 0;
			else if (field.type === 'boolean') out[field.name] = Boolean(value);
			else out[field.name] = value;
		}
		return out;
	}

	// ── Save / publish ───────────────────────────────────────────────────
	function extractCompileErrors(error) {
		const list = error?.data?.errors;
		if (Array.isArray(list) && list.length) {
			return list.map((item) => {
				if (typeof item === 'string') return item;
				if (item && typeof item === 'object') return item.message || JSON.stringify(item);
				return String(item);
			});
		}
		return [error?.message || 'The template failed to compile.'];
	}

	async function save({ publish = false } = {}) {
		if (saving) return;
		saveError = '';
		compileErrors = [];
		const widthValue = Math.round(Number(width));
		const heightValue = Math.round(Number(height));
		const fpsValue = Math.round(Number(fps));
		if (
			!widthValue ||
			!heightValue ||
			widthValue < 1 ||
			heightValue < 1 ||
			!fpsValue ||
			fpsValue < 1
		) {
			saveError = 'Enter a valid width, height and fps.';
			return;
		}
		if (!tsx.trim()) {
			saveError = 'The scene code is empty.';
			return;
		}
		saving = publish ? 'publish' : 'save';
		try {
			const payload = {
				name: name.trim() || 'Untitled video template',
				tsx,
				width: widthValue,
				height: heightValue,
				fps: fpsValue,
				durationInFrames,
				status: publish ? 'published' : status
			};
			const response = uid
				? await updateVideoTemplate(uid, payload)
				: await createVideoTemplate(payload);
			const saved = response?.template;
			if (!saved?.uid) throw new Error('The template was saved but no details were returned.');
			status = saved.status || payload.status;
			schemaJson = saved.schemaJson ?? saved.schema ?? schemaJson;
			analytics.track?.('Video Template Saved', {
				uid: saved.uid,
				published: publish,
				isNew: !uid
			});
			if (!uid) {
				uid = saved.uid;
				goto(`/dashboard/video-templates/${saved.uid}`, { replaceState: true });
			}
		} catch (error) {
			if (error?.status === 422) compileErrors = extractCompileErrors(error);
			else saveError = error?.message || 'Failed to save the template. Please try again.';
		} finally {
			saving = '';
		}
	}

	// ── Final render (mp4, slow, server-side truth) ──────────────────────
	let rendering = false;
	let renderUrl = '';
	let renderError = '';
	let renderElapsed = 0;
	let renderTimer = null;

	async function renderVideo() {
		if (!uid || rendering) return;
		rendering = true;
		renderError = '';
		renderUrl = '';
		compileErrors = [];
		renderElapsed = 0;
		renderTimer = setInterval(() => (renderElapsed += 1), 1000);
		try {
			const response = await renderVideoTemplate(uid, { variables: variablesPayload() });
			renderUrl = response?.url || '';
			if (!renderUrl) throw new Error('The render finished but no video URL was returned.');
			analytics.track?.('Video Template Test Rendered', { uid });
		} catch (error) {
			if (error?.status === 422) compileErrors = extractCompileErrors(error);
			else renderError = error?.message || 'The render failed. Please try again.';
		} finally {
			clearInterval(renderTimer);
			renderTimer = null;
			rendering = false;
		}
	}

	onDestroy(() => {
		if (renderTimer) clearInterval(renderTimer);
		clearTimeout(applyTimer);
		if (playerHost && playerEl) playerHost.unmount(playerEl);
	});

	function variableLabel(variable) {
		return String(variable)
			.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
			.replace(/^./, (c) => c.toUpperCase());
	}

	const STATUS_CHIPS = {
		loading: { label: 'Loading player…', classes: 'bg-gray-200 text-gray-700' },
		compiling: { label: 'Compiling…', classes: 'bg-brand-accent text-black' },
		live: { label: 'Live', classes: 'bg-data-green text-black' },
		error: { label: 'Error', classes: 'bg-brand-danger text-white' }
	};
	$: statusChip = STATUS_CHIPS[playerStatus] || STATUS_CHIPS.loading;
</script>

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Header -->
	<div class="pt-4 mb-8">
		<a
			href="/dashboard/video-templates"
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
			Video Templates
		</a>
		<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
			<div>
				<h1
					class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-[0.95]"
				>
					{uid ? 'Edit video template.' : 'New video template.'}
				</h1>
				<div class="flex items-center gap-2 mt-3">
					<span
						class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black
							{status === 'published' ? 'bg-data-green text-black' : 'bg-gray-100 text-gray-700'}"
					>
						{status}
					</span>
					<span
						class="px-3 py-1 bg-brand-accent/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
					>
						{durationInFrames} frames @ {fps} fps
					</span>
				</div>
			</div>
			<div class="flex items-center gap-3 flex-wrap">
				<button
					on:click={() => save()}
					disabled={!!saving}
					class="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving === 'save' ? 'Saving…' : 'Save'}
				</button>
				<button
					on:click={() => save({ publish: true })}
					disabled={!!saving}
					class="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving === 'publish' ? 'Publishing…' : status === 'published' ? 'Republish' : 'Publish'}
				</button>
			</div>
		</div>
	</div>

	{#if saveError}
		<div
			class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-6 text-sm font-bold text-brand-danger"
		>
			{saveError}
		</div>
	{/if}

	{#if compileErrors.length}
		<div class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-5 mb-6">
			<p class="text-xs font-black text-brand-danger uppercase tracking-widest mb-3">
				Compile errors
			</p>
			{#each compileErrors as compileError}
				<pre
					class="font-mono text-xs text-brand-danger whitespace-pre-wrap break-words mb-2 last:mb-0">{compileError}</pre>
			{/each}
		</div>
	{/if}

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
		<!-- ─── LEFT: code + settings ────────────────────────────────── -->
		<div class="space-y-6">
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6">
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-brand-accent rounded-sm border-[2px] border-black" />
					Scene code (TSX)
				</h2>
				<div class="flex rounded-xl border-[3px] border-black bg-gray-950 overflow-hidden">
					<div
						bind:this={gutterEl}
						class="h-[520px] py-4 pl-3 pr-2 text-right font-mono text-xs leading-5 text-gray-500 bg-gray-900 select-none overflow-hidden shrink-0"
						aria-hidden="true"
					>
						{#each lineNumbers as lineNumber}
							<div>{lineNumber}</div>
						{/each}
					</div>
					<textarea
						bind:this={editorEl}
						bind:value={tsx}
						on:keydown={handleEditorKeydown}
						on:scroll={syncGutter}
						wrap="off"
						spellcheck="false"
						aria-label="Scene code"
						class="flex-1 h-[520px] p-4 pl-3 font-mono text-xs leading-5 text-gray-100 bg-gray-950 focus:outline-none resize-none whitespace-pre overflow-auto"
					/>
				</div>
				<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-3">
					Export a default component + an <span class="font-mono normal-case"
						>export const schema</span
					> — edits go live automatically. Tab inserts spaces.
				</p>
			</div>

			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6">
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
					Settings
				</h2>
				<div class="mb-4">
					<label
						for="vt-name"
						class="block text-xs font-black text-black uppercase tracking-widest mb-2"
					>
						Name
					</label>
					<input
						id="vt-name"
						type="text"
						bind:value={name}
						class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
					/>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div>
						<label
							for="vt-width"
							class="block text-xs font-black text-black uppercase tracking-widest mb-2"
						>
							Width
						</label>
						<input
							id="vt-width"
							type="number"
							min="1"
							bind:value={width}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
					</div>
					<div>
						<label
							for="vt-height"
							class="block text-xs font-black text-black uppercase tracking-widest mb-2"
						>
							Height
						</label>
						<input
							id="vt-height"
							type="number"
							min="1"
							bind:value={height}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
					</div>
					<div>
						<label
							for="vt-fps"
							class="block text-xs font-black text-black uppercase tracking-widest mb-2"
						>
							FPS
						</label>
						<input
							id="vt-fps"
							type="number"
							min="1"
							max="60"
							bind:value={fps}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
					</div>
					<div>
						<label
							for="vt-duration"
							class="block text-xs font-black text-black uppercase tracking-widest mb-2"
						>
							Seconds
						</label>
						<input
							id="vt-duration"
							type="number"
							min="1"
							max="60"
							step="0.5"
							bind:value={durationSeconds}
							class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- ─── RIGHT: studio panel ──────────────────────────────────── -->
		<div class="space-y-6">
			<!-- Live player -->
			<div
				class="bg-gray-950 rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden"
				data-testid="studio-panel"
			>
				<div class="flex items-center justify-between gap-3 px-5 py-3 bg-gray-900">
					<h2
						class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3"
					>
						<span class="w-3 h-3 bg-brand-accent rounded-sm border-[2px] border-black" />
						Live preview
					</h2>
					<span
						data-testid="player-status"
						class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black {statusChip.classes}"
					>
						{statusChip.label}
					</span>
				</div>
				<div class="studio-checkerboard border-y-[3px] border-black p-4 flex justify-center">
					<div
						bind:this={playerEl}
						data-testid="player-root"
						class="mx-auto rounded-lg overflow-hidden bg-black"
						style={isPortrait
							? `aspect-ratio: ${widthN} / ${heightN}; height: min(60vh, 540px); max-width: 100%;`
							: `aspect-ratio: ${widthN} / ${heightN}; width: 100%; max-height: 540px;`}
					/>
				</div>
				<div class="flex items-center justify-between px-5 py-3 bg-gray-900">
					<span class="font-mono text-xs font-bold text-gray-400" data-testid="frame-readout">
						Frame {currentFrame} / {maxFrame}
					</span>
					<span class="font-mono text-xs font-bold text-gray-400">
						{(currentFrame / Math.max(1, Number(fps))).toFixed(2)}s / {(
							durationInFrames / Math.max(1, Number(fps))
						).toFixed(2)}s · {widthN}×{heightN}
					</span>
				</div>
			</div>

			<!-- Props -->
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6">
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-data-green rounded-sm border-[2px] border-black" />
					Props
				</h2>
				{#if schemaFields.length}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each schemaFields as field (field.name)}
							<div>
								<label
									for={'vt-var-' + field.name}
									class="block text-xs font-black text-black uppercase tracking-widest mb-2"
								>
									{variableLabel(field.name)}
								</label>
								{#if field.type === 'number'}
									<input
										id={'vt-var-' + field.name}
										type="number"
										bind:value={variables[field.name]}
										on:input={applyProps}
										class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
									/>
								{:else if field.type === 'color'}
									<div class="flex gap-2">
										<input
											id={'vt-var-' + field.name}
											type="color"
											bind:value={variables[field.name]}
											on:input={applyProps}
											class="w-12 h-11 rounded-xl border-[3px] border-black bg-white p-1 cursor-pointer flex-shrink-0"
										/>
										<input
											type="text"
											aria-label={field.name + ' hex value'}
											bind:value={variables[field.name]}
											on:input={applyProps}
											class="flex-1 min-w-0 rounded-xl border-[3px] border-black px-4 py-2.5 text-sm font-mono font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
										/>
									</div>
								{:else if field.type === 'boolean'}
									<label
										class="inline-flex items-center gap-3 rounded-xl border-[3px] border-black px-4 py-3 bg-white cursor-pointer"
									>
										<input
											id={'vt-var-' + field.name}
											type="checkbox"
											bind:checked={variables[field.name]}
											on:change={applyProps}
											class="w-5 h-5 accent-black"
										/>
										<span class="text-sm font-bold text-black">Enabled</span>
									</label>
								{:else}
									<input
										id={'vt-var-' + field.name}
										type="text"
										bind:value={variables[field.name]}
										on:input={applyProps}
										class="w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
									/>
								{/if}
							</div>
						{/each}
					</div>
					<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">
						Edits update the player live — the same values are sent to the final render.
					</p>
				{:else}
					<p class="text-xs font-bold text-gray-500">
						Add an <span class="font-mono">export const schema</span> to your scene and the props form
						is built automatically.
					</p>
				{/if}
			</div>

			<!-- Final render -->
			<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6">
				<h2
					class="text-sm font-black text-black uppercase tracking-widest mb-4 flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
					Final render
				</h2>
				<button
					on:click={renderVideo}
					disabled={!uid || rendering}
					class="inline-flex items-center gap-2 bg-brand-accent text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if rendering}
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
						Rendering… {renderElapsed}s (up to ~3 min)
					{:else}
						Render final MP4
					{/if}
				</button>
				<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">
					Server render with the props above — the source of truth for the final MP4.
				</p>
				{#if !uid}
					<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">
						Save the template first to render the final MP4.
					</p>
				{/if}

				{#if renderError}
					<div
						class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mt-4 text-sm font-bold text-brand-danger"
					>
						{renderError}
					</div>
				{/if}

				{#if renderUrl}
					<!-- svelte-ignore a11y-media-has-caption -->
					<video
						controls
						src={renderUrl}
						class="mt-4 w-full max-h-[420px] rounded-xl border-[3px] border-black bg-black"
					/>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.studio-checkerboard {
		background-color: #0a0a0a;
		background-image: repeating-conic-gradient(#1c1c1c 0% 25%, #101010 0% 50%);
		background-size: 24px 24px;
	}
</style>
