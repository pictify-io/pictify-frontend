<script>
	import { createEventDispatcher } from 'svelte';
	import {
		GETTING_STARTED_STEPS,
		DEFAULT_GETTING_STARTED_STEPS,
		getCurlExample
	} from '../../../config/personalization.js';

	export let hasApiKey = false;
	export let hasTemplates = false;
	export let hasImages = false;
	export let intent = null;
	export let apiKey = '';

	const dispatch = createEventDispatcher();

	$: steps = (intent && GETTING_STARTED_STEPS[intent]) || DEFAULT_GETTING_STARTED_STEPS;

	// Interpolate {{API_KEY}} in installCommand with the actual key
	function resolveCommand(command) {
		if (!command) return command;
		return command.replace('{{API_KEY}}', apiKey || 'your_api_key_here');
	}

	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	let copiedIndex = null;
	let activeTabs = {};

	// Resolve {{BACKEND_URL}} and {{API_KEY}} in tabbed guide steps
	function resolveTabStep(text) {
		return text
			.replace('{{BACKEND_URL}}', PUBLIC_BACKEND_URL)
			.replace('{{API_KEY}}', apiKey || 'your_api_key_here');
	}

	function isCompleted(step) {
		if (step.completedCheck === 'hasApiKey') return hasApiKey;
		if (step.completedCheck === 'hasTemplates') return hasTemplates;
		if (step.completedCheck === 'hasImages') return hasImages;
		return false;
	}

	async function copyCommand(text, index) {
		try {
			await navigator.clipboard.writeText(text);
			copiedIndex = index;
			setTimeout(() => (copiedIndex = null), 2000);
		} catch {
			// fallback — select text
		}
	}

	$: completedCount = steps.filter((s) => isCompleted(s)).length;
	$: curlExample = getCurlExample(apiKey);
</script>

<div
	class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden"
