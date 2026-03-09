<script>
	import SignUpButton from './SignUpButton.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { analytics } from '$lib/analytics.js';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	// Demo template config
	const DEMO_TEMPLATE_UID = '4M26J82TW7';

	// Live demo state — matches template variable names
	let header = 'Generate';
	let heading_2 = 'DYNAMIC';
	let header_3 = 'Images';
	let subheading = 'EDIT THE DATA BELOW';

	// Image state
	let imageSrc = '';
	let imageUrl = '';
	let loading = false;
	let lastFetchedKey = '';

	async function renderTemplate(vars) {
		const key = JSON.stringify(vars);
		if (key === lastFetchedKey) return;
		lastFetchedKey = key;
		loading = true;
		try {
			const res = await fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variables: vars }),
			});
			if (!res.ok) return;
			const data = await res.json();
			imageSrc = data.dataUrl || data.url;
			imageUrl = data.url || '';
		} catch (e) {
			// silently fail — demo is non-critical
		} finally {
			loading = false;
		}
	}

	// Debounced fetch on input change
	let debounceTimer;
	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			renderTemplate({ header, heading_2, header_3, subheading });
		}, 600);
	}

	// Mobile auto-cycle through preset data
	let mobilePresetIndex = 0;
	const mobilePresets = [
		{ header: 'Generate', heading_2: 'DYNAMIC', header_3: 'Images', subheading: 'EDIT THE DATA BELOW' },
		{ header: 'Generate', heading_2: 'SOCIAL', header_3: 'Cards', subheading: 'WITH A SINGLE API CALL' },
		{ header: 'Ship', heading_2: 'CUSTOM', header_3: 'Visuals', subheading: 'AT SCALE IN SECONDS' }
	];

	let mobileImageSrc = '';
	let mobilePresetUrls = [];

	async function prefetchMobileImages() {
		for (const preset of mobilePresets) {
			try {
				const res = await fetch(`${PUBLIC_BACKEND_URL}/public-render/${DEMO_TEMPLATE_UID}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variables: preset }),
				});
				if (!res.ok) { mobilePresetUrls.push(''); continue; }
				const data = await res.json();
				mobilePresetUrls.push(data.dataUrl || data.url || '');
			} catch (e) {
				mobilePresetUrls.push('');
			}
		}
		if (mobilePresetUrls.length > 0) {
			mobileImageSrc = mobilePresetUrls[0];
		}
	}

	onMount(() => {
		// Initial fetch for desktop
		renderTemplate({ header, heading_2, header_3, subheading });

		// Only run mobile cycle on small screens
		const isMobile = window.matchMedia('(max-width: 1023px)').matches;
		let mobileInterval;

		if (isMobile) {
			prefetchMobileImages();
			mobileInterval = setInterval(() => {
				mobilePresetIndex = (mobilePresetIndex + 1) % mobilePresets.length;
				if (mobilePresetUrls[mobilePresetIndex]) {
					mobileImageSrc = mobilePresetUrls[mobilePresetIndex];
				}
			}, 3000);
		}

		return () => {
			if (mobileInterval) clearInterval(mobileInterval);
			clearTimeout(debounceTimer);
		};
	});

	$: mobilePreset = mobilePresets[mobilePresetIndex];

	let mouseX = 0;
	let mouseY = 0;

	function handleMouseMove(e) {
		const { clientX, clientY, currentTarget } = e;
		const { left, top, width, height } = currentTarget.getBoundingClientRect();
		mouseX = (clientX - left) / width - 0.5;
		mouseY = (clientY - top) / height - 0.5;
	}
</script>

<section class="w-full pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>

	<!-- Decorative Blobs -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<div
		class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center relative z-10"
	>
		<!-- Left Column: Text -->
		<div class="flex flex-col items-start text-left space-y-8">
			<!-- Eyebrow -->
			<div
				in:fly={{ y: 20, duration: 800, delay: 0 }}
				class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] animate-[float_6s_ease-in-out_infinite]"
			>
				<div class="flex gap-1">
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#ff6b6b] rounded-full animate-pulse" />
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#ffc480] rounded-full animate-pulse delay-75" />
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#4ade80] rounded-full animate-pulse delay-150" />
				</div>
				<span class="text-xs sm:text-sm font-bold text-gray-900 tracking-wide uppercase"
					>Programmable Image Engine</span
				>
			</div>

			<!-- Headline -->
			<h1
				in:fly={{ y: 20, duration: 800, delay: 150 }}
				class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight"
			>
				Ship Personalized<br />
				Images at <span class="relative inline-block text-[#ff6b6b]">
					API Speed
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>.
			</h1>

			<!-- Subheadline -->
			<p
				in:fly={{ y: 20, duration: 800, delay: 300 }}
				class="text-lg sm:text-xl text-gray-700 max-w-lg leading-relaxed font-medium border-l-[4px] border-[#ffc480] pl-4 sm:pl-6"
			>
				Generate thousands of personalized images from a single template. One API call, pixel-perfect output in &lt;200ms. No headless browsers. No infrastructure headaches.
			</p>

			<!-- CTAs -->
			<div in:fly={{ y: 20, duration: 800, delay: 450 }} class="flex flex-col gap-6 w-full sm:w-auto min-w-[320px]">
				<div class="flex flex-col sm:flex-row items-stretch gap-4">
					<SignUpButton
						text="Start Building Free"
						location="hero"
						class="flex-1 bg-[#ff6b6b] text-white text-lg px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-black uppercase tracking-wider text-center"
					/>

					<a
						href="https://docs.pictify.io"
						target="_blank"
						class="flex-1 group flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-bold"
						on:click={() => analytics.trackOutboundLink({ url: 'https://docs.pictify.io', link_text: 'View Docs', location: 'hero' })}
					>
						<span>View Docs</span>
						<svg
							class="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</a>
				</div>
				<!-- Micro-copy -->
				<div class="flex items-center gap-2 text-sm text-gray-600 font-bold justify-center sm:justify-start">
					<svg class="w-5 h-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
					<span>50 free credits/mo</span>
					<span class="w-1 h-1 rounded-full bg-gray-300"></span>
					<span>No card needed</span>
					<span class="w-1 h-1 rounded-full bg-gray-300"></span>
					<span>Plans from $39/mo</span>
				</div>
			</div>

			<!-- Trust/Stats -->
			<div in:fly={{ y: 20, duration: 800, delay: 600 }} class="pt-8 w-full border-t-2 border-dashed border-gray-200">
				<!-- Redesigned Trust Stats (Badges) -->
				<div class="flex flex-wrap items-center gap-3 sm:gap-5 mb-8">
					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">&lt;200ms Response</span>
					</div>

					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">99.9% Uptime SLA</span>
					</div>

					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">10M+ Images Rendered</span>
					</div>
				</div>

				<!-- Integrations -->
				<div class="flex flex-col gap-4">
					<span class="text-xs font-black text-gray-400 uppercase tracking-widest">Works With</span>
					<div class="flex flex-wrap items-center gap-3">
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#61DAFB] transition-all" title="React">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#61DAFB"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.14c-1.87-.2-3.57-1.09-4.88-2.61a5.626 5.626 0 0 0 4.88 2.61zm7.17-2.61c-1.31 1.52-3.01 2.41-4.88 2.61 1.87-.2 3.57-1.09 4.88-2.61zM4.1 12c0 1.95.7 3.73 1.86 5.11-1.35-1.46-2.16-3.32-2.16-5.41s.81-3.95 2.16-5.41C4.8 7.67 4.1 9.45 4.1 12zm7.9-7.89c1.87.2 3.57 1.09 4.88 2.61A5.626 5.626 0 0 0 12 4.11zm-4.88 2.61c1.31-1.52 3.01-2.41 4.88-2.61-1.87.2-3.57 1.09-4.88 2.61zm10.74 5.28c0 2.09-.81 3.95-2.16 5.41 1.16-1.38 1.86-3.16 1.86-5.11s-.7-3.73-1.86-5.11c1.35 1.46 2.16 3.32 2.16 5.41zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>
						</div>
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#3776AB] transition-all" title="Python">
							<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#3776AB" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/><path fill="#FFD43B" d="M12.91 10.7c.07.01.13.02.2.03l.06.01h.06l.06.01h8.17v-8.24h-8.23v8.19z"/></svg>
						</div>
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#339933] transition-all" title="Node.js">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#339933"><path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/></svg>
						</div>
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#FF4F00] transition-all" title="Zapier">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#FF4F00"><path d="M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Z"/></svg>
						</div>
						<div class="px-3 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
							+ REST API
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile Visual (visible on mobile, hidden on lg) -->
		<div class="block lg:hidden w-full">
			<div class="relative mx-auto max-w-md">
				<div class="bg-white rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden transform rotate-1">
					<div class="h-10 bg-white border-b-[3px] border-gray-900 flex items-center px-4 relative z-10">
						<div class="flex gap-1.5">
							<div class="w-2.5 h-2.5 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-[#ffc480] border-[2px] border-gray-900"></div>
							<div class="w-2.5 h-2.5 rounded-full bg-[#4ade80] border-[2px] border-gray-900"></div>
						</div>
						<div class="flex-1 flex justify-center">
							<a href={imageUrl || '#'} target="_blank" rel="noopener noreferrer" class="bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-lg px-3 py-0.5 text-[10px] font-mono font-bold text-gray-700 truncate max-w-[200px] hover:shadow-[3px_3px_0_0_#1f2937] transition-all">
								{imageUrl || 'Rendering...'}
							</a>
						</div>
					</div>

					<div class="relative bg-[#FFFDF8] aspect-[1200/630] flex items-center justify-center overflow-hidden">
						<!-- Dotted texture background -->
						<div class="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.05] pointer-events-none"></div>
						
						{#if mobileImageSrc}
							<img
								src={mobileImageSrc}
								alt="Live Pictify demo — {mobilePreset.header} {mobilePreset.heading_2} {mobilePreset.header_3}"
								class="w-full h-full object-contain relative z-10"
							/>
						{:else}
							<div class="flex items-center gap-2 text-gray-900 relative z-10">
								<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
								<span class="text-xs font-black uppercase tracking-wider">Rendering.</span>
							</div>
						{/if}
						<div class="absolute top-3 right-3 px-2.5 py-1 bg-[#4ade80] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5 transform rotate-2 z-20">
							<div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
							LIVE
						</div>
					</div>

					<div class="p-3 border-t-[3px] border-gray-900 bg-[#FFFDF8] relative text-center">
						<div class="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.03] pointer-events-none"></div>
						<span class="inline-block px-3 py-1 bg-[#ffc480] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-full text-[10px] font-black text-gray-900 uppercase tracking-wider transform -rotate-1 relative z-10">Real-time render — auto-cycling</span>
					</div>
				</div>
			</div>
		</div>

		<div
			class="relative w-full hidden lg:block mt-8"
			on:mousemove={handleMouseMove}
			on:mouseleave={() => { mouseX = 0; mouseY = 0; }}
			role="presentation"
			aria-hidden="true"
		>


			<div
				class="relative w-full transition-transform duration-200 ease-out z-10"
				style="transform: perspective(1000px) rotateX({-mouseY * 3}deg) rotateY({mouseX * 3}deg)"
			>
                <!-- Floating Badges attached to the 3D card -->
                <div class="absolute -top-6 -right-4 lg:-top-8 lg:-right-6 xl:-right-12 z-30 transform rotate-6 hover:rotate-12 hover:-translate-y-2 transition-transform">
                    <div class="bg-[#4ade80] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] px-4 py-1.5 flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full bg-white border-[2px] border-gray-900"></div>
                        <span class="text-xs font-black uppercase tracking-widest text-gray-900">Live Render</span>
                    </div>
                </div>

                <div class="absolute -top-6 -left-6 lg:-top-8 lg:-left-12 z-30 transform -rotate-6 hover:-rotate-12 hover:-translate-y-2 transition-transform">
                    <div class="bg-[#ffc480] border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937] px-4 py-1.5 flex items-center gap-2">
                        <span class="text-sm font-black uppercase tracking-widest text-gray-900">~200ms</span>
                    </div>
                </div>



                <!-- Main clipped background card -->
				<div class="bg-white rounded-3xl border-[3px] border-gray-900 shadow-[16px_16px_0_0_#1f2937] overflow-hidden relative z-20">
					<!-- Toolbar -->
					<div class="h-14 bg-white border-b-[3px] border-gray-900 flex items-center px-5 relative z-10">
						<div class="flex gap-2">
							<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-[2px] border-gray-900 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-[2px] border-gray-900 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]"></div>
						</div>
						<div class="flex-1 flex justify-center">
							<a href={imageUrl || '#'} target="_blank" rel="noopener noreferrer" class="bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg px-4 py-1.5 text-xs font-mono font-bold text-gray-700 truncate max-w-[400px] transform -rotate-1 hover:shadow-[5px_5px_0_0_#1f2937] hover:-translate-y-0.5 transition-all">
								{imageUrl || 'Rendering API Link...'}
							</a>
						</div>
					</div>

						<!-- Live rendered image area -->
					<div class="relative bg-[#FFFDF8] aspect-[1200/630] flex items-center justify-center overflow-hidden">
						<!-- Dotted texture background -->
						<div class="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.05] pointer-events-none"></div>

						{#if imageSrc}
							<img
								src={imageSrc}
								alt="Live Pictify demo — {header} {heading_2} {header_3}"
								class="w-full h-full object-contain transition-opacity duration-300 relative z-10"
								class:opacity-50={loading}
							/>
						{:else}
							<div class="flex items-center gap-3 text-gray-900 relative z-10">
								<svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
								<span class="text-lg font-black uppercase tracking-widest">Rendering</span>
							</div>
						{/if}
					</div>

					<!-- Interactive inputs -->
					<div class="p-6 md:p-8 border-t-[3px] border-gray-900 bg-[#FFFDF8] relative overflow-hidden">
						<div class="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.03] pointer-events-none"></div>
						
						<div class="mb-5 inline-block">
							<div class="bg-[#ff6b6b] text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transform rotate-1 relative z-10">
								Try The API — Edit Data
							</div>
						</div>
						
						<div class="grid grid-cols-2 gap-5 sm:gap-6 relative z-10 w-full max-w-2xl">
							<div class="flex flex-col gap-2">
								<label for="hero-header" class="text-xs font-black uppercase tracking-widest text-gray-900 ml-1">Header</label>
								<input
									id="hero-header"
									bind:value={header}
									on:input={handleInput}
									class="px-5 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl text-base font-bold text-gray-900 w-full focus:outline-none focus:translate-y-1 focus:translate-x-1 shadow-[4px_4px_0_0_#1f2937] focus:shadow-[0px_0px_0_0_#1f2937] transition-all"
									placeholder="Header"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="hero-header2" class="text-xs font-black uppercase tracking-widest text-gray-900 ml-1">Header 2</label>
								<input
									id="hero-header2"
									bind:value={heading_2}
									on:input={handleInput}
									class="px-5 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl text-base font-bold text-gray-900 w-full focus:outline-none focus:translate-y-1 focus:translate-x-1 shadow-[4px_4px_0_0_#1f2937] focus:shadow-[0px_0px_0_0_#1f2937] transition-all"
									placeholder="Header 2"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="hero-header3" class="text-xs font-black uppercase tracking-widest text-gray-900 ml-1">Header 3</label>
								<input
									id="hero-header3"
									bind:value={header_3}
									on:input={handleInput}
									class="px-5 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl text-base font-bold text-gray-900 w-full focus:outline-none focus:translate-y-1 focus:translate-x-1 shadow-[4px_4px_0_0_#1f2937] focus:shadow-[0px_0px_0_0_#1f2937] transition-all"
									placeholder="Header 3"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<label for="hero-subheading" class="text-xs font-black uppercase tracking-widest text-gray-900 ml-1">Subheading</label>
								<input
									id="hero-subheading"
									bind:value={subheading}
									on:input={handleInput}
									class="px-5 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl text-base font-bold text-gray-900 w-full focus:outline-none focus:translate-y-1 focus:translate-x-1 shadow-[4px_4px_0_0_#1f2937] focus:shadow-[0px_0px_0_0_#1f2937] transition-all"
									placeholder="Subheading"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(-1deg); }
		50% { transform: translateY(-5px) rotate(1deg); }
	}
</style>
