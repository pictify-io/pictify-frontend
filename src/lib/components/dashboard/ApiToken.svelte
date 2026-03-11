<script>
	import {
		user,
		getAPITokenAction,
		createAPITokenAction,
		deleteAPITokenAction,
		getPlanDetailsAction
	} from '../../../store/user.store';
	import { onMount } from 'svelte';
	import CopyIcon from '$lib/assets/dashboard/Copy Icons.png';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { plgStatus, usageWidget, initPLG } from '../../../store/plg.store';
	import { copyToClipboard } from '$lib/utils/format.js';

	let isLoading = true;
	let tokenToRevoke = null;
	let showRevokeConfirm = false;

	// Use reactive statements for store values - more reliable than manual subscription
	$: apiTokens = $user.apiTokens || [];
	$: currentPlan = $user.currentPlan || '';

	onMount(async () => {
		await Promise.all([getAPITokenAction(), getPlanDetailsAction(), initPLG()]);
		isLoading = false;
	});

	function confirmRevoke(token) {
		tokenToRevoke = token;
		showRevokeConfirm = true;
	}

	async function executeRevoke() {
		if (tokenToRevoke) {
			await deleteAPITokenAction(tokenToRevoke.uid);
			toast.set({ message: 'API key revoked successfully', type: 'success', duration: 2000 });
		}
		showRevokeConfirm = false;
		tokenToRevoke = null;
	}

	function cancelRevoke() {
		showRevokeConfirm = false;
		tokenToRevoke = null;
	}

	// Time saved calculation
	$: timeSaved = $plgStatus.timeSaved?.display || '0 minutes';

	// Usage calculation
	$: usagePercent = $usageWidget.percentage || 0;
	$: usageColor = usagePercent >= 90 ? '#ff6b6b' : usagePercent >= 75 ? '#ffc480' : '#4ade80';
</script>

