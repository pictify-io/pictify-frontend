<script>
	import { fade, scale, fly } from 'svelte/transition';
	import { elasticOut, quintOut } from 'svelte/easing';
	import { activeMilestone, dismissMilestone as dismissMilestoneStore } from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import { recordUpgradePrompt } from '../../../api/plg.js';
	import { goto } from '$app/navigation';

	// Confetti particles
	let particles = [];
	let lastShownId = null;

	const UPSELL_TYPES = new Set(['soft_upsell', 'urgent_upsell', 'limit_reached']);

	$: if ($activeMilestone) {
		createConfetti();
		recordShownIfUpsell($activeMilestone);
	}

	function recordShownIfUpsell(milestone) {
		if (!milestone || !UPSELL_TYPES.has(milestone.type)) return;
		const id = milestone.id || `${milestone.feature || 'renders'}-${milestone.count}`;
		if (id === lastShownId) return;
		lastShownId = id;
		recordUpgradePrompt('shown', 'milestone', {
			milestone_id: id,
			milestone_type: milestone.type,
			count: milestone.count,
			discount: milestone.cta?.discount || null
		});
	}

	async function dismissMilestone() {
		const milestone = $activeMilestone;
		if (milestone && UPSELL_TYPES.has(milestone.type)) {
			recordUpgradePrompt('dismissed', 'milestone', {
				milestone_id: milestone.id || `${milestone.feature || 'renders'}-${milestone.count}`,
				milestone_type: milestone.type
			});
		}
		await dismissMilestoneStore();
	}

	function createConfetti() {
		particles = [];
		const colors = ['#ff6b6b', '#ffc480', '#10b981', '#6366f1', '#f59e0b'];

		for (let i = 0; i < 40; i++) {
			particles.push({
				id: i,
				x: Math.random() * 100,
				color: colors[Math.floor(Math.random() * colors.length)],
				delay: Math.random() * 0.5,
				size: Math.random() * 8 + 4,
				rotation: Math.random() * 360
			});
		}
		particles = particles;
	}

	function handleCTA() {
		const milestone = $activeMilestone;
		if (!milestone?.cta) {
			dismissMilestone();
			return;
		}

		const action = milestone.cta.action;

		switch (action) {
			case 'upgrade':
			case 'pricing':
				if (UPSELL_TYPES.has(milestone.type)) {
					recordUpgradePrompt('clicked', 'milestone', {
						milestone_id: milestone.id || `${milestone.feature || 'renders'}-${milestone.count}`,
						milestone_type: milestone.type,
						discount: milestone.cta?.discount || null
					});
				}
				dismissMilestone();
				openUpgradeModal('milestone');
				break;
			case 'templates':
				dismissMilestone();
				goto('/dashboard/template');
				break;
			case 'share':
				dismissMilestone();
				break;
			case 'continue':
			default:
				dismissMilestone();
		}
	}

	function getMilestoneIcon(type) {
		const icons = {
			celebration:
				'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', // Sparkle/Star
			soft_upsell:
				'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', // Star
			urgent_upsell: 'M13 10V3L4 14h7v7l9-11h-7z', // Zap
			limit_reached:
				'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' // Warning
		};
		return icons[type] || icons.celebration;
	}

	function getHeaderBg(type) {
		switch (type) {
			case 'celebration':
				return 'bg-[#10b981]';
			case 'soft_upsell':
				return 'bg-[#ffc480]';
			case 'urgent_upsell':
				return 'bg-[#ff6b6b]';
			case 'limit_reached':
				return 'bg-[#ff6b6b]';
			default:
				return 'bg-[#ffc480]';
		}
	}

	function getButtonBg(type) {
		switch (type) {
			case 'celebration':
				return 'bg-[#10b981] hover:bg-[#059669]';
			case 'soft_upsell':
			case 'urgent_upsell':
			case 'limit_reached':
				return 'bg-[#ffc480] hover:bg-[#ffb347]';
			default:
				return 'bg-[#ffc480] hover:bg-[#ffb347]';
		}
	}
