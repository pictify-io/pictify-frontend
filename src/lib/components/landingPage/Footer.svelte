<script>
	import { PUBLIC_DOCS_URL } from '$env/static/public';
</script>

<footer class="w-full bg-[#FFFDF8] border-t-[3px] border-gray-900">
	<div class="max-w-6xl mx-auto px-6 py-16">
		
		<!-- Main Grid -->
		<div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
			
			<!-- Brand Column (Span 4) -->
			<div class="md:col-span-4 flex flex-col gap-6">
				<a href="/" class="inline-block group">
					<div class="flex items-center gap-3">
						<!-- Logo Icon -->
						<div class="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center shadow-[3px_3px_0_0_#ffc480] group-hover:shadow-none group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all">
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<!-- Text -->
						<span class="text-3xl font-black text-gray-900 tracking-tight group-hover:translate-x-1 transition-transform">PICTIFY</span>
					</div>
				</a>
				<p class="text-lg text-gray-700 font-medium leading-relaxed">
					The fast, scalable Puppeteer alternative. Generate images via API in under 500ms.
				</p>
				
				<!-- Status Indicator -->
				<a href="https://status.pictify.io" target="_blank" class="inline-flex items-center gap-3 px-4 py-2 bg-white border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-y-0.5 hover:translate-x-0.5 transition-all w-fit group">
					<span class="relative flex h-3 w-3">
					  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
					  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
					</span>
					<span class="text-sm font-bold text-gray-900 group-hover:text-gray-700">All Systems Operational</span>
				</a>
			</div>

			<!-- Links Columns (Span 8) -->
			<div class="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">

				<!-- Product -->
				<div class="flex flex-col gap-4">
					<div class="text-sm font-black text-gray-900 uppercase tracking-wider border-b-[3px] border-gray-900 pb-2 w-fit">Product</div>
					<ul class="flex flex-col gap-3">
						<li><a href="/pricing" class="text-gray-600 font-bold hover:text-[#ff6b6b] transition-colors">Pricing</a></li>
						<li><a href={PUBLIC_DOCS_URL} target="_blank" class="text-gray-600 font-bold hover:text-[#ff6b6b] transition-colors">API Docs</a></li>
						<li><a href="/tools" class="text-gray-600 font-bold hover:text-[#ff6b6b] transition-colors">Tools</a></li>
						<li><a href="/templates" class="text-gray-600 font-bold hover:text-[#ff6b6b] transition-colors">Templates</a></li>
						<li><a href="https://status.pictify.io" target="_blank" class="text-gray-600 font-bold hover:text-[#ff6b6b] transition-colors">Status</a></li>
					</ul>
				</div>

				<!-- Resources -->
				<div class="flex flex-col gap-4">
					<div class="text-sm font-black text-gray-900 uppercase tracking-wider border-b-[3px] border-gray-900 pb-2 w-fit">Resources</div>
					<ul class="flex flex-col gap-3">
						<li><a href="/integrations" class="text-gray-600 font-bold hover:text-[#4ade80] transition-colors">Integrations</a></li>
						<li><a href="/alternatives" class="text-gray-600 font-bold hover:text-[#4ade80] transition-colors">Alternatives</a></li>
						<li><a href="/compare" class="text-gray-600 font-bold hover:text-[#4ade80] transition-colors">Comparisons</a></li>
						<li><a href="/glossary" class="text-gray-600 font-bold hover:text-[#4ade80] transition-colors">Glossary</a></li>
					</ul>
				</div>

				<!-- Company -->
				<div class="flex flex-col gap-4">
					<div class="text-sm font-black text-gray-900 uppercase tracking-wider border-b-[3px] border-gray-900 pb-2 w-fit">Company</div>
					<ul class="flex flex-col gap-3">
						<li><a href="/blogs" class="text-gray-600 font-bold hover:text-[#ffc480] transition-colors">Blog</a></li>
						<li><a href="mailto:support@pictify.io" class="text-gray-600 font-bold hover:text-[#ffc480] transition-colors">Contact</a></li>
						<li><a href="/terms" class="text-gray-600 font-bold hover:text-[#ffc480] transition-colors">Terms</a></li>
						<li><a href="/privacy" class="text-gray-600 font-bold hover:text-[#ffc480] transition-colors">Privacy</a></li>
					</ul>
				</div>

				<!-- Socials -->
				<div class="flex flex-col gap-4">
					<div class="text-sm font-black text-gray-900 uppercase tracking-wider border-b-[3px] border-gray-900 pb-2 w-fit">Connect</div>
					<div class="flex flex-col gap-3">
						<a href="https://twitter.com/pictify_io" target="_blank" class="flex items-center gap-2 group">
							<div class="w-8 h-8 bg-white border-[2px] border-gray-900 flex items-center justify-center rounded-md shadow-[2px_2px_0_0_#000] group-hover:-translate-y-0.5 transition-transform">
								<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
							</div>
							<span class="text-gray-600 font-bold group-hover:text-gray-900">Twitter</span>
						</a>
						<a href="https://github.com/AirTribe" target="_blank" class="flex items-center gap-2 group">
							<div class="w-8 h-8 bg-white border-[2px] border-gray-900 flex items-center justify-center rounded-md shadow-[2px_2px_0_0_#000] group-hover:-translate-y-0.5 transition-transform">
								<svg class="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
							</div>
							<span class="text-gray-600 font-bold group-hover:text-gray-900">GitHub</span>
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Bar -->
		<div class="pt-8 border-t-[3px] border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-6">
			<div class="text-sm font-bold text-gray-500">
				© 2026 Pictify.io. All rights reserved.
			</div>
			
			<!-- Peerlist Badge -->
			<a href="https://peerlist.io/suyashthakur/project/pictifyio" target="_blank" class="group relative inline-block">
				<div class="absolute inset-0 bg-[#ffc480] rounded-lg transform translate-x-1 translate-y-1 border-[2px] border-gray-900"></div>
				<div class="relative bg-white border-[2px] border-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform">
					<span class="text-xl">🏆</span>
					<div class="flex flex-col leading-none">
						<span class="text-[10px] font-bold text-gray-400 uppercase">Featured on</span>
						<span class="text-xs font-black text-gray-900">Peerlist</span>
					</div>
				</div>
			</a>
		</div>

	</div>
</footer>