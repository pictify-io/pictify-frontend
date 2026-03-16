<script>
	const categories = [
		{
			title: 'Automation',
			description: 'Connect to your existing workflows',
			color: 'bg-[#ff6b6b]',
			iconBg: 'bg-white',
			iconColor: 'text-black',
			items: ['Zapier', 'Make', 'n8n', 'Pipedream'],
			cols: 'xl:col-span-7'
		},
		{
			title: 'Storage & Delivery',
			description: 'Deliver to your own CDN',
			color: 'bg-[#4ade80]',
			iconBg: 'bg-white',
			iconColor: 'text-black',
			items: ['AWS S3', 'Google Cloud', 'Cloudinary', 'ImageKit'],
			cols: 'xl:col-span-5'
		},
		{
			title: 'Webhooks',
			description: 'Real-time event notifications',
			color: 'bg-[#ffc480]',
			iconBg: 'bg-white',
			iconColor: 'text-black',
			items: ['render.completed', 'render.failed', 'experiment.winner'],
			cols: 'xl:col-span-4'
		},
		{
			title: 'SDKs & API',
			description: 'First-class developer support',
			color: 'bg-blue-400',
			iconBg: 'bg-white',
			iconColor: 'text-black',
			items: ['Node.js', 'Python', 'REST API', 'cURL'],
			cols: 'xl:col-span-4'
		},
		{
			title: 'AI Features',
			description: 'Intelligence built in',
			color: 'bg-purple-400',
			iconBg: 'bg-white',
			iconColor: 'text-black',
			items: ['AI Copilot', 'Smart Resize'],
			cols: 'xl:col-span-4'
		},
		{
			title: 'Team & Enterprise',
			description:
				'Scale with your organization. Advanced access control, custom domains, and audit logs.',
			color: 'bg-white',
			iconBg: 'bg-[#ffc480]',
			iconColor: 'text-black',
			items: ['Multi-Workspace', 'Role-Based Access', 'SSO/SAML', 'Audit Logs'],
			cols: 'xl:col-span-12'
		}
	];
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-y-[3px] border-gray-900"
>
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/4 -right-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>
	<div
		class="absolute bottom-1/4 -left-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Main Header -->
		<div class="text-center mb-24 relative max-w-4xl mx-auto">
			<div
				class="inline-block mb-6 px-6 py-2 bg-[#4ade80] border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] rounded-full transform -rotate-2 hover:rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Infrastructure</span>
			</div>

			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				Plugs Into Your Stack.<br />
				<span class="relative inline-block text-[#ff6b6b] transform rotate-1 mt-2">
					No Glue Code
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>.
			</h2>

			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Deterministic rendering. Webhooks for async jobs. Storage connectors for your CDN. SDKs for
				your language.
			</p>
		</div>

		<!-- Bento Grid Showcase -->
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 xl:gap-8">
			{#each categories as cat}
				<div
					class="{cat.cols} {cat.color} rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group flex flex-col"
				>
					<!-- Optional Gradient Overlay for non-white cards -->
					{#if cat.color !== 'bg-white'}
						<div class="absolute inset-0 bg-white/10 pointer-events-none" />
					{:else}
						<div
							class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/50 pointer-events-none"
						/>
					{/if}

					<div class="p-8 md:p-10 flex-1 flex flex-col relative z-10">
						<div class="flex items-center gap-4 mb-6">
							<div
								class="w-14 h-14 {cat.iconBg} border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform"
							>
								{#if cat.title === 'Automation'}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/></svg
									>
								{:else if cat.title === 'Storage & Delivery'}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
										/></svg
									>
								{:else if cat.title === 'Webhooks'}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
										/></svg
									>
								{:else if cat.title === 'SDKs & API'}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
										/></svg
									>
								{:else if cat.title === 'AI Features'}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
										/></svg
									>
								{:else}
									<svg
										class="w-7 h-7 {cat.iconColor}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/></svg
									>
								{/if}
							</div>
							<h3 class="text-3xl md:text-4xl font-black text-gray-900">{cat.title}</h3>
						</div>

						<p
							class="text-lg text-gray-700 font-medium mb-8 {cat.title === 'Team & Enterprise'
								? 'max-w-xl'
								: ''}"
						>
							{cat.description}
						</p>

						<!-- Internal Pills -->
						<div class="mt-auto flex flex-wrap gap-3">
							{#each cat.items as item}
								<span
									class="px-4 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-sm font-black text-black shadow-[2px_2px_0_0_#1f2937] group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0_0_#1f2937] transition-all"
								>
									{#if cat.title === 'Webhooks'}
										<code class="font-mono text-xs uppercase tracking-wider">{item}</code>
									{:else}
										{item}
									{/if}
								</span>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Bottom CTA -->
		<div class="text-center mt-20">
			<a
				href="/integrations"
				class="inline-flex items-center gap-3 px-8 py-4 bg-[#ffc480] text-black font-black uppercase tracking-wider rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all group"
			>
				<span class="text-lg">View All Integrations</span>
				<div
					class="w-8 h-8 bg-white border-[2px] border-gray-900 rounded-full flex items-center justify-center transform group-hover:translate-x-1 transition-transform"
				>
					<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/></svg
					>
				</div>
			</a>
		</div>
	</div>
</section>