</script>

{#if $activeMilestone}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
		on:click={dismissMilestone}
		on:keydown={(e) => e.key === 'Escape' && dismissMilestone()}
	>
		<!-- Confetti -->
		{#if $activeMilestone.type === 'celebration'}
			<div class="fixed inset-0 pointer-events-none overflow-hidden">
				{#each particles as particle (particle.id)}
					<div
						class="absolute w-2 h-2 rounded-full"
						style="
              left: {particle.x}%;
              background-color: {particle.color};
              width: {particle.size}px;
              height: {particle.size}px;
              animation: confetti-fall 3s ease-out {particle.delay}s forwards;
              transform: rotate({particle.rotation}deg);
            "
					/>
				{/each}
			</div>
		{/if}

		<!-- Modal -->
		<div
			class="relative bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-md w-full overflow-hidden"
			transition:scale={{ duration: 400, easing: elasticOut, start: 0.8 }}
			on:click|stopPropagation
		>
			<!-- Header -->
			<div
				class="{getHeaderBg(
					$activeMilestone.type
				)} py-8 relative overflow-hidden border-b-[3px] border-gray-900"
			>
				<!-- Decorative bg pattern -->
				<div
					class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]"
				/>

				<!-- Large Icon -->
				<div class="relative flex items-center justify-center z-10">
					<div
						class="w-24 h-24 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center transform rotate-3"
						in:fly={{ y: -30, duration: 500, delay: 200, easing: quintOut }}
					>
						<svg
							class="w-12 h-12 text-gray-900"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getMilestoneIcon($activeMilestone.type)}
							/>
						</svg>
					</div>
				</div>

				<!-- Close button -->
				<button
					class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 text-gray-900 transition-colors border-2 border-gray-900/20"
					on:click={dismissMilestone}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 text-center">
				<h2
					class="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight"
					in:fly={{ y: 20, duration: 400, delay: 300 }}
				>
					{$activeMilestone.title}
				</h2>

				<p
					class="text-gray-800 mb-6 font-bold text-sm leading-relaxed"
					in:fly={{ y: 20, duration: 400, delay: 400 }}
				>
					{$activeMilestone.message}
				</p>

				<!-- Time saved badge -->
				{#if $activeMilestone.timeSaved}
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-gray-900 rounded-lg text-sm font-black mb-6 border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
						in:fly={{ y: 20, duration: 400, delay: 450 }}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						~{$activeMilestone.timeSaved} saved
					</div>
				{/if}

				<!-- Discount badge -->
				{#if $activeMilestone.cta?.discount}
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc480] text-gray-900 rounded-lg text-sm font-black mb-6 border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform rotate-1"
						in:scale={{ duration: 400, delay: 500, start: 0.8 }}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
							/>
						</svg>
						{$activeMilestone.cta.discount}% OFF - Limited Time!
					</div>
				{/if}

				<!-- CTA Button -->
				{#if $activeMilestone.cta}
					<div class="space-y-3" in:fly={{ y: 20, duration: 400, delay: 500 }}>
						<button
							class="w-full py-3 px-6 {getButtonBg(
								$activeMilestone.type
							)} text-gray-900 font-black uppercase tracking-widest text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							on:click={handleCTA}
						>
							{$activeMilestone.cta.text}
						</button>

						{#if $activeMilestone.type !== 'celebration'}
							<button
								class="text-xs text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest transition-colors py-2"
								on:click={dismissMilestone}
							>
								Maybe later
							</button>
						{/if}
					</div>
				{:else}
					<button
						class="w-full py-3 px-6 bg-gray-900 text-white font-black uppercase tracking-widest text-sm rounded-lg border-2 border-gray-900 hover:bg-black shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						on:click={dismissMilestone}
					>
						Continue Creating
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes confetti-fall {
		0% {
			transform: translateY(-100vh) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) rotate(720deg);
			opacity: 0;
		}
	}
</style>
