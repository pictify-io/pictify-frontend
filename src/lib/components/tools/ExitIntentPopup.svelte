<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';

	/**
	 * Exit Intent Popup for lead capture
	 * Shows when user moves mouse to leave the page (desktop)
	 * Or after spending time on page and scrolling up (mobile approximation)
	 */

	export let toolName = 'Pictify';
	export let generatedImageUrl = '';

	const EXIT_POPUP_SHOWN_KEY = 'pictify_exit_popup_shown';
	const EXIT_POPUP_CONVERTED_KEY = 'pictify_exit_popup_converted';

	let showPopup = false;
	let email = '';
	let isSubmitting = false;
	let hasShownPopup = false;
	let timeOnPage = 0;
	let hasScrolledUp = false;

	$: isLoggedIn = !!$user?.email;

	// Don't show popup if user is logged in or already converted
	$: shouldShowPopup = !isLoggedIn && !hasShownPopup;

	function handleMouseLeave(e) {
		// Only trigger on exiting through top of viewport
		if (e.clientY <= 0 && shouldShowPopup) {
			triggerPopup();
		}
	}

	function triggerPopup() {
		if (hasShownPopup) return;

		try {
			// Check if popup was already shown in this session
			const shown = sessionStorage.getItem(EXIT_POPUP_SHOWN_KEY);
			const converted = localStorage.getItem(EXIT_POPUP_CONVERTED_KEY);
			if (shown === 'true' || converted === 'true') {
				hasShownPopup = true;
				return;
			}
		} catch (e) {
			// Storage not available
		}

		showPopup = true;
		hasShownPopup = true;

		try {
			sessionStorage.setItem(EXIT_POPUP_SHOWN_KEY, 'true');
		} catch (e) { /* ignored */ }
	}

	function closePopup() {
		showPopup = false;
	}

	async function handleSubmit(e) {
		e.preventDefault();

		if (!email || !email.includes('@')) {
			toast.set({ message: 'Please enter a valid email', type: 'error', duration: 2000 });
			return;
		}

		isSubmitting = true;

		try {
			await fetch('/api/leads/capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					source: 'exit_intent_popup',
					toolName,
					generatedImageUrl
				})
			});

			localStorage.setItem(EXIT_POPUP_CONVERTED_KEY, 'true');
			localStorage.setItem('pictify_email_captured', 'true');

			toast.set({
				message: 'Check your email for your free API key!',
				type: 'success',
				duration: 3000
			});

			showPopup = false;
		} catch (err) {
			localStorage.setItem(EXIT_POPUP_CONVERTED_KEY, 'true');
			toast.set({ message: "Thanks! We'll be in touch.", type: 'success', duration: 2000 });
			showPopup = false;
		} finally {
			isSubmitting = false;
		}
	}

	// Mobile: detect scroll up after spending time on page
	let lastScrollY = 0;
	function handleScroll() {
		if (browser) {
			const currentY = window.scrollY;
			// If user scrolled up significantly after being on page 30+ seconds
			if (timeOnPage > 30 && currentY < lastScrollY - 100 && currentY < 200) {
				if (shouldShowPopup && !hasScrolledUp) {
					hasScrolledUp = true;
					triggerPopup();
				}
			}
			lastScrollY = currentY;
		}
	}

	let timeInterval;

	onMount(() => {
		if (!browser) return;

		// Check if already converted
		try {
			const converted = localStorage.getItem(EXIT_POPUP_CONVERTED_KEY);
			if (converted === 'true') {
				hasShownPopup = true;
				return;
			}
		} catch (e) { /* ignored */ }

		// Desktop: mouse leave detection
		document.addEventListener('mouseleave', handleMouseLeave);

		// Mobile: scroll detection + time tracking
		window.addEventListener('scroll', handleScroll, { passive: true });

		// Track time on page
		timeInterval = setInterval(() => {
			timeOnPage++;
		}, 1000);
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('mouseleave', handleMouseLeave);
		window.removeEventListener('scroll', handleScroll);
		if (timeInterval) clearInterval(timeInterval);
	});

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			closePopup();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showPopup}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/60 z-[9998] animate-fadeIn"
		on:click={closePopup}
		on:keydown={(e) => e.key === 'Enter' && closePopup()}
		role="button"
		tabindex="0"
		aria-label="Close popup"
	/>

	<!-- Popup -->
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
		<div
			class="bg-white border-[4px] border-black shadow-[12px_12px_0_0_#000] max-w-lg w-full pointer-events-auto animate-slideUp"
			role="dialog"
			aria-modal="true"
			aria-labelledby="exit-popup-title"
		>
			<!-- Header -->
			<div class="bg-[#ff6b6b] text-white px-6 py-4 border-b-[4px] border-black relative">
				<button
					on:click={closePopup}
					class="absolute top-3 right-3 w-8 h-8 bg-white text-black border-[2px] border-black flex items-center justify-center font-black hover:bg-gray-100 transition-colors"
					aria-label="Close"
				>
					X
				</button>
				<h2 id="exit-popup-title" class="text-2xl font-black uppercase tracking-tight pr-10">
					Wait! Don't lose your work
				</h2>
			</div>

			<!-- Content -->
			<div class="p-6">
				{#if generatedImageUrl}
					<div class="mb-4 border-[3px] border-black p-2 bg-gray-50">
						<img
							src={generatedImageUrl}
							alt="Your generated image"
							class="w-full h-auto max-h-32 object-contain"
						/>
					</div>
				{/if}

				<p class="text-lg font-bold text-gray-800 mb-4">
					Enter your email to save your creation and unlock:
				</p>

				<ul class="space-y-2 mb-6">
					<li class="flex items-center gap-3 font-bold">
						<span
							class="w-6 h-6 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-white text-sm"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
								><path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Watermark-free downloads
					</li>
					<li class="flex items-center gap-3 font-bold">
						<span
							class="w-6 h-6 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-white text-sm"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
								><path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Free API key (100 images/month)
					</li>
					<li class="flex items-center gap-3 font-bold">
						<span
							class="w-6 h-6 bg-[#4ade80] border-[2px] border-black flex items-center justify-center text-white text-sm"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
								><path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/></svg
							>
						</span>
						Save unlimited templates
					</li>
				</ul>

				<form on:submit={handleSubmit} class="space-y-3">
					<input
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						class="w-full px-4 py-3 border-[3px] border-black font-bold text-lg placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480]"
					/>
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full py-4 bg-[#ffc480] text-black border-[3px] border-black font-black text-lg uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
					>
						{isSubmitting ? 'Saving...' : 'Get Free Access'}
					</button>
				</form>

				<p class="text-xs text-gray-500 text-center mt-4 font-medium">
					No spam. Unsubscribe anytime.
				</p>
			</div>

			<!-- Footer -->
			<div class="px-6 py-3 bg-gray-50 border-t-[3px] border-black">
				<button
					on:click={closePopup}
					class="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-700 underline underline-offset-2"
				>
					No thanks, I'll keep the watermark
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out;
	}
</style>
