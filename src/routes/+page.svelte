<script>
    import Nav from '$lib/components/landingPage/Nav.svelte';
    import Hero from '$lib/components/landingPage/Hero.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';
    import TryNow from '$lib/components/landingPage/TryNow.svelte';
    import Editor from '$lib/components/grapeJS/editor.svelte';
    import UseCase from '$lib/components/landingPage/UseCase.svelte';
    import Api from '$lib/components/landingPage/Api.svelte';

</script>


<section class="w-screen bg-[#FFFDF8] min-h-screen md:h-screen block flex flex-col justify-between md:items-start items-between tails-selected-element lg:overflow-x-hidden md:overflow-x-hidden " data-tails-scripts="//unpkg.com/alpinejs" contenteditable="false">
    <Nav />
    <Hero />
    <Editor />
    <Api />
    <UseCase />
    <TryNow />
    <Footer />

</section>
