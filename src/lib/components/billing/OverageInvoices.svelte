<script>
	import { formatCurrency } from '../../../store/billing.store';

	export let invoices = [];
	export let loading = false;

	const OVERDUE_MS = 7 * 24 * 60 * 60 * 1000;

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function isOverdue(invoice) {
		if (invoice.status !== 'pending') return false;
		return Date.now() - new Date(invoice.createdAt).getTime() > OVERDUE_MS;
	}

	function getStatusColor(invoice) {
		if (invoice.status === 'paid') return 'text-green-600 bg-green-50';
		if (isOverdue(invoice)) return 'text-red-600 bg-red-50';
		if (invoice.status === 'pending') return 'text-yellow-600 bg-yellow-50';
		return 'text-gray-600 bg-gray-50';
	}

	function getStatusLabel(invoice) {
		if (invoice.status === 'paid') return 'Paid';
		if (isOverdue(invoice)) return 'Overdue';
		if (invoice.status === 'pending') return 'Pending';
		return invoice.status;
	}

	$: hasOverdue = invoices.some(isOverdue);
</script>

{#if loading}
	<div
		class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 text-center"
	>
		<div class="inline-flex items-center gap-2 text-gray-500">
			<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			<span class="text-sm">Loading overage invoices...</span>
		</div>
	</div>
{:else if invoices.length === 0}
	<!-- Don't render anything if no overage invoices -->
{:else}
	<div
		class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
	>
		<!-- Header -->
		<div class="px-5 py-4 border-b-2 border-gray-200 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-black text-gray-900">Overage Invoices</h2>
				<p class="text-sm text-gray-600">
					Pay-as-you-go charges for renders beyond your plan limit
				</p>
			</div>
			{#if invoices.length > 0}
				<span class="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 rounded">
					{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
				</span>
			{/if}
		</div>

		<!-- Overdue warning banner -->
		{#if hasOverdue}
			<div class="px-5 py-3 bg-red-50 border-b-2 border-red-200 flex items-center gap-3">
				<div
					class="w-8 h-8 bg-red-100 rounded-lg border-2 border-red-300 flex items-center justify-center flex-shrink-0"
				>
					<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-bold text-red-800">Overdue invoice — renders are paused</p>
					<p class="text-xs text-red-600">Pay the outstanding invoice to resume rendering.</p>
				</div>
			</div>
		{/if}

		<!-- Invoice Table -->
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-200">
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Period</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Renders</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Amount</th
						>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Status</th
						>
						<th
							class="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Action</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each invoices as invoice (invoice.month + invoice.createdAt)}
						<tr class="hover:bg-gray-50 transition-colors {isOverdue(invoice) ? 'bg-red-50' : ''}">
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="text-sm font-medium text-gray-900">{invoice.month}</span>
							</td>
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="text-sm text-gray-900"
									>{invoice.overageCount} render{invoice.overageCount !== 1 ? 's' : ''}</span
								>
							</td>
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="text-sm font-bold text-gray-900">{invoice.amountFormatted}</span>
							</td>
							<td class="px-5 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-bold rounded-full {getStatusColor(invoice)}">
									{getStatusLabel(invoice)}
								</span>
							</td>
							<td class="px-5 py-4 whitespace-nowrap text-right">
								{#if invoice.status === 'pending' && invoice.checkoutUrl}
									<a
										href={invoice.checkoutUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all
											{isOverdue(invoice)
											? 'bg-red-600 text-white hover:bg-red-700 shadow-[3px_3px_0_0_#991b1b]'
											: 'bg-[#ffc480] text-gray-900 hover:bg-[#ffb360] border-2 border-gray-900 shadow-[3px_3px_0_0_#1f2937]'}
											hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#1f2937]"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
											/>
										</svg>
										Pay now
									</a>
								{:else if invoice.status === 'paid'}
									<span class="text-xs text-gray-400 font-medium">
										{invoice.paidAt ? formatDate(invoice.paidAt) : 'Settled'}
									</span>
								{:else}
									<span class="text-sm text-gray-400">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
