<script>
	import SignUpButton from './SignUpButton.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { analytics } from '$lib/analytics.js';

	let activeExample = 0;
	const examples = [
		{
			type: 'Social',
			code: `<div class="card">\n  <h1>New Post</h1>\n  <img src="user.jpg" />\n</div>`,
			color: 'bg-[#ff6b6b]',
			title: 'Instagram Story'
		},
		{
			type: 'E-commerce',
			code: `<div class="product">\n  <h2>Nike Air</h2>\n  <span class="price">$99</span>\n</div>`,
			color: 'bg-[#4ade80]',
			title: 'Product Card'
		},
		{
			type: 'Ticket',
			code: `<div class="ticket">\n  <h3>Concert</h3>\n  <div class="qr">...</div>\n</div>`,
			color: 'bg-[#ffc480]',
			title: 'Event Ticket'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			activeExample = (activeExample + 1) % examples.length;
		}, 4000);
		return () => clearInterval(interval);
	});

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
					>Dynamic Media API</span
				>
			</div>

			<!-- Headline -->
			<h1
				in:fly={{ y: 20, duration: 800, delay: 150 }}
				class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight"
			>
				One Template. <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Unlimited
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
				Images.
			</h1>

			<!-- Subheadline -->
			<p
				in:fly={{ y: 20, duration: 800, delay: 300 }}
				class="text-lg sm:text-xl text-gray-700 max-w-lg leading-relaxed font-medium border-l-[4px] border-[#ffc480] pl-4 sm:pl-6"
			>
				Design templates visually, render them programmatically. Generate social cards, product images, and PDFs at scale—no design team or DevOps required.
			</p>

			<!-- CTAs -->
			<div in:fly={{ y: 20, duration: 800, delay: 450 }} class="flex flex-col gap-6 w-full sm:w-auto min-w-[320px]">
				<div class="flex flex-col sm:flex-row items-stretch gap-4">
					<SignUpButton
						text="Get Your Free API Key"
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
				</div>
			</div>

			<!-- Trust/Stats -->
			<div in:fly={{ y: 20, duration: 800, delay: 600 }} class="pt-8 w-full border-t-2 border-dashed border-gray-200">
				
				<!-- Redesigned Trust Stats (Badges) -->
				<div class="flex flex-wrap items-center gap-3 sm:gap-5 mb-8">
					<!-- Speed -->
					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">&lt;500ms Response</span>
					</div>
					
					<!-- Uptime -->
					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">99.9% Uptime SLA</span>
					</div>

					<!-- Cancel Anytime -->
					<div class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 transition-transform cursor-default">
						<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
						<span class="font-bold text-sm text-gray-900">Cancel Anytime</span>
					</div>
				</div>

				<!-- Integrations -->
				<div class="flex flex-col gap-4">
					<span class="text-xs font-black text-gray-400 uppercase tracking-widest">Works With</span>
					<div class="flex flex-wrap items-center gap-3">
						<!-- React -->
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#61DAFB] transition-all" title="React">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#61DAFB"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.14c-1.87-.2-3.57-1.09-4.88-2.61a5.626 5.626 0 0 0 4.88 2.61zm7.17-2.61c-1.31 1.52-3.01 2.41-4.88 2.61 1.87-.2 3.57-1.09 4.88-2.61zM4.1 12c0 1.95.7 3.73 1.86 5.11-1.35-1.46-2.16-3.32-2.16-5.41s.81-3.95 2.16-5.41C4.8 7.67 4.1 9.45 4.1 12zm7.9-7.89c1.87.2 3.57 1.09 4.88 2.61A5.626 5.626 0 0 0 12 4.11zm-4.88 2.61c1.31-1.52 3.01-2.41 4.88-2.61-1.87.2-3.57 1.09-4.88 2.61zm10.74 5.28c0 2.09-.81 3.95-2.16 5.41 1.16-1.38 1.86-3.16 1.86-5.11s-.7-3.73-1.86-5.11c1.35 1.46 2.16 3.32 2.16 5.41zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>
						</div>
						<!-- Python -->
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#3776AB] transition-all" title="Python">
							<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#3776AB" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/><path fill="#FFD43B" d="M12.91 10.7c.07.01.13.02.2.03l.06.01h.06l.06.01h8.17v-8.24h-8.23v8.19z"/></svg>
						</div>
						<!-- Node -->
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#339933] transition-all" title="Node.js">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#339933"><path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/></svg>
						</div>
						<!-- Zapier -->
						<div class="w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#FF4F00] transition-all" title="Zapier">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#FF4F00"><path d="M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Zm10.61 8.761h.03a.577.577 0 0 1 .23.038.585.585 0 0 1 .201.124.63.63 0 0 1 .162.431.612.612 0 0 1-.162.435.58.58 0 0 1-.201.128.58.58 0 0 1-.23.042.529.529 0 0 1-.235-.042.585.585 0 0 1-.332-.328.559.559 0 0 1-.038-.235.613.613 0 0 1 .17-.431.59.59 0 0 1 .405-.162Zm2.853 1.572c.03.004.061.004.095.004.325-.011.646.064.937.219.238.144.431.355.552.609.128.279.189.582.185.888v.193a2 2 0 0 1 0 .219h-2.498c.003.227.075.45.204.642a.78.78 0 0 0 .646.265.714.714 0 0 0 .484-.136.642.642 0 0 0 .23-.318l.915.257a1.398 1.398 0 0 1-.28.537c-.14.159-.321.284-.521.355a2.234 2.234 0 0 1-.836.136 1.923 1.923 0 0 1-1.001-.245 1.618 1.618 0 0 1-.665-.703 2.221 2.221 0 0 1-.227-1.036 1.95 1.95 0 0 1 .48-1.398 1.9 1.9 0 0 1 1.3-.488Zm-9.607.023c.162.004.325.026.48.079.207.065.4.174.563.314.26.302.393.692.366 1.088v2.276H8.53l-.109-.711h-.065c-.064.163-.155.31-.272.439a1.122 1.122 0 0 1-.374.264 1.023 1.023 0 0 1-.453.083 1.334 1.334 0 0 1-.866-.264.965.965 0 0 1-.329-.801.993.993 0 0 1 .076-.431 1.02 1.02 0 0 1 .242-.363 1.478 1.478 0 0 1 1.043-.303h.952v-.181a.696.696 0 0 0-.136-.454.553.553 0 0 0-.438-.154.695.695 0 0 0-.378.086.48.48 0 0 0-.193.254l-.99-.144a1.26 1.26 0 0 1 .257-.563c.14-.174.321-.302.533-.378.261-.091.54-.136.82-.129.053-.003.106-.007.163-.007Zm4.384.007c.174 0 .347.038.506.114.182.083.34.211.458.374.257.423.377.911.351 1.406a2.53 2.53 0 0 1-.355 1.448 1.148 1.148 0 0 1-1.009.517c-.204 0-.401-.045-.582-.136a1.052 1.052 0 0 1-.48-.457 1.298 1.298 0 0 1-.114-.234h-.045l.004 1.784h-1.059v-4.713h.904l.117.805h.057c.068-.208.177-.401.328-.56a1.129 1.129 0 0 1 .843-.344h.076v-.004Zm7.559.084h.903l.113.805h.053a1.37 1.37 0 0 1 .235-.484.813.813 0 0 1 .313-.242.82.82 0 0 1 .39-.076h.234v1.051h-.401a.662.662 0 0 0-.313.008.623.623 0 0 0-.272.155.663.663 0 0 0-.174.26.683.683 0 0 0-.027.314v1.875h-1.054v-3.666Zm-17.515.003h3.262v.896L3.73 13.104l.034.113h1.973l.042.9H2.4v-.9l1.931-1.754-.045-.117H2.441v-.896Zm11.815 0h1.055v3.659h-1.055V10.45Zm3.443.684.019.016a.69.69 0 0 0-.351.045.756.756 0 0 0-.287.204c-.11.155-.174.336-.189.522h1.545c-.034-.526-.257-.787-.74-.787h.003Zm-5.718.163c-.026 0-.057 0-.083.004a.78.78 0 0 0-.31.053.746.746 0 0 0-.257.189 1.016 1.016 0 0 0-.204.695v.064c-.015.257.057.507.204.711a.634.634 0 0 0 .253.196.638.638 0 0 0 .314.061.644.644 0 0 0 .578-.265c.14-.223.204-.48.189-.74a1.216 1.216 0 0 0-.181-.711.677.677 0 0 0-.503-.257Zm-4.509 1.266a.464.464 0 0 0-.268.102.373.373 0 0 0-.114.276c0 .053.008.106.027.155a.375.375 0 0 0 .087.132.576.576 0 0 0 .397.11v.004a.863.863 0 0 0 .563-.182.573.573 0 0 0 .211-.457v-.14h-.903Z"/></svg>
						</div>
						<!-- More -->
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
				<!-- Visual Editor Card -->
				<div class="bg-gray-900 rounded-lg border-[3px] border-gray-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] mb-6 overflow-hidden">
					<!-- Toolbar -->
					<div class="h-8 bg-gray-800 flex items-center px-3 gap-2 border-b border-gray-700 justify-between">
						<div class="flex gap-1.5">
							<div class="w-2 h-2 rounded-full bg-[#ff6b6b]" />
							<div class="w-2 h-2 rounded-full bg-[#ffc480]" />
							<div class="w-2 h-2 rounded-full bg-[#4ade80]" />
						</div>
						<div class="flex gap-2">
							<div class="w-12 h-1.5 bg-gray-700 rounded-full"></div>
							<div class="w-8 h-1.5 bg-gray-700 rounded-full"></div>
						</div>
					</div>
					<div class="flex h-[180px]">
						<!-- Sidebar -->
						<div class="w-10 border-r border-gray-800 flex flex-col items-center py-3 gap-3">
							<div class="w-5 h-5 rounded bg-gray-800 border border-gray-700"></div>
							<div class="w-5 h-5 rounded bg-gray-800 border border-gray-700"></div>
							<div class="w-5 h-5 rounded bg-gray-800 border border-gray-700"></div>
							<div class="w-5 h-5 rounded bg-[#ff6b6b] border border-[#ff6b6b] shadow-[0_0_10px_rgba(255,107,107,0.3)]"></div>
						</div>
						<!-- Canvas -->
						<div class="flex-1 bg-[#1a1b1e] p-4 relative">
							<!-- Mock Template -->
							<div class="absolute inset-4 bg-white rounded-sm opacity-90 border-[2px] border-[#ff6b6b] shadow-[0_0_0_4px_rgba(255,107,107,0.2)]">
								<div class="absolute -top-2 -left-2 w-2 h-2 bg-[#ff6b6b] border border-white"></div>
								<div class="absolute -top-2 -right-2 w-2 h-2 bg-[#ff6b6b] border border-white"></div>
								<div class="absolute -bottom-2 -left-2 w-2 h-2 bg-[#ff6b6b] border border-white"></div>
								<div class="absolute -bottom-2 -right-2 w-2 h-2 bg-[#ff6b6b] border border-white"></div>
								
								<div class="p-4 flex flex-col gap-2">
									<div class="w-full h-24 bg-gray-100 rounded border border-gray-200"></div>
									<div class="w-3/4 h-3 bg-gray-100 rounded"></div>
									<div class="w-1/2 h-3 bg-gray-100 rounded"></div>
								</div>
							</div>
							
							<!-- Cursor -->
							<div class="absolute bottom-10 right-10">
								<svg class="w-6 h-6 text-[#ff6b6b] drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
									<path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.45.45 0 0 0 .32-.76L6.35 2.85a.45.45 0 0 0-.85.36z" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Arrow -->
				<div class="flex justify-center mb-6">
					<svg class="w-12 h-12 text-[#ff6b6b]" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
						<path d="M12 5l0 14m0 0l-5-5m5 5l5-5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<!-- Rendered Result Card Stack (Simplified for Mobile) -->
				<div class="relative h-[220px] w-full flex justify-center">
					<!-- Stack Layers -->
					<div class="absolute top-4 w-[90%] h-[200px] bg-white rounded-lg border-[3px] border-gray-900 opacity-40 scale-90 translate-y-4"></div>
					<div class="absolute top-2 w-[90%] h-[200px] bg-white rounded-lg border-[3px] border-gray-900 opacity-70 scale-95 translate-y-2"></div>
					
					<!-- Main Card -->
					<div class="absolute top-0 w-[90%] h-[200px] bg-white rounded-lg border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
						<div class="h-8 border-b-[2px] border-gray-900 flex items-center justify-between px-3 bg-[#f3f4f6]">
							<span class="font-bold text-xs uppercase tracking-wider text-gray-600">Rendered Output</span>
							<div class="px-2 py-0.5 bg-[#4ade80] border border-gray-900 text-[9px] font-bold rounded">
								LIVE
							</div>
						</div>
						<div class="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ffc480]/20 p-8 flex items-center justify-center h-full">
							<div class="w-full max-w-[200px] bg-white border-[2px] border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rounded-lg p-4">
								<div class="w-10 h-10 bg-gray-200 rounded-full border border-gray-900 mb-3" />
								<div class="w-3/4 h-3 bg-gray-200 rounded mb-2" />
								<div class="w-1/2 h-3 bg-gray-200 rounded" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Desktop Interactive Visual (hidden on mobile, visible on lg) -->
		<div
			class="relative h-[500px] w-full hidden lg:flex items-center justify-center overflow-visible"
			on:mousemove={handleMouseMove}
			on:mouseleave={() => {
				mouseX = 0;
				mouseY = 0;
			}}
			role="presentation"
			aria-hidden="true"
		>
			<!-- Animated wrapper with slight parallax tilt -->
			<div
				class="relative w-full h-full max-w-[600px] transition-transform duration-200 ease-out"
				style="transform: perspective(1000px) rotateX({-mouseY * 5}deg) rotateY({mouseX * 5}deg)"
			>
				<!-- Back Layer: Visual Editor -->
				<div
					class="absolute top-[10%] left-0 w-[60%] h-[320px] bg-gray-900 rounded-xl border-[4px] border-gray-900 shadow-[20px_20px_0_0_rgba(0,0,0,0.1)] z-10 overflow-hidden flex flex-col"
				>
					<!-- Toolbar -->
					<div class="h-9 bg-gray-800 flex items-center px-4 gap-2 border-b border-gray-700 justify-between shrink-0">
						<div class="flex gap-1.5">
							<div class="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
							<div class="w-2.5 h-2.5 rounded-full bg-[#ffc480]" />
							<div class="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
						</div>
						<div class="flex gap-3">
							<div class="w-20 h-2 bg-gray-600 rounded-full"></div>
							<div class="w-12 h-2 bg-gray-600 rounded-full"></div>
						</div>
					</div>
					
					<div class="flex flex-1 overflow-hidden">
						<!-- Sidebar -->
						<div class="w-14 border-r border-gray-800 flex flex-col items-center py-4 gap-4 bg-[#111215]">
							{#each [1, 2, 3, 4] as i}
								<div class="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer {i===2 ? 'bg-[#ff6b6b]/20 border-[#ff6b6b] text-[#ff6b6b]' : ''}"></div>
							{/each}
						</div>
						
						<!-- Canvas Area -->
						<div class="flex-1 bg-[#1a1b1e] p-6 relative">
							<!-- Canvas Grid Background -->
							<div class="absolute inset-0 opacity-20 pointer-events-none" 
								style="background-image: radial-gradient(#4b5563 1px, transparent 1px); background-size: 16px 16px;">
							</div>

							<!-- Template Element Being Edited -->
							<div class="absolute top-8 left-8 right-8 bottom-8 bg-white rounded shadow-lg border-2 border-transparent transition-all duration-300">
								<div class="w-full h-full p-6 flex flex-col gap-4 opacity-50">
									<div class="w-full h-32 bg-gray-200 rounded-lg"></div>
									<div class="w-3/4 h-4 bg-gray-200 rounded"></div>
									<div class="w-1/2 h-4 bg-gray-200 rounded"></div>
								</div>

								<!-- Selection Overlay (The "Visual Edit" part) -->
								<div class="absolute inset-0 border-2 border-[#ff6b6b] shadow-[0_0_0_4px_rgba(255,107,107,0.2)] rounded pointer-events-none z-20">
									<!-- Resize Handles -->
									{#each ['-top-1.5 -left-1.5', '-top-1.5 -right-1.5', '-bottom-1.5 -left-1.5', '-bottom-1.5 -right-1.5'] as pos}
										<div class="absolute {pos} w-3 h-3 bg-white border-2 border-[#ff6b6b] rounded-full shadow-sm"></div>
									{/each}
									
									<!-- Label -->
									<div class="absolute -top-8 left-0 px-2 py-1 bg-[#ff6b6b] text-white text-[10px] font-bold rounded shadow-sm">
										Container
									</div>
								</div>
							</div>


						</div>
					</div>
					<!-- Animated Cursor -->
					<div 
						class="absolute z-50 pointer-events-none animate-cursor-design"
					>
						<svg class="w-6 h-6 text-[#ff6b6b] drop-shadow-xl filter" fill="currentColor" viewBox="0 0 24 24">
							<path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.45.45 0 0 0 .32-.76L6.35 2.85a.45.45 0 0 0-.85.36z" stroke="white" stroke-width="1.5" />
						</svg>
					</div>
				</div>

				<!-- Connecting Arrow -->
				<div
					class="absolute top-[38%] left-[52%] w-24 h-24 z-0 pointer-events-none opacity-40 lg:opacity-100"
				>
					<svg
						class="w-full h-full text-[#ff6b6b]"
						viewBox="0 0 100 100"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"
					>
						<path d="M10 40 Q 50 40 80 60" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M70 55 L 80 60 L 85 45" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<!-- Front Layer: Infinite Render Stack -->
				<div class="absolute bottom-[5%] right-0 w-[50%] h-[300px] z-30 flex items-center justify-center">
					<div class="relative w-full h-full">
						{#each examples as example, i (example.title)}
							{@const isActive = i === activeExample}
							{@const isNext = i === (activeExample + 1) % examples.length}
							{@const isPrev = i === (activeExample - 1 + examples.length) % examples.length}
							
							<div
								class="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
								style="
									transform: 
										{isActive ? 'translateX(0) translateY(0) scale(1) rotate(0deg)' : 
										 isNext ? 'translateX(20px) translateY(20px) scale(0.95) rotate(3deg)' : 
										 'translateX(40px) translateY(40px) scale(0.9) rotate(6deg) opacity(0)'};
									opacity: {isActive ? 1 : isNext ? 0.6 : 0};
									z-index: {isActive ? 30 : isNext ? 20 : 10};
								"
							>
								<div class="w-full h-[240px] bg-white rounded-xl border-[4px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] flex flex-col overflow-hidden">
									<!-- Header -->
									<div class="h-8 border-b-[3px] border-gray-900 flex items-center justify-between px-3 bg-[#f3f4f6]">
										<span class="font-bold text-[10px] uppercase tracking-wider text-gray-700">{example.title}</span>
										<div class="px-1.5 py-0.5 bg-[#4ade80] border border-gray-900 text-[9px] font-bold rounded shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
											RENDERED
										</div>
									</div>

									<!-- Content -->
									<div class="flex-1 {example.color} p-4 flex items-center justify-center relative overflow-hidden">
										<!-- Decoration -->
										<div class="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -mr-8 -mt-8"></div>
										<div class="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rotate-45 -ml-6 -mb-6"></div>

										<!-- Mock Content -->
										<div class="w-full h-full bg-white/40 backdrop-blur-sm border-2 border-black/10 rounded-lg p-3 flex flex-col gap-2">
											<div class="w-8 h-8 bg-gray-900/10 rounded-full"></div>
											<div class="w-3/4 h-3 bg-gray-900/10 rounded"></div>
											<div class="w-1/2 h-3 bg-gray-900/10 rounded"></div>
											<div class="mt-auto w-full h-8 bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center rounded">
												DOWNLOAD
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Floating Badges -->
				<div class="absolute top-[0%] right-[10%] animate-bounce [animation-duration:3s] z-40">
					<div
						class="px-3 py-1.5 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg transform rotate-6 font-bold text-xs flex items-center gap-1.5"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span>Instant</span>
					</div>
				</div>
				<div class="absolute bottom-[20%] left-[10%] animate-bounce [animation-duration:4s] z-40">
					<div
						class="px-3 py-1.5 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg transform -rotate-3 font-bold text-xs flex items-center gap-1.5"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
						</svg>
						<span>No-Code</span>
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
	
	.animate-cursor-design {
		animation: cursorDesign 8s infinite ease-in-out both;
	}

	@keyframes cursorDesign {
		0% { top: 110%; left: 100%; opacity: 0; transform: scale(1); }
		5% { opacity: 1; }
		20% { top: 20%; left: 8%; transform: scale(1); } /* Sidebar Tool */
		25% { transform: scale(0.85); } /* Click Tool */
		30% { transform: scale(1); }
		50% { top: 50%; left: 55%; } /* Move to Center */
		55% { transform: scale(0.85); } /* Place Element */
		65% { transform: scale(1); }
		80% { top: 50%; left: 55%; opacity: 1; }
		90% { opacity: 0; }
		100% { top: 110%; left: 100%; opacity: 0; }
	}
</style>

