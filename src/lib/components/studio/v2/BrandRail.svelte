<script>
	/**
	 * The Brand rail. B03-4.
	 *
	 * Brand editing moved here out of campaign Setup, because a design's brand
	 * is part of the design — changing it anywhere else would mean two places
	 * disagreeing about what a customer will see.
	 *
	 * The rail's real job is the S4 gate: an image the renderer cannot resolve
	 * blocks "Use this design". A design with a broken or remote image does not
	 * fail loudly at render time — it produces 248 cards with a hole where the
	 * logo should be, and nobody finds out until a customer says so.
	 */
	import { createEventDispatcher } from 'svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';

	/** `[{ id, kind, label }]` from the stage. */
	export let missing = [];
	/** `[{ uid, name, url }]` the team has uploaded. */
	export let assets = [];
	export let brandName = '';
	export let uploading = false;

	const dispatch = createEventDispatcher();

	/** Which image the buyer is choosing a replacement for. */
	let choosingFor = null;

	const REASON = {
		empty: 'Renders as a broken image on every card.',
		remote: 'The render would depend on another site, which can change after approval.',
		data: 'Kept, but it is not a managed asset and cannot be swapped later.'
	};
</script>

<div class="flex flex-col gap-5">
	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Brand</p>
		<p class="mt-1.5 font-sans text-[14px] font-bold text-brand-ink">{brandName || 'Not set'}</p>
		<p class="mt-1 font-sans text-[12.5px] text-brand-slate">
			Used for every design in this campaign. Editing it here changes the design, not the data.
		</p>
	</div>

	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Images</p>

		{#if missing.length}
			<!-- S4. Named individually, because the buyer fixes them one at a time. -->
			<ul class="mt-2 flex flex-col gap-2.5">
				{#each missing as issue (issue.id)}
					<li class="rounded-md border border-brand-alarm p-3">
						<StatusSquare tone="blocked" label={issue.label} />
						<p class="mt-1.5 font-sans text-[12.5px] text-brand-slate">{REASON[issue.kind]}</p>
						<button
							type="button"
							on:click={() => (choosingFor = choosingFor === issue.id ? null : issue.id)}
							class="mt-2 font-sans text-[13px] text-brand-royal hover:underline"
							>{choosingFor === issue.id ? 'Cancel' : 'Pick from Brand assets'}</button
						>

						{#if choosingFor === issue.id}
							{#if assets.length}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each assets as asset (asset.uid)}
										<button
											type="button"
											on:click={() => {
												dispatch('replace', { id: issue.id, asset });
												choosingFor = null;
											}}
											class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[4px] border border-brand-rule bg-white p-1"
											title={asset.name}
										>
											<img src={asset.url} alt={asset.name} class="max-h-full max-w-full" />
										</button>
									{/each}
								</div>
							{:else}
								<p class="mt-2 font-sans text-[12.5px] text-brand-mute">
									No brand assets yet. Upload one below.
								</p>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2">
				<StatusSquare tone="ready" label="Every image resolves" />
			</p>
		{/if}

		<label
			class="mt-3 inline-flex h-9 cursor-pointer items-center rounded-btn border border-brand-rule px-3 font-sans text-[13px] text-brand-slate"
		>
			{uploading ? 'Uploading…' : 'Upload an image'}
			<input
				type="file"
				accept="image/png,image/jpeg,image/svg+xml"
				class="hidden"
				disabled={uploading}
				on:change={(e) => {
					const file = e.currentTarget.files?.[0];
					if (file) dispatch('upload', { file });
					e.currentTarget.value = '';
				}}
			/>
		</label>
	</div>

	{#if assets.length}
		<div>
			<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
				Brand assets · {assets.length}
			</p>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each assets as asset (asset.uid)}
					<span
						class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[4px] border border-brand-rule bg-white p-1"
						title={asset.name}
					>
						<img src={asset.url} alt={asset.name} class="max-h-full max-w-full" />
					</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