>
	<!-- Header -->
	<div
		class="flex items-center justify-between px-6 py-4 bg-[#ffc480] border-b-[3px] border-black"
	>
		<div class="flex items-center gap-3">
			<div
				class="w-10 h-10 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0_0_black]"
			>
				<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-black text-black uppercase tracking-widest">Getting Started</h3>
				<p class="text-xs font-bold text-black/60">{completedCount}/{steps.length} complete</p>
			</div>
		</div>
		<button
			on:click={() => dispatch('dismiss')}
			class="text-xs font-bold text-black/50 hover:text-black underline underline-offset-2 transition-colors"
		>
			Hide guide
		</button>
	</div>

	<!-- Steps -->
	<div class="p-6 space-y-4">
		{#each steps as step}
			{@const completed = isCompleted(step)}
			<div
				class="relative rounded-2xl border-[3px] transition-all duration-200
					{completed
					? 'border-gray-200 bg-gray-50/50'
					: 'border-black bg-white shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-0.5'}"
			>
				<div class="p-5">
					<div class="flex items-start gap-4">
						<!-- Step Number / Check -->
						<div
							class="w-10 h-10 rounded-xl border-[3px] flex items-center justify-center flex-shrink-0 text-sm font-black
								{completed
								? 'border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]'
								: 'border-black shadow-[2px_2px_0_0_black]'}"
							style={!completed ? `background-color: ${step.color}` : ''}
						>
							{#if completed}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								{step.number}
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<h4
								class="text-base font-black
									{completed ? 'text-gray-400 line-through decoration-2' : 'text-black'}"
							>
								{step.title}
							</h4>
							<p
								class="text-sm font-medium mt-1 leading-relaxed
									{completed ? 'text-gray-400' : 'text-gray-600'}"
							>
								{step.description}
							</p>

							<!-- Inline code snippet -->
							{#if step.code && !completed}
								<div
									class="mt-3 px-4 py-2.5 bg-[#1e1e1e] rounded-lg border-[2px] border-black font-mono text-xs text-gray-300 overflow-x-auto"
								>
									<span class="text-[#ffc480]">{step.code}</span>
								</div>
							{/if}

							<!-- Inline API key display -->
							{#if step.showApiKey && !completed}
								{#if apiKey}
									<div class="mt-3 relative">
										<div
											class="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] rounded-lg border-[2px] border-black font-mono text-sm text-gray-300 overflow-x-auto"
										>
											<span class="text-[#ffc480] flex-1 truncate">{apiKey}</span>
											<button
												on:click={() => copyCommand(apiKey, step.number)}
												class="flex-shrink-0 px-2 py-1 rounded border border-gray-600 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
											>
												{#if copiedIndex === step.number}
													Copied!
												{:else}
													Copy
												{/if}
											</button>
										</div>
									</div>
								{/if}
							{/if}

							<!-- Sample prompt (copyable block) -->
							{#if step.samplePrompt && !completed}
								<div class="mt-3 relative">
									<div
										class="px-4 py-3 bg-[#1e1e1e] rounded-lg border-[2px] border-black text-[13px] text-gray-300 leading-relaxed"
									>
										<div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sample prompt</div>
										<div class="text-gray-200">{step.samplePrompt}</div>
										<div class="mt-3 flex justify-end">
											<button
												on:click={() => copyCommand(step.samplePrompt, step.number)}
												class="flex-shrink-0 px-2 py-1 rounded border border-gray-600 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
											>
												{#if copiedIndex === step.number}
													Copied!
												{:else}
													Copy
												{/if}
											</button>
										</div>
									</div>
								</div>
							{/if}

							<!-- Install command (copyable terminal block) -->
							{#if step.installCommand && !completed}
								{@const resolved = resolveCommand(step.installCommand)}
								<div class="mt-3 relative group">
									<div
										class="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] rounded-lg border-[2px] border-black font-mono text-sm text-gray-300 overflow-x-auto"
									>
										<span class="text-gray-500 select-none">$</span>
										<span class="text-[#4ade80] flex-1">{resolved}</span>
										<button
											on:click={() => copyCommand(resolved, step.number)}
											class="flex-shrink-0 px-2 py-1 rounded border border-gray-600 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
										>
											{#if copiedIndex === step.number}
												Copied!
											{:else}
												Copy
											{/if}
										</button>
									</div>
								</div>
							{/if}

							<!-- Tabbed guide (e.g. no-code tools) -->
							{#if step.tabbedGuide && !completed}
								{@const tabs = step.tabbedGuide.tabs}
								<div class="mt-3">
									<!-- Tab buttons -->
									<div class="flex gap-0 border-[2px] border-black rounded-lg overflow-hidden">
										{#each tabs as tab}
											<button
												on:click={() => { activeTabs[step.number] = tab.id; activeTabs = activeTabs; }}
												class="flex-1 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors border-r-[2px] border-black last:border-r-0
													{(activeTabs[step.number] || tabs[0].id) === tab.id
													? 'bg-[#ffc480] text-black'
													: 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black'}"
											>
												{tab.label}
											</button>
										{/each}
									</div>

									<!-- Steps for active tab -->
									{#each tabs as tab (tab.id)}
										{#if (activeTabs[step.number] || tabs[0].id) === tab.id}
											<div class="mt-2 border-[2px] border-black rounded-lg overflow-hidden">
												{#each tab.steps as tabStep, i}
													<div class="{i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} {i < tab.steps.length - 1 ? 'border-b border-gray-200' : ''}">
														<div class="flex items-start gap-3 px-4 py-3">
															<span
																class="w-5 h-5 rounded-full border-[2px] border-black flex items-center justify-center flex-shrink-0 text-[10px] font-black bg-gray-100 mt-0.5"
															>
																{i + 1}
															</span>
															<span class="text-[13px] font-semibold text-gray-800 leading-relaxed">
																{tabStep.text}
															</span>
														</div>
														{#if tabStep.code}
															<div class="mx-4 mb-3 ml-12 px-3 py-2 bg-[#1e1e1e] rounded-md font-mono text-[12px] text-[#4ade80] whitespace-pre-wrap leading-relaxed">
																{resolveTabStep(tabStep.code)}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
									{/each}
								</div>
							{/if}

							<!-- Curl example -->
							{#if step.showCurl && !completed}
								<div
									class="mt-3 px-4 py-3 bg-[#1e1e1e] rounded-lg border-[2px] border-black font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed"
								>{curlExample}</div>
							{/if}

							<!-- CTA -->
							{#if !completed && step.href && step.cta}
								<a
									href={step.href}
									target={step.external ? '_blank' : undefined}
									rel={step.external ? 'noopener noreferrer' : undefined}
									class="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-lg border-[2px] border-black text-sm font-black uppercase tracking-wider shadow-[2px_2px_0_0_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									style="background-color: {step.color}"
								>
									{step.cta}
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										{#if step.external}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
											/>
										{:else}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M14 5l7 7m0 0l-7 7m7-7H3"
											/>
										{/if}
									</svg>
								</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Next Steps Footer -->
	<div class="px-6 pb-5">
		<div
			class="rounded-xl border-[2px] border-dashed border-gray-300 bg-gray-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
		>
			<span class="text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap"
				>Next steps</span
			>
			<div class="flex items-center gap-4 flex-wrap">
				<a
					href="/dashboard/api-playground"
					class="text-sm font-bold text-black hover:text-[#ff6b6b] underline underline-offset-2 transition-colors"
				>
					API Playground
				</a>
				<a
					href="https://docs.pictify.io"
					target="_blank"
					class="text-sm font-bold text-black hover:text-[#ff6b6b] underline underline-offset-2 transition-colors"
				>
					Documentation
				</a>
				<a
					href="/dashboard/template"
					class="text-sm font-bold text-black hover:text-[#ff6b6b] underline underline-offset-2 transition-colors"
				>
					Browse Templates
				</a>
			</div>
		</div>
	</div>
</div>
