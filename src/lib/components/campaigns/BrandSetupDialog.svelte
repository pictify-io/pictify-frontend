<script>
	/**
	 * "Set up your brand" — the first-run dialog. D11a (board `JBE-0`).
	 *
	 * THE PROMISE ON THIS DIALOG IS THE WHOLE DESIGN: "We read the public
	 * homepage once. Nothing is saved until you confirm." Detection PROPOSES a
	 * kit and writes nothing; the draft lives in the page until the buyer
	 * presses "Save as rev 1". If that stopped being true, this sentence would
	 * become the most damaging line on the screen — so the detect route has no
	 * side effect and this component never persists anything itself.
	 *
	 * The two alternatives are peers, not fallbacks. Plenty of teams have no
	 * website worth reading, and making them watch a detection fail before
	 * offering "Start blank" would be theatre.
	 */
	import { createEventDispatcher } from 'svelte';
	import { detectBrandKit, brandKitError } from '../../../api/brand-kit';

	/** Prefilled when the team already has a website on file. */
	export let website = '';

	const dispatch = createEventDispatcher();

	let value = website;
	let detecting = false;
	let error = null;

	async function detect() {
		const address = value.trim();
		if (!address || detecting) return;
		detecting = true;
		error = null;
		try {
			dispatch('detected', await detectBrandKit(address));
		} catch (err) {
			/*
			 * The field KEEPS THE ADDRESS (JJI-0). A typo is the likeliest cause,
			 * and clearing the box would make the buyer retype the thing they were
			 * about to correct.
			 */
			error = brandKitError(err).message;
		} finally {
			detecting = false;
		}
	}

	/** The host, for the progress line — "Reading northwind.com…". */
	$: host = value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
</script>

<!--
	Modal, because a team with no kit has nothing behind it to interact with —
	the page underneath is a dimmed empty kit, which is a picture of what they
	are about to fill in rather than a surface to use.
-->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-6"
	role="dialog"
	aria-modal="true"
	aria-label="Set up your brand"
>
	<div class="w-[440px] rounded-[10px] border border-brand-rule bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
		<div class="flex flex-col gap-1.5 px-6 pb-[18px] pt-6">
			<h2
				class="font-display text-[22px] font-semibold leading-7 tracking-[-0.015em] text-brand-ink"
			>
				Set up your brand
			</h2>
			<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">
				Give us your website and we’ll pull the logo, colours and fonts. You confirm everything
				before it’s saved.
			</p>
		</div>

		<div class="flex flex-col gap-2 px-6 pb-5">
			<label for="brand-website" class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
				Website
			</label>
			<div class="flex gap-2">
				<input
					id="brand-website"
					type="text"
					bind:value
					disabled={detecting}
					placeholder="northwind.com"
					on:keydown={(e) => e.key === 'Enter' && detect()}
					class="h-10 min-w-0 flex-1 rounded-[6px] border border-brand-ink px-3 font-sans text-[14px] leading-5 text-brand-ink outline-none disabled:opacity-60"
				/>
				<button
					type="button"
					on:click={detect}
					disabled={detecting || !value.trim()}
					class="flex h-10 flex-shrink-0 items-center gap-2 rounded-[6px] bg-brand-plum px-3.5 font-sans text-[14px] text-white disabled:opacity-40"
				>
					{detecting ? `Reading ${host}…` : 'Detect brand'}
					<span
						class="block h-1.5 w-1.5 bg-brand-field {detecting ? 'animate-pulse' : ''}"
						aria-hidden="true"
					/>
				</button>
			</div>

			{#if error}
				<!-- Alarm line, and it names all three ways forward rather than
				     leaving the buyer at a dead end. -->
				<p class="flex items-start gap-2 pt-0.5">
					<span class="mt-1 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
					<span class="font-sans text-[12.5px] leading-[17px] text-brand-slate">
						We couldn’t read that site. Try another address, upload a logo, or start blank.
					</span>
				</p>
			{:else}
				<p class="font-sans text-[12.5px] leading-[17px] text-brand-mute">
					We read the public homepage once. Nothing is saved until you confirm.
				</p>
			{/if}
		</div>

		<div class="flex items-center gap-2.5 px-6 pb-4">
			<span class="h-px flex-1 bg-brand-rule" aria-hidden="true" />
			<span class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">or</span>
			<span class="h-px flex-1 bg-brand-rule" aria-hidden="true" />
		</div>

		<div class="flex gap-2 px-6 pb-6">
			<button
				type="button"
				on:click={() => dispatch('upload')}
				class="flex min-w-0 flex-1 flex-col gap-1 rounded-[6px] border border-brand-rule px-3.5 py-3 text-left"
			>
				<span class="font-sans text-[13.5px] font-medium leading-[18px] text-brand-ink"
					>Upload a logo</span
				>
				<span class="font-sans text-[12px] leading-4 text-brand-mute">We take colours from it.</span>
			</button>
			<button
				type="button"
				on:click={() => dispatch('blank')}
				class="flex min-w-0 flex-1 flex-col gap-1 rounded-[6px] border border-brand-rule px-3.5 py-3 text-left"
			>
				<span class="font-sans text-[13.5px] font-medium leading-[18px] text-brand-ink"
					>Start blank</span
				>
				<span class="font-sans text-[12px] leading-4 text-brand-mute">Fill in the kit yourself.</span>
			</button>
		</div>
	</div>
</div>
