<script>
	/**
	 * FE-4 — pilot access request (board `DQG-0`, right card).
	 *
	 * Shown whenever campaign intent meets no entitlement. It is an INVITATION,
	 * not an error: a closed pilot is a state of the product, and rendering it
	 * as a failure makes the whole thing feel broken rather than early.
	 *
	 * The form asks about the buyer's own workflow and says, in the field
	 * itself, not to paste customer data. Someone requesting access has not
	 * agreed to anything yet, so collecting a sample of their customer list
	 * would mean holding third-party data before any relationship justifies it —
	 * the backend model has no field to put it in either.
	 */
	import StatusSquare from './StatusSquare.svelte';
	import { requestPilotAccess, campaignError } from '../../../api/campaign';
	import { campaignAccessRequested } from '../../campaigns/analytics';

	export let email = '';
	export let teamName = '';
	/** Called when the buyer would rather look at the sample first. */
	export let onTrySample = null;

	let company = '';
	let accountsEstimate = '';
	let sendingTool = '';
	let useCase = '';
	let busy = false;
	let sent = false;
	let error = null;

	const TOOLS = ['Customer.io', 'HubSpot', 'Braze', 'Klaviyo', 'Mailchimp', 'Intercom', 'Other'];
	const SIZES = ['Under 50', '50–250', '250–1,000', 'Over 1,000'];

	/** The numeric estimate the API takes; the buyer picks a band. */
	const MIDPOINT = { 'Under 50': 25, '50–250': 150, '250–1,000': 600, 'Over 1,000': 1500 };

	async function submit() {
		if (!useCase.trim()) return;
		busy = true;
		error = null;
		try {
			await requestPilotAccess({
				useCase: [company && `Company: ${company}`, useCase].filter(Boolean).join('\n'),
				sendingTool: sendingTool || undefined,
				accountsEstimate: MIDPOINT[accountsEstimate]
			});
			sent = true;
			// Booleans and a band, never the buyer's words or their email.
			campaignAccessRequested({
				has_tool: Boolean(sendingTool),
				has_company: Boolean(company),
				size_band: accountsEstimate || 'unstated'
			});
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = false;
		}
	}
</script>

<div class="max-w-[560px] rounded-lg border border-brand-rule bg-white p-6">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
		Campaign intent · {teamName || 'your team'} · no pilot entitlement
	</p>

	{#if sent}
		<h2 class="mt-2.5 font-display text-[22px] font-bold text-brand-ink">Request received.</h2>
		<p class="mt-2.5 flex items-start gap-2">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
			<span class="font-sans text-[14px] text-brand-slate">
				We’ll reply to {email}. You can try the sample data meanwhile — it uses synthetic accounts
				and never mixes with live editions.
			</span>
		</p>
		{#if onTrySample}
			<button
				type="button"
				on:click={onTrySample}
				class="mt-4 font-sans text-[13.5px] text-brand-royal hover:underline"
				>Try sample data</button
			>
		{/if}
	{:else}
		<h2 class="mt-2.5 font-display text-[22px] font-bold text-brand-ink">
			Campaigns is in private pilot.
		</h2>
		<!--
			Deliberately no response-time promise. The design review struck "two
			working days" from the landing copy, and repeating it here would make
			a commitment nobody can keep on a surface a buyer will hold us to.
		-->
		<p class="mt-2 font-sans text-[14px] text-brand-slate">
			Your account is ready; campaign generation is enabled per team by us. Tell us about the
			campaign and we’ll get back to you. Try the sample data meanwhile.
		</p>

		<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
			<input
				value={email}
				disabled
				class="h-10 rounded-btn border border-brand-rule bg-brand-subtle px-3 font-sans text-[13.5px] text-brand-mute"
				aria-label="Your email"
			/>
			<input
				bind:value={company}
				placeholder="Company"
				class="h-10 rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
			/>
			<select
				bind:value={accountsEstimate}
				class="h-10 rounded-btn border border-brand-rule bg-white px-3 font-sans text-[13.5px] {accountsEstimate
					? 'text-brand-ink'
					: 'text-brand-mute'}"
			>
				<option value="">Approximate accounts</option>
				{#each SIZES as size (size)}<option value={size}>{size}</option>{/each}
			</select>
			<select
				bind:value={sendingTool}
				class="h-10 rounded-btn border border-brand-rule bg-white px-3 font-sans text-[13.5px] {sendingTool
					? 'text-brand-ink'
					: 'text-brand-mute'}"
			>
				<option value="">Sending tool</option>
				{#each TOOLS as tool (tool)}<option value={tool}>{tool}</option>{/each}
			</select>
		</div>

		<!-- The warning is in the field, where it is read, not in a footnote. -->
		<textarea
			bind:value={useCase}
			rows="3"
			placeholder="What do you want customers to see? (no customer data, please)"
			class="mt-3 w-full rounded-btn border border-brand-rule px-3 py-2.5 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
		/>

		{#if error}
			<p class="mt-3">
				<StatusSquare tone="blocked" label={`Couldn’t send · ${error.message}`} />
			</p>
		{/if}

		<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
			{#if onTrySample}
				<button
					type="button"
					on:click={onTrySample}
					class="font-sans text-[13.5px] text-brand-royal hover:underline"
					>Try sample data instead</button
				>
			{:else}
				<span />
			{/if}
			<button
				type="button"
				on:click={submit}
				disabled={!useCase.trim() || busy}
				class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {useCase.trim() &&
				!busy
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy ? 'Sending…' : 'Request pilot access'}
				<span
					class="block h-2 w-2 {useCase.trim() && !busy ? 'bg-brand-field' : 'bg-brand-rule'}"
					aria-hidden="true"
				/>
			</button>
		</div>
	{/if}
</div>
