<script>
	// Preview harness for the v2 landing rebuild. Not linked from anywhere.
	import Nav from '$lib/components/landing/Nav.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import ProofSheet from '$lib/components/landing/ProofSheet.svelte';
	import Contract from '$lib/components/landing/Contract.svelte';
	import VideoSection from '$lib/components/landing/VideoSection.svelte';
	import Moments from '$lib/components/landing/Moments.svelte';
	import Integrations from '$lib/components/landing/Integrations.svelte';
	import ClosingCta from '$lib/components/landing/ClosingCta.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
</script>

<svelte:head>
	<title>v2 preview</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="w-full overflow-x-hidden">
	<Nav />
	<main>
		<Hero />
		<ProofSheet />
		<Contract />
		<VideoSection />
		<Moments />
		<Integrations />
		<ClosingCta />
	</main>
	<Footer />
</div>
