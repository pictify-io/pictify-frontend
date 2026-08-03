<script>
	/**
	 * EmailSendingCard — workspace sending-domain settings.
	 *
	 * Shows which domain workflow delivery emails send from (shared
	 * send.pictify.io vs a dedicated per-workspace subdomain), drives
	 * one-click provisioning, DNS verification status, and sender defaults.
	 */
	import { onMount } from 'svelte';
	import {
		getSendingDomain,
		provisionSendingDomain,
		verifySendingDomain,
		updateSendingDefaults
	} from '../../../../api/sending';
	import { toast } from '../../../../store/toast.store';

	let loading = true;
	let shared = null;
	let identity = null;
	let error = '';

	let provisioning = false;
	let checking = false;
	let checkCooldown = 0;
	let cooldownTimer = null;

	let defaultFromName = '';
	let defaultReplyTo = '';
	let savingDefaults = false;

	async function load() {
		loading = true;
		error = '';
		try {
			const response = await getSendingDomain();
			shared = response?.shared || null;
			identity = response?.identity || null;
			defaultFromName = identity?.defaultFromName || '';
			defaultReplyTo = identity?.defaultReplyTo || '';
		} catch (e) {
			error = e?.message || 'Failed to load sending settings';
		} finally {
			loading = false;
		}
	}

	async function provision() {
		if (provisioning) return;
		provisioning = true;
		error = '';
		try {
			const response = await provisionSendingDomain();
			identity = response?.identity || null;
			toast.success?.('Sending domain provisioned — DNS is verifying.');
		} catch (e) {
			error = e?.message || 'Provisioning failed';
		} finally {
			provisioning = false;
		}
	}

	function startCooldown(seconds) {
		checkCooldown = seconds;
		clearInterval(cooldownTimer);
		cooldownTimer = setInterval(() => {
			checkCooldown -= 1;
			if (checkCooldown <= 0) clearInterval(cooldownTimer);
		}, 1000);
	}

	async function checkStatus() {
		if (checking || checkCooldown > 0) return;
		checking = true;
		try {
			const response = await verifySendingDomain();
			identity = response?.identity || identity;
			if (identity?.status === 'verified') {
				toast.success?.('Domain verified — your workflow emails now send from it.');
			} else {
				startCooldown(30);
			}
		} catch (e) {
			error = e?.message || 'Verification check failed';
		} finally {
			checking = false;
		}
	}

	async function saveDefaults() {
		if (savingDefaults) return;
		savingDefaults = true;
		try {
			const response = await updateSendingDefaults({ defaultFromName, defaultReplyTo });
			identity = response?.identity || identity;
			toast.success?.('Sender defaults saved.');
		} catch (e) {
			error = e?.message || 'Failed to save defaults';
		} finally {
			savingDefaults = false;
		}
	}

	onMount(load);
</script>

<div class="bg-white border-[3px] border-gray-900 rounded-2xl shadow-brutal-2xl overflow-hidden">
	<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex items-center gap-3">
		<div
			class="w-8 h-8 bg-data-violet/30 rounded-lg border-[2px] border-gray-900 flex items-center justify-center"
		>
			<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<div>
			<h3 class="text-xs font-black uppercase tracking-widest text-black">Email sending domain</h3>
			<p class="text-[10px] font-bold text-gray-500">
				Where your workflow delivery emails send from
			</p>
		</div>
	</div>

	<div class="p-5 space-y-4">
		{#if loading}
			<div class="h-16 bg-gray-200 rounded animate-pulse" />
		{:else}
			{#if error}
				<div class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-3">
					<p class="text-xs font-bold text-brand-danger">{error}</p>
				</div>
			{/if}

			{#if !identity}
				<div>
					<p class="text-sm font-bold text-black">
						Sending from the shared domain:
						<code class="bg-gray-100 border-[2px] border-black rounded-lg px-2 py-0.5 text-xs">
							{shared?.fromAddress || 'runs@send.pictify.io'}
						</code>
					</p>
					<p class="text-xs font-bold text-gray-500 mt-2 leading-relaxed">
						Get a dedicated subdomain for your workspace — your delivery reputation stays yours
						alone, and recipients see your name on your own domain. Set up automatically, no DNS
						work needed.
					</p>
				</div>
				<button
					on:click={provision}
					disabled={provisioning}
					class="bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-60"
				>
					{provisioning ? 'Provisioning...' : 'Get my sending domain'}
				</button>
			{:else}
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<code class="bg-gray-100 border-[2px] border-black rounded-lg px-3 py-2 text-xs font-bold">
						{identity.fromAddress}
					</code>
					<span
						class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black
						{identity.status === 'verified'
							? 'bg-data-green text-black'
							: identity.status === 'failed'
							? 'bg-brand-danger text-white'
							: 'bg-brand-accent text-black'}"
					>
						{identity.status}
					</span>
				</div>

				{#if identity.status !== 'verified'}
					<p class="text-xs font-bold text-gray-500 leading-relaxed">
						DNS records were added automatically and are propagating — this usually takes a few
						minutes. Emails keep sending from the shared domain until verification completes.
					</p>
					<button
						on:click={checkStatus}
						disabled={checking || checkCooldown > 0}
						class="bg-white text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
					>
						{#if checking}
							Checking...
						{:else if checkCooldown > 0}
							Check again in {checkCooldown}s
						{:else}
							Check verification
						{/if}
					</button>
					<details class="text-xs">
						<summary class="font-black uppercase tracking-widest text-gray-500 cursor-pointer">
							DNS records
						</summary>
						<div class="mt-2 space-y-1 overflow-x-auto">
							{#each identity.dnsRecords || [] as record}
								<div class="flex items-center gap-2 text-[11px] font-bold whitespace-nowrap">
									<span
										class="px-1.5 py-0.5 rounded border-[1.5px] border-black {record.status ===
										'verified'
											? 'bg-data-green'
											: 'bg-gray-100'}">{record.type}</span
									>
									<code class="text-gray-600">{record.name}</code>
								</div>
							{/each}
						</div>
					</details>
				{:else}
					<div class="space-y-3 pt-1">
						<div>
							<label
								for="sending-from-name"
								class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"
							>
								Default from name
							</label>
							<input
								id="sending-from-name"
								type="text"
								bind:value={defaultFromName}
								placeholder="Your organization"
								class="w-full rounded-xl border-[3px] border-black px-3 py-2 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
							/>
						</div>
						<div>
							<label
								for="sending-reply-to"
								class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1"
							>
								Default reply-to
							</label>
							<input
								id="sending-reply-to"
								type="email"
								bind:value={defaultReplyTo}
								placeholder="you@yourcompany.com"
								class="w-full rounded-xl border-[3px] border-black px-3 py-2 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
							/>
						</div>
						<button
							on:click={saveDefaults}
							disabled={savingDefaults}
							class="bg-black text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-60"
						>
							{savingDefaults ? 'Saving...' : 'Save defaults'}
						</button>
					</div>
				{/if}
			{/if}
		{/if}
	</div>
</div>
