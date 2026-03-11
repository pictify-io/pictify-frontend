<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {Array<{ id: string, name: string, schedule: { startAt: string|null, endAt: string|null, recurrence: { type: string, cronExpression: string, timezone: string } } }>} */
	export let variants = [];
	export let expiresAt = '';
	export let fallbackImageUrl = '';
	export let disabled = false;

	// Get user's timezone for display
	const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Color palette for variant bars
	const VARIANT_COLORS = [
		{ bg: 'bg-[#ffc480]', border: 'border-[#e6a050]', text: 'text-gray-900' },
		{ bg: 'bg-[#4ade80]', border: 'border-[#22c55e]', text: 'text-gray-900' },
		{ bg: 'bg-[#a78bfa]', border: 'border-[#7c3aed]', text: 'text-white' },
		{ bg: 'bg-[#f472b6]', border: 'border-[#ec4899]', text: 'text-white' },
		{ bg: 'bg-[#38bdf8]', border: 'border-[#0284c7]', text: 'text-gray-900' }
	];

	function getColor(index) {
		return VARIANT_COLORS[index % VARIANT_COLORS.length];
	}

	// Convert UTC ISO string to local datetime-local input value
	function utcToLocal(utcStr) {
		if (!utcStr) return '';
		const d = new Date(utcStr);
		if (isNaN(d.getTime())) return '';
		// Offset to local
		const offset = d.getTimezoneOffset() * 60000;
		const local = new Date(d.getTime() - offset);
		return local.toISOString().slice(0, 16);
	}

	// Convert local datetime-local input value to UTC ISO string
	function localToUtc(localStr) {
		if (!localStr) return null;
		const d = new Date(localStr);
		if (isNaN(d.getTime())) return null;
		return d.toISOString();
	}

	function handleStartChange(variantIndex, value) {
		variants[variantIndex].schedule.startAt = localToUtc(value);
		variants = variants;
		dispatch('change');
	}

	function handleEndChange(variantIndex, value) {
		variants[variantIndex].schedule.endAt = localToUtc(value);
		variants = variants;
		dispatch('change');
	}

	function handleExpiresAtChange(value) {
		expiresAt = localToUtc(value) || '';
		dispatch('change');
	}

	function handleFallbackChange(value) {
		fallbackImageUrl = value;
		dispatch('change');
	}

	// Overlap detection
	function detectOverlaps() {
		const overlaps = [];
		for (let i = 0; i < variants.length; i++) {
			const a = variants[i];
			if (!a.schedule?.startAt) continue;
			const aStart = new Date(a.schedule.startAt).getTime();
			const aEnd = a.schedule.endAt ? new Date(a.schedule.endAt).getTime() : Infinity;

			for (let j = i + 1; j < variants.length; j++) {
				const b = variants[j];
				if (!b.schedule?.startAt) continue;
				const bStart = new Date(b.schedule.startAt).getTime();
				const bEnd = b.schedule.endAt ? new Date(b.schedule.endAt).getTime() : Infinity;

				if (aStart < bEnd && bStart < aEnd) {
					overlaps.push([a.name, b.name]);
				}
			}
		}
		return overlaps;
	}

	// Timeline visualization helpers
	function getTimelineBounds() {
		let min = Infinity;
		let max = -Infinity;
		const now = Date.now();

		for (const v of variants) {
			if (v.schedule?.startAt) {
				const s = new Date(v.schedule.startAt).getTime();
				if (s < min) min = s;
				const e = v.schedule.endAt ? new Date(v.schedule.endAt).getTime() : s + 24 * 60 * 60 * 1000;
				if (e > max) max = e;
			}
		}

		if (min === Infinity) {
			// No schedules set yet
			min = now;
			max = now + 7 * 24 * 60 * 60 * 1000;
		}

		// Add 10% padding
		const range = max - min || 24 * 60 * 60 * 1000;
		return { min: min - range * 0.05, max: max + range * 0.05 };
	}

	function getBarStyle(variant, bounds) {
		if (!variant.schedule?.startAt) return null;
		const start = new Date(variant.schedule.startAt).getTime();
		const end = variant.schedule.endAt ? new Date(variant.schedule.endAt).getTime() : bounds.max;
		const range = bounds.max - bounds.min;
		if (range === 0) return null;
		const left = ((start - bounds.min) / range) * 100;
		const width = ((end - start) / range) * 100;
		return `left: ${Math.max(0, left)}%; width: ${Math.min(100 - Math.max(0, left), width)}%;`;
	}

	function formatDate(isoStr) {
		if (!isoStr) return '—';
		return new Date(isoStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$: overlaps = detectOverlaps();
	$: bounds = getTimelineBounds();
	$: hasAnySchedule = variants.some((v) => v.schedule?.startAt);
</script>

<div class="space-y-6">
	<!-- Timeline Visualization -->
	{#if hasAnySchedule}
		<div class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] p-5">
			<h4
				class="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
				Schedule Timeline
			</h4>

			<div class="relative">
				<!-- Now indicator -->
				{#if true}
					{@const nowPos = ((Date.now() - bounds.min) / (bounds.max - bounds.min)) * 100}
					{#if nowPos >= 0 && nowPos <= 100}
						<div class="absolute top-0 bottom-0 z-10" style="left: {nowPos}%;">
							<div class="w-0.5 h-full bg-red-500" />
							<span
								class="absolute -top-5 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200"
								>Now</span
							>
						</div>
					{/if}
				{/if}

				<!-- Variant bars -->
				<div class="space-y-2.5 pt-2">
					{#each variants as variant, i}
						{@const style = getBarStyle(variant, bounds)}
						{@const color = getColor(i)}
						<div
							class="relative h-9 bg-gray-100 rounded-lg border-[2px] border-gray-200 overflow-hidden"
						>
							{#if style}
								<div
									class="absolute top-0 bottom-0 {color.bg} border-[2px] {color.border} rounded-md flex items-center px-2 min-w-[60px]"
									{style}
								>
									<span class="text-[10px] font-black truncate {color.text}">{variant.name}</span>
								</div>
							{:else}
								<div class="flex items-center justify-center h-full">
									<span class="text-[10px] font-bold text-gray-300 italic"
										>No schedule — {variant.name}</span
									>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Time axis -->
				<div class="flex justify-between mt-2 text-[9px] font-bold text-gray-400">
					<span>{formatDate(new Date(bounds.min).toISOString())}</span>
					<span>{formatDate(new Date(bounds.max).toISOString())}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Overlap Warning -->
	{#if overlaps.length > 0}
		<div
			class="bg-[#ffc480]/20 border-[3px] border-[#ffc480] rounded-xl p-4 flex items-start gap-3"
		>
			<svg
				class="w-5 h-5 text-[#e6a050] shrink-0 mt-0.5"
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
			<div>
				<p class="text-xs font-black text-gray-900">Overlapping schedules detected</p>
				<p class="text-[10px] text-gray-600 mt-1">
					{#each overlaps as [a, b], i}
						<span class="font-bold">{a}</span> and <span class="font-bold">{b}</span> overlap.
						{#if i < overlaps.length - 1}<br />{/if}
					{/each}
					When overlapping, the variant with the latest start time takes priority.
				</p>
			</div>
		</div>
	{/if}

	<!-- Per-Variant Schedule Editors -->
	{#each variants as variant, i}
		{@const color = getColor(i)}
		<div
			class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] overflow-hidden"
		>
			<!-- Variant header -->
			<div class="flex items-center gap-3 px-5 py-3 border-b-[3px] border-gray-200 bg-gray-50">
				<div class="w-4 h-4 rounded-full border-[2px] border-black {color.bg}" />
				<span class="text-sm font-black text-gray-900">{variant.name}</span>
				{#if variant.isDefault}
					<span
						class="text-[9px] font-black uppercase tracking-widest bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md border border-gray-300"
						>Default</span
					>
				{/if}
			</div>

			<div class="p-5 space-y-4">
				<!-- Start / End Date -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label
							class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>
							Start Date & Time
						</label>
						<input
							type="datetime-local"
							value={utcToLocal(variant.schedule?.startAt)}
							on:input={(e) => handleStartChange(i, e.target.value)}
							{disabled}
							class="w-full px-3 py-2.5 border-[3px] border-black rounded-xl text-sm font-bold bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_black] focus:-translate-y-[1px] transition-all"
						/>
					</div>
					<div>
						<label
							class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5"
						>
							End Date & Time
							<span class="text-gray-300 normal-case tracking-normal">(optional)</span>
						</label>
						<input
							type="datetime-local"
							value={utcToLocal(variant.schedule?.endAt)}
							on:input={(e) => handleEndChange(i, e.target.value)}
							{disabled}
							class="w-full px-3 py-2.5 border-[3px] border-black rounded-xl text-sm font-bold bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_black] focus:-translate-y-[1px] transition-all"
						/>
					</div>
				</div>

				<!-- Schedule summary -->
				{#if variant.schedule?.startAt}
					<div
						class="bg-gray-50 border-[2px] border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-2"
					>
						<svg
							class="w-3.5 h-3.5 text-gray-400 shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-[10px] font-bold text-gray-500">
							Active from <span class="text-gray-900">{formatDate(variant.schedule.startAt)}</span>
							{#if variant.schedule.endAt}
								until <span class="text-gray-900">{formatDate(variant.schedule.endAt)}</span>
							{:else}
								<span class="text-gray-400">(no end date)</span>
							{/if}
							<span class="text-gray-300">({userTimezone})</span>
						</span>
					</div>
				{:else}
					<div
						class="bg-gray-50 border-[2px] border-dashed border-gray-300 rounded-lg px-4 py-2.5 text-center"
					>
						<span class="text-[10px] font-bold text-gray-400">
							{variant.isDefault
								? 'Default variant — shown when no other variant is active'
								: 'Set a start date to schedule this variant'}
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/each}

	<!-- Experiment Expiration & Fallback -->
	<div
		class="bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_black] p-5 space-y-4"
	>
		<h4 class="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
			<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Expiration & Fallback
		</h4>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
					Hard Expiration Date
					<span class="text-gray-300 normal-case tracking-normal">(optional)</span>
				</label>
				<input
					type="datetime-local"
					value={utcToLocal(expiresAt)}
					on:input={(e) => handleExpiresAtChange(e.target.value)}
					{disabled}
					class="w-full px-3 py-2.5 border-[3px] border-black rounded-xl text-sm font-bold bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_black] focus:-translate-y-[1px] transition-all"
				/>
				<p class="text-[9px] text-gray-400 mt-1">
					After this date, the image link returns 410 Gone or shows fallback.
				</p>
			</div>
			<div>
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
					Fallback Image URL
					<span class="text-gray-300 normal-case tracking-normal">(optional)</span>
				</label>
				<input
					type="url"
					value={fallbackImageUrl}
					on:input={(e) => handleFallbackChange(e.target.value)}
					{disabled}
					placeholder="https://example.com/fallback.png"
					class="w-full px-3 py-2.5 border-[3px] border-black rounded-xl text-sm font-bold font-mono bg-white shadow-[2px_2px_0_0_black] focus:outline-none focus:shadow-[4px_4px_0_0_black] focus:-translate-y-[1px] transition-all placeholder:text-gray-300 placeholder:font-sans"
				/>
				<p class="text-[9px] text-gray-400 mt-1">Shown after expiration instead of 410 Gone.</p>
			</div>
		</div>
	</div>
</div>
