<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import CodeHighlight from '$lib/components/blog/CodeHighligh.svelte';
	import { page } from '$app/stores';
	import LinkedInLogo from '$lib/assets/social/linkedin.svg';
	import TwitterLogo from '$lib/assets/social/twitter.svg';
	import ShareIcon from '$lib/assets/social/link.svg';
	import SvelteMarkdown from 'svelte-markdown';

	import 'github-markdown-css/github-markdown-light.css';

	export let data;
	const { blog } = data.props;
	const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short'
	});
	let source = blog.content;
	const renderers = {
		code: CodeHighlight
	};
</script>

<svelte:head>
	<title>{blog.title}</title>
	<meta name="description" content={blog.description} />
	<meta name="keywords" content={blog.keywords} />
	<meta name="author" content={blog.author} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta Property="og:title" content={blog.title} />
	<meta Property="og:description" content={blog.description} />
	<meta Property="og:image" content={blog.heroImage} />
	<meta Property="og:url" content={`https://pictify.io/blogs/${$page.params.slug}`} />
	<meta Property="og:type" content="website" />
	<meta Property="og:site_name" content="Pictify.io" />
	<meta Property="og:locale" content="en_US" />
	<script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "BlogPosting",
      "headline": "{blog.title}",
      "image": "{blog.image}",
      "author": {
        "@type": "Person",
        "name": "{blog.author}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Pictify.io",
        "logo": {
          "@type": "ImageObject",
          "url": "https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
        }
      },
      "datePublished": "{blog.date}",
      "dateModified": "{blog.date}",
      "description": "{blog.description}"
    }
	</script>
</svelte:head>

<section>
	<Nav />
	{#if blog && blog.title}
		<div class="w-full flex flex-col-reverse md:flex-row">
			<div
				class="flex-1 border-t-2 md:border-r-2 md:border-b-2 border-black flex flex-col max-h-[500px]"
			>
				<img src={blog?.heroImage} class="object-cover w-full h-full" alt={blog?.title} />
			</div>
			<div class="flex-1 flex flex-col w-full bg-[#FFF4DA] justify-center gap-5 py-10 md:py-0">
				{#if blog?.tags?.length > 0}
					<div class="font-bold text-xl md:text-2xl text-[#FE4A60] px-12">
						<div>
							{blog?.tags[0]}
						</div>
					</div>
				{/if}
				<div class="font-bold text-2xl md:text-4xl px-12">
					<h1>{blog?.title}</h1>
				</div>
				<div class="flex flex-row px-12 gap-4 text-gray-700 font-semibold">
					<div>
						{blog?.author}
					</div>
					<div>|</div>
					<div>
						{formattedDate}
					</div>
					<div>|</div>
					<div>
						{blog?.readingTime} min read
					</div>
				</div>
				<div class="flex flex-row px-12 gap-8 md:mt-10">
					<div>
						<a
							href={`https://twitter.com/intent/tweet?url=https://pictify.io/blogs/${$page.params.slug}`}
							target="_blank"
						>
							<img src={TwitterLogo} alt="twitter" class="w-8 md:w-10" />
						</a>
					</div>
					<div>
						<a
							href={`https://www.linkedin.com/shareArticle?mini=true&url=https://pictify.io/blogs/${$page.params.slug}`}
							target="_blank"
						>
							<img src={LinkedInLogo} alt="linkedin" class="w-8 md:w-10" />
						</a>
					</div>
					<button
						type="button"
						on:click={() => {
							navigator.clipboard.writeText(`https://pictify.io/blogs/${$page.params.slug}`);
							alert('Link copied to clipboard');
						}}
						aria-label="Copy link to clipboard"
					>
						<img src={ShareIcon} alt="facebook" class="w-7 md:w-9" />
					</button>
				</div>
			</div>
		</div>

		<div class="w-full py-8 px-12 md:px-20 md:py-12 markdown-body max-w-[1800px] m-auto">
			<SvelteMarkdown {source} {renderers} />
		</div>
	{/if}
	<Footer />
</section>
