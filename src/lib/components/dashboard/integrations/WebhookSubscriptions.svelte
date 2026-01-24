<script>
	import { onMount } from 'svelte';
	import {
		getWebhookSubscriptions,
		createWebhookSubscription,
		deleteWebhookSubscription,
		pauseWebhookSubscription,
		resumeWebhookSubscription,
		WEBHOOK_EVENTS,
		PLATFORMS
	} from '../../../../api/integrations';
	import Loader from '$lib/components/Loader.svelte';

	// Icons map
	const PLATFORM_ICONS = {
		zapier: "M13 10V3L4 14h7v7l9-11h-7z", // Lightning
		make: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
		n8n: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
		pipedream: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
		custom: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" // Link
	};

	let subscriptions = [];
	let loading = true;
	let error = null;
	let showCreateModal = false;

	// Form state
	let newSubscription = {
		event: 'render.completed',
		targetUrl: '',
		platform: 'custom',
		filters: {}
	};
	let creating = false;
	let createError = null;
	let createdSecret = null;

	onMount(async () => {
		await loadSubscriptions();
	});

	async function loadSubscriptions() {
		loading = true;
		error = null;
		try {
			const response = await getWebhookSubscriptions();
			subscriptions = response.subscriptions || [];
		} catch (err) {
			error = err.message || 'Failed to load subscriptions';
		} finally {
			loading = false;
		}
	}

	async function handleCreate() {
		creating = true;
		createError = null;
		createdSecret = null;

		try {
			const response = await createWebhookSubscription(newSubscription);
			createdSecret = response.subscription.secret;
			subscriptions = [response.subscription, ...subscriptions];
		} catch (err) {
			createError = err.message || 'Failed to create subscription';
		} finally {
			creating = false;
		}
	}

	async function handleDelete(uid) {
		if (!confirm('Are you sure you want to delete this webhook subscription?')) return;

		try {
			await deleteWebhookSubscription(uid);
			subscriptions = subscriptions.filter((s) => s.uid !== uid);
		} catch (err) {
			alert('Failed to delete: ' + err.message);
		}
	}

	async function handlePause(uid) {
		try {
			const response = await pauseWebhookSubscription(uid);
			subscriptions = subscriptions.map((s) =>
				s.uid === uid ? { ...s, status: 'paused' } : s
			);
		} catch (err) {
			alert('Failed to pause: ' + err.message);
		}
	}

	async function handleResume(uid) {
		try {
			const response = await resumeWebhookSubscription(uid);
			subscriptions = subscriptions.map((s) =>
				s.uid === uid ? { ...s, status: 'active' } : s
			);
		} catch (err) {
			alert('Failed to resume: ' + err.message);
		}
	}

	function closeModal() {
		showCreateModal = false;
		createdSecret = null;
		newSubscription = {
			event: 'render.completed',
			targetUrl: '',
			platform: 'custom',
			filters: {}
		};
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'paused':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'failed':
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function getPlatformInfo(platform) {
		return PLATFORMS.find((p) => p.value === platform) || PLATFORMS.find((p) => p.value === 'custom');
	}

	function getEventInfo(event) {
		return WEBHOOK_EVENTS.find((e) => e.value === event) || { label: event, description: '' };
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-xl font-bold text-gray-900">Webhook Subscriptions</h2>
			<p class="text-sm text-gray-600 mt-1">
				Receive notifications when events occur in your Pictify account
			</p>
		</div>
		<button
			on:click={() => (showCreateModal = true)}
			class="px-4 py-2 text-sm font-bold text-white bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
		>
			+ New Subscription
		</button>
	</div>

	<!-- Loading -->
	{#if loading}
		<div class="flex justify-center py-12">
			<Loader />
		</div>
	{:else if error}
		<div class="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600">
			{error}
		</div>
	{:else if subscriptions.length === 0}
		<div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
			<svg
				class="w-12 h-12 mx-auto text-gray-400 mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
				/>
			</svg>
			<p class="text-gray-600 font-medium">No webhook subscriptions yet</p>
			<p class="text-sm text-gray-500 mt-1">Create one to start receiving event notifications</p>
		</div>
	{:else}
		<!-- Subscriptions List -->
		<div class="space-y-4">
			{#each subscriptions as sub}
				<div
					class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] p-4"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<span class="w-8 h-8 flex items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={PLATFORM_ICONS[sub.platform] || PLATFORM_ICONS.custom} />
									</svg>
								</span>
								<span class="font-bold text-gray-900">{getEventInfo(sub.event).label}</span>
								<span
									class="px-2 py-0.5 text-xs font-bold rounded-full border {getStatusColor(
										sub.status
									)}"
								>
									{sub.status}
								</span>
							</div>
							<p class="text-sm text-gray-600 mb-2 truncate max-w-md">{sub.targetUrl}</p>
							<div class="flex items-center gap-4 text-xs text-gray-500">
								<span>Deliveries: {sub.deliveryCount || 0}</span>
								{#if sub.failureCount > 0}
									<span class="text-red-500">Failures: {sub.failureCount}</span>
								{/if}
								{#if sub.lastDeliveryAt}
									<span>Last: {new Date(sub.lastDeliveryAt).toLocaleString()}</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if sub.status === 'active'}
								<button
									on:click={() => handlePause(sub.uid)}
									class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
									title="Pause"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							{:else}
								<button
									on:click={() => handleResume(sub.uid)}
									class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
									title="Resume"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							{/if}
							<button
								on:click={() => handleDelete(sub.uid)}
								class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
								title="Delete"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] max-w-lg w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-xl font-bold text-gray-900">New Webhook Subscription</h3>
					<button on:click={closeModal} class="p-1 hover:bg-gray-100 rounded-lg">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if createdSecret}
					<!-- Success: Show secret -->
					<div class="space-y-4">
						<div class="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
							<p class="text-green-800 font-bold mb-2 flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
								Subscription created!
							</p>
							<p class="text-sm text-green-700">Save your webhook secret - it won't be shown again.</p>
						</div>
						<div>
							<label class="block text-sm font-bold text-gray-700 mb-2">Webhook Secret</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
									{createdSecret}
								</code>
								<button
									on:click={() => navigator.clipboard.writeText(createdSecret)}
									class="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</button>
							</div>
						</div>
						<button
							on:click={closeModal}
							class="w-full px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl border-[3px] border-gray-900 hover:bg-gray-800 transition-colors"
						>
							Done
						</button>
					</div>
				{:else}
					<!-- Form -->
					<form on:submit|preventDefault={handleCreate} class="space-y-4">
						{#if createError}
							<div class="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
								{createError}
							</div>
						{/if}

						<div>
							<label class="block text-sm font-bold text-gray-700 mb-2">Event</label>
							<select
								bind:value={newSubscription.event}
								class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc480]"
							>
								{#each WEBHOOK_EVENTS as event}
									<option value={event.value}>{event.label}</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">
								{WEBHOOK_EVENTS.find((e) => e.value === newSubscription.event)?.description}
							</p>
						</div>

						<div>
							<label class="block text-sm font-bold text-gray-700 mb-2">Target URL</label>
							<input
								type="url"
								bind:value={newSubscription.targetUrl}
								placeholder="https://hooks.zapier.com/..."
								required
								class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc480]"
							/>
						</div>



						<div class="flex gap-3 pt-4">
							<button
								type="button"
								on:click={closeModal}
								class="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white rounded-xl border-[3px] border-gray-300 hover:border-gray-400 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={creating || !newSubscription.targetUrl}
								class="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{creating ? 'Creating...' : 'Create'}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
