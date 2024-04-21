<script>
    import Nav from '$lib/components/landingPage/Nav.svelte';
    import Hero from '$lib/components/landingPage/Hero.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';
    import TryNow from '$lib/components/landingPage/TryNow.svelte';
    import Editor from '$lib/components/grapeJS/editor.svelte';
    import UseCase from '$lib/components/landingPage/UseCase.svelte';
    import Api from '$lib/components/landingPage/Api.svelte';
    import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';
    import WhyPictify from '$lib/components/landingPage/WhyPictify.svelte';
    import Featured from '$lib/components/landingPage/Featured.svelte';
</script>

<svelte:head>
    <title>Pictify.io: Free HTML to Image and Gif API</title>
    <meta name="description" content="Pictify.io is a free HTML to Image and Gif API">
    <meta name="keywords" content="HTML to image, HTML to gif, HTML to image API, HTML to gif API, HTML CSS to Image API, HTML CSS to Gif API, Gif, API, Pictify.io, Pictify, Pictify API, Pictify.io API, Pictify.io Gif API, Pictify.io HTML to CSS API, Pictify.io HTML to CSS and Gif API, Pictify.io HTML to CSS and Gif conversion API, Pictify.io HTML to CSS and Gif conversion">
    <meta name="author" content="Pictify.io">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta Property="og:title" content="Pictify.io">
    <meta Property="og:description" content="Pictify.io is a free HTML to Image and Gif conversion API">
    <meta Property="og:image" content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png">
    <meta Property="og:url" content="https://pictify.io">
    <meta Property="og:type" content="website">
    <meta Property="og:site_name" content="Pictify.io">
    <meta Property="og:locale" content="en_US">
    <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "Pictify",
          "url": "https://pictify.io",
          "image": "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png",
          "description": "Pictify.io is a free HTML to Image and Gif API",
          "brand": {
            "@type": "Brand",
            "name": "Pictify"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "7"
          }
        }
        </script>
</svelte:head>


<section class="w-screen bg-[#FFFDF8] min-h-screen md:h-screen flex flex-col justify-between md:items-start items-between tails-selected-element lg:overflow-x-hidden md:overflow-x-hidden " data-tails-scripts="//unpkg.com/alpinejs" contenteditable="false">
    <Nav />
    <Hero />
    <SignUpButton />
    <Editor isLandingPage={true}/>
    <Api />
    <SignUpButton />
    <WhyPictify />
    <UseCase />
    <Featured />
    <TryNow />
    <Footer />

</section>