<section class="min-h-full">
	<div>
		<!-- Page Header -->
		<div
			class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12"
		>
			<div>
				<div
					class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3"
				>
					<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#4ade80] rounded-full animate-pulse" />
					Live Console
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					API <span
						class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600"
						>Access</span
					>
				</h1>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Current Plan
					</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">
						{currentPlan || 'Starter'}
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
			<!-- Left Column: Usage & Metrics (The "Monitor") -->
			<div class="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
				<!-- Usage Monitor -->
				<div
					class="bg-white rounded-xl sm:rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] overflow-hidden relative group"
				>
					<!-- Monitor Header -->
					<div
						class="bg-gray-100 border-b-[3px] border-gray-900 p-3 sm:p-4 flex justify-between items-center"
					>
						<span
							class="text-[10px] sm:text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"
						>
							<svg
								class="w-3 h-3 sm:w-4 sm:h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/></svg
							>
							Usage Monitor
						</span>
						<div class="flex gap-1">
							<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-900" />
							<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-900 opacity-30" />
						</div>
					</div>

					<div class="p-4 sm:p-6">
						<!-- Big Percentage -->
						<div class="flex items-end justify-between mb-2">
							<div
								class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-none tracking-tighter"
							>
								{Math.round(usagePercent)}<span class="text-lg sm:text-xl md:text-2xl text-gray-400"
									>%</span
								>
							</div>
							<div
								class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide text-right mb-1"
							>
								{$usageWidget.current} / {$usageWidget.limit} <br /> Renders
							</div>
						</div>

						<!-- Retro Progress Bar -->
						<div
							class="h-5 sm:h-6 w-full bg-gray-100 border-[2px] border-gray-900 rounded-lg overflow-hidden relative"
						>
							<!-- Grid pattern overlay -->
							<div
								class="absolute inset-0 z-10 opacity-20 pointer-events-none"
								style="background-image: linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%); background-size: 4px 100%;"
							/>
							<!-- Fill -->
							<div
								class="h-full transition-all duration-500 ease-out border-r-[2px] border-gray-900 relative"
								style="width: {Math.max(5, usagePercent)}%; background-color: {usageColor}"
							/>
						</div>

						<div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-dashed border-gray-200">
							<button
								class="w-full py-2.5 sm:py-3 bg-gray-900 text-white font-bold uppercase tracking-wider text-xs sm:text-sm rounded-lg hover:bg-[#ffc480] hover:text-gray-900 transition-colors flex items-center justify-center gap-2 group/btn"
							>
								Increase Limits
								<svg
									class="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/></svg
								>
							</button>
						</div>
					</div>
				</div>

				<!-- Efficiency Ticket -->
				<div
					class="bg-[#ffc480] rounded-xl sm:rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[8px_8px_0_0_#1f2937] relative overflow-hidden"
				>
					<!-- Ticket Perforations -->
					<div
						class="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 bg-[#FFFDF8] rounded-full border-[2px] sm:border-[3px] border-gray-900"
					/>
					<div
						class="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 bg-[#FFFDF8] rounded-full border-[2px] sm:border-[3px] border-gray-900"
					/>

					<div class="p-4 sm:p-6 text-center">
						<div
							class="text-[10px] sm:text-xs font-black text-gray-900/60 uppercase tracking-widest mb-2"
						>
							Productivity Gain
						</div>
						<div
							class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight"
						>
							~{timeSaved}
						</div>
						<div
							class="inline-block bg-white px-2 sm:px-3 py-0.5 sm:py-1 rounded border-2 border-gray-900 text-[10px] sm:text-xs font-bold text-gray-900 transform -rotate-2"
						>
							Hours Saved
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Tokens (The "Key Rack") -->
			<div class="lg:col-span-2">
				<div
					class="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] sm:shadow-[12px_12px_0_0_#1f2937] h-full flex flex-col relative overflow-hidden"
				>
					<!-- Header -->
					<div
						class="p-4 sm:p-6 md:p-8 border-b-[3px] border-gray-900 bg-[#FFFDF8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
					>
						<div>
							<h2
								class="text-xl sm:text-2xl font-black text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3"
							>
								API Keys
								<span
									class="text-[10px] sm:text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-md border-2 border-gray-300"
									>{apiTokens.length} Active</span
								>
							</h2>
							<p class="text-gray-600 font-medium text-xs sm:text-sm mt-1">
								Manage access tokens for your applications.
							</p>
						</div>
						<button
							on:click={createAPITokenAction}
							class="group relative px-4 sm:px-6 py-2 sm:py-3 bg-[#4ade80] text-gray-900 font-black text-xs sm:text-sm uppercase tracking-wide rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] sm:shadow-[4px_4px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] sm:hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-full sm:w-auto"
						>
							<span class="flex items-center justify-center gap-2">
								<svg
									class="w-4 h-4 sm:w-5 sm:h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M12 4v16m8-8H4"
									/></svg
								>
								Generate Key
							</span>
						</button>
					</div>

					<!-- List Area -->
					<div
						class="p-4 sm:p-6 md:p-8 flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
					>
						<Loader size="8" show={isLoading} />

						{#if !isLoading}
							{#if apiTokens.length > 0}
								<div class="grid gap-3 sm:gap-4">
									{#each apiTokens as token}
										<div
											class="bg-white rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 p-3 sm:p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 md:gap-6 hover:-translate-y-1 transition-transform duration-200 shadow-sm hover:shadow-md group"
										>
											<!-- Left: Status Indicator -->
											<div class="flex items-center gap-2 sm:gap-3 md:gap-4">
												<div
													class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-900 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0_0_#ffc480]"
												>
													<svg
														class="w-5 h-5 sm:w-6 sm:h-6 text-[#ffc480]"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
														/></svg
													>
												</div>
												<div class="min-w-0">
													<div class="flex items-center gap-1 sm:gap-2 flex-wrap">
														<div
															class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500"
														>
															Created
														</div>
														<div class="text-[10px] sm:text-xs font-black text-gray-900 truncate">
															{new Date(token.createdAt).toLocaleDateString('en-US', {
																month: 'short',
																day: 'numeric',
																year: 'numeric'
															})}
														</div>
													</div>
													<div
														class="mt-1 inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 text-[9px] sm:text-[10px] font-bold uppercase"
													>
														<span
															class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse"
														/> Active
													</div>
												</div>
											</div>

											<!-- Middle: Token -->
											<div
												class="flex-1 bg-gray-50 rounded-lg border-2 border-gray-200 p-2 sm:p-3 flex items-center justify-between group-hover:border-gray-400 transition-colors min-w-0"
											>
												<code
													class="font-mono text-xs sm:text-sm font-bold text-gray-800 truncate mr-2 sm:mr-4"
												>
													{token.token.slice(0, 12)}...{token.token.slice(-4)}
												</code>
												<button
													class="p-1.5 sm:p-2 hover:bg-white rounded-md border border-transparent hover:border-gray-300 transition-all hover:shadow-sm flex-shrink-0"
													on:click={() => copyToClipboard(token.token)}
													title="Copy to clipboard"
												>
													<img
														src={CopyIcon}
														alt="Copy"
														class="w-3 h-3 sm:w-4 sm:h-4 opacity-60 hover:opacity-100"
													/>
												</button>
											</div>

											<!-- Right: Actions -->
											<button
												class="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-red-600 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-50 transition-colors uppercase tracking-wide border-2 border-transparent hover:border-red-100 w-full md:w-auto"
												on:click={() => confirmRevoke(token)}
											>
												Revoke
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<div
									class="flex flex-col items-center justify-center h-48 sm:h-64 text-center border-[3px] sm:border-4 border-dashed border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50/50 p-4"
								>
									<div
										class="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full border-[2px] sm:border-[3px] border-gray-900 flex items-center justify-center mb-3 sm:mb-4 shadow-md"
									>
										<svg
											class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/></svg
										>
									</div>
									<h3 class="text-lg sm:text-xl font-black text-gray-900 mb-1 px-2">
										No Keys Generated
									</h3>
									<p class="text-xs sm:text-sm text-gray-500 font-medium max-w-xs px-2">
										Create your first API key to start building with Pictify.
									</p>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- Revoke Confirmation Modal -->
	{#if showRevokeConfirm}
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
		>
			<div
				class="bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-md w-full relative overflow-hidden"
			>
				<!-- Header Strip -->
				<div
					class="absolute top-0 left-0 w-full h-1.5 bg-[#ff6b6b] border-b-[3px] border-gray-900 z-10"
				/>

				<div class="p-6 pt-8">
					<!-- Warning Icon -->
					<div class="flex justify-center mb-4">
						<div
							class="w-14 h-14 rounded-xl bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center"
						>
							<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
					</div>

					<h3 class="text-xl font-black text-gray-900 text-center uppercase tracking-tight mb-2">
						Revoke API Key?
					</h3>
					<p class="text-sm text-gray-600 text-center font-medium mb-6 leading-relaxed">
						This action cannot be undone. Any applications using this key will immediately lose
						access.
					</p>

					{#if tokenToRevoke}
						<div class="bg-gray-50 rounded-lg border-2 border-gray-200 p-3 mb-6">
							<code class="font-mono text-xs font-bold text-gray-600">
								{tokenToRevoke.token.slice(0, 12)}...{tokenToRevoke.token.slice(-4)}
							</code>
						</div>
					{/if}

					<div class="flex gap-3">
						<button
							on:click={cancelRevoke}
							class="flex-1 px-4 py-3 text-xs font-black text-gray-900 bg-white rounded-lg border-[3px] border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all uppercase tracking-widest"
						>
							Cancel
						</button>
						<button
							on:click={executeRevoke}
							class="flex-1 px-4 py-3 text-xs font-black text-white bg-[#ff6b6b] rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest"
						>
							Revoke Key
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</section>

<Toast />
