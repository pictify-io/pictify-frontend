<script>
	import { formatRelativeDate } from '$lib/utils/format.js';

	/** @type {Array<{uid:string,packType:string,outputFormat:string,status:string,counts:{total:number,rendered:number,delivered:number,failed:number},createdAt:string}>} */
	export let runs = [];

	// A run is "in flight" while the executor is still working it.
	const RUN_ACTIVE = ['pending', 'processing'];

	function runStatusStyle(status) {
		if (status === 'completed') return 'bg-data-green text-black';
		if (status === 'failed') return 'bg-brand-danger text-white';
		if (RUN_ACTIVE.includes(status)) return 'bg-brand-accent text-black';
		return 'bg-gray-100 text-gray-700';
	}

	function runProgress(run) {
		const total = run?.counts?.total || 0;
		if (!total) return 0;
		return Math.round(((run.counts.rendered || 0) / total) * 100);
	}
</script>

			<div class="flex items-center justify-between mb-6 gap-4">
				<h2
					class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-data-green rounded-sm border-[2px] border-black rotate-45" />
					Recent runs
				</h2>
				{#if runs.length > 0}
					<a
						href="/dashboard/workflows"
						class="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all focus-brutal"
					>
						All runs
					</a>
				{/if}
			</div>

			{#if runs.length > 0}
				<div
					class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md overflow-hidden"
				>
					<ul class="divide-y-[3px] divide-black">
						{#each runs as run (run.uid)}
							<li>
								<a
									href="/dashboard/workflows/{run.uid}"
									class="flex items-center gap-4 p-4 md:p-5 hover:bg-brand-accent/10 transition-colors focus-brutal"
								>
									<span
										class="shrink-0 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black {runStatusStyle(
											run.status
										)}"
									>
										{run.status}
									</span>

									<div class="min-w-0 flex-1">
										<div class="flex items-baseline gap-2 flex-wrap">
											<span class="text-sm font-black text-black truncate">
												{run.packType === 'certificates' ? 'Certificates' : 'Custom run'}
											</span>
											<span
												class="font-mono text-[10px] font-bold text-gray-500 uppercase tracking-wider"
											>
												{run.outputFormat}
											</span>
										</div>

										{#if RUN_ACTIVE.includes(run.status)}
											<div
												class="mt-2 h-2.5 w-full max-w-xs bg-gray-200 border-[1.5px] border-black rounded-full overflow-hidden"
												role="progressbar"
												aria-valuenow={runProgress(run)}
												aria-valuemin="0"
												aria-valuemax="100"
												aria-label="Render progress"
											>
												<div
													class="h-full bg-brand-accent transition-all duration-300"
													style="width: {runProgress(run)}%"
												/>
											</div>
										{/if}
									</div>

									<div class="shrink-0 text-right">
										<div class="text-sm font-black text-black tabular-nums">
											{run.counts?.delivered || 0}<span class="text-gray-600"
												>/{run.counts?.total || 0}</span
											>
										</div>
										<div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
											Delivered
										</div>
									</div>

									{#if run.counts?.failed}
										<span
											class="shrink-0 hidden sm:inline-flex px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-brand-danger/20 text-black"
										>
											{run.counts.failed} failed
										</span>
									{/if}

									<span class="shrink-0 text-[10px] font-bold text-gray-600 hidden sm:block">
										{formatRelativeDate(run.createdAt)}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div
					class="bg-white rounded-2xl border-[3px] border-black border-dashed p-10 text-center"
				>
					<div
						class="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-accent border-[3px] border-black shadow-brutal-sm flex items-center justify-center"
					>
						<svg class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-black text-black uppercase tracking-wide mb-2">No runs yet</h3>
					<p class="text-sm font-bold text-gray-600 max-w-md mx-auto mb-6">
						Upload a spreadsheet or point a webhook at Pictify. Every row becomes its own
						document, rendered and delivered.
					</p>
					<a
						href="/dashboard/workflows/new"
						class="inline-flex items-center gap-2 bg-brand-accent text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all focus-brutal"
					>
						Start a run
					</a>
				</div>
			{/if}
