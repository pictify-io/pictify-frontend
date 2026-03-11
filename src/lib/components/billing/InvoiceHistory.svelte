<script>
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency } from '../../../store/billing.store';
	import { formatRelativeDate } from '$lib/utils/format.js';

	export let invoices = [];
	export let loading = false;
	export let error = null;

	const dispatch = createEventDispatcher();

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return formatRelativeDate(dateString);
	}

	function getStatusColor(status) {
		const colors = {
			paid: 'text-green-600 bg-green-50',
			pending: 'text-yellow-600 bg-yellow-50',
			refunded: 'text-gray-600 bg-gray-50',
			void: 'text-gray-600 bg-gray-50'
		};
		return colors[status] || 'text-gray-600 bg-gray-50';
	}

	function getBillingReasonLabel(reason) {
		const labels = {
			initial: 'Initial payment',
			renewal: 'Renewal',
			updated: 'Plan change'
		};
		return labels[reason] || reason;
	}
</script>

<div
	class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
>
	<!-- Header -->
	<div class="px-5 py-4 border-b-2 border-gray-200 flex items-center justify-between">
		<div>
			<h2 class="text-lg font-black text-gray-900">Invoice History</h2>
			<p class="text-sm text-gray-600">View and download your invoices</p>
		</div>
		{#if invoices.length > 0}
			<span class="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 rounded">
				{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="p-8 text-center">
			<div class="inline-flex items-center gap-2 text-gray-500">
				<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				<span class="text-sm">Loading invoices...</span>
			</div>
		</div>
	{:else if error}
		<div class="p-6 text-center">
			<div
				class="w-12 h-12 bg-[#ff6b6b]/10 rounded-xl border-2 border-[#ff6b6b] flex items-center justify-center mx-auto mb-3"
			>
				<svg class="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/></svg
				>
			</div>
			<p class="text-sm font-bold text-gray-900 mb-1">Failed to load invoices</p>
			<p class="text-xs text-gray-500 mb-3">Please try again later</p>
			<button
				on:click={() => dispatch('retry')}
				class="text-xs font-bold text-[#ff6b6b] hover:underline uppercase tracking-wider"
			>
				Retry
			</button>
		</div>
	{:else if invoices.length === 0}
		<div class="p-8 text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
				<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
			<h3 class="font-bold text-gray-900 mb-1">No invoices yet</h3>
			<p class="text-sm text-gray-600">
				Your invoices will appear here once you have an active subscription.
			</p>
		</div>
	{:else}
		<!-- Invoice Table -->
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-200">
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Date</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Description</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Amount</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Status</th
						>
						<th
							class="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Invoice</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each invoices as invoice (invoice.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="text-sm font-medium text-gray-900"
									>{formatDate(invoice.date || invoice.createdAt)}</span
								>
							</td>
							<td class="px-5 py-4">
								<span class="text-sm text-gray-900"
									>{getBillingReasonLabel(invoice.billingReason)}</span
								>
							</td>
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="text-sm font-bold text-gray-900"
									>{invoice.totalFormatted || invoice.total}</span
								>
							</td>
							<td class="px-5 py-4 whitespace-nowrap">
								<span
									class="px-2 py-1 text-xs font-bold rounded-full {getStatusColor(invoice.status)}"
								>
									{invoice.statusFormatted || invoice.status}
								</span>
							</td>
							<td class="px-5 py-4 whitespace-nowrap text-right">
								{#if invoice.invoiceUrl}
									<a
										href={invoice.invoiceUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1 text-sm font-bold text-[#ff6b6b] hover:underline"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										Download
									</a>
								{:else}
									<span class="text-sm text-gray-400">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
