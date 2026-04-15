<script>
	/**
	 * Outer page shell shared across /tools/* pages.
	 *
	 * Emits: <section> + 3 decorative background blobs + <Nav /> + <main> + <Footer />.
	 * Consumer renders everything between the nav and footer via the default slot.
	 *
	 * DOM contract: the emitted markup must stay byte-identical to the inline
	 * wrapper that certificate-generator, tweet-screenshot, and online-invoice-generator
	 * use today. Any change to classes/structure here is a visual regression risk.
	 *
	 * See plan: docs/plans/2026-04-15-002-refactor-tool-scaffold-plan.md
	 */
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
</script>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-x-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-24 md:pb-32 relative z-10"
	>
		<slot />
	</main>

	<Footer />
</section>
