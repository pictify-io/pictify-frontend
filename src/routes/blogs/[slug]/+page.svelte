<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import CodeHighlight from '$lib/components/blog/CodeHighligh.svelte';
	import Link from '$lib/components/blog/Link.svelte';
	import BlogList from '$lib/components/blog/BlogList.svelte';
	import { page } from '$app/stores';
	import LinkedInLogo from '$lib/assets/social/linkedin.svg';
	import TwitterLogo from '$lib/assets/social/twitter.svg';
	import ShareIcon from '$lib/assets/social/link.svg';
	import SvelteMarkdown from 'svelte-markdown';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import { getRecommendedBlogs } from '../../../api/blog';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';

	import { onMount } from 'svelte';

	import 'github-markdown-css/github-markdown-light.css';

	export let data;
	let recommendedBlogs = [];
	$: blog = data.props.blog;
	$: formattedDate = new Date(blog.createdAt).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short'
	});
	$: source = blog.content;

	const renderers = {
		code: CodeHighlight,
		link: Link
	};

	onMount(() => {
		getRecommendedBlogs({
			slug: $page.params.slug,
			limit: 3
		}).then((res) => {
			recommendedBlogs = res?.recommendedBlogs || [];
		});
	});
</script>

<svelte:head>
	<title>{blog.title}</title>
	<meta name="keywords" content={blog.tags.join(', ')} />
	<meta name="author" content={blog.author} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta Property="og:title" content={blog.title} />
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

<div
	class="bg-[#FFFDF8] min-h-screen flex flex-col font-sans text-gray-900 selection:bg-[#ffc480] selection:text-black"
>
	<Nav />

	{#if blog && blog.title}
		<div class="w-full flex flex-col-reverse md:flex-row border-b-[3px] border-gray-900">
			<!-- Hero Image -->
			<div
				class="flex-1 bg-white md:border-r-[3px] border-t-[3px] md:border-t-0 border-gray-900 relative overflow-hidden min-h-[400px] md:min-h-[500px]"
			>
				<img
					src={blog?.heroImage}
					class="object-cover w-full h-full absolute inset-0"
					alt={blog?.title}
				/>
				<div class="absolute inset-0 bg-black/10" />
			</div>

			<!-- Title & Info -->
			<div
				class="flex-1 flex flex-col w-full bg-[#FFFDF8] justify-center p-8 md:p-16 relative pattern-grid"
			>
				<div class="relative z-10">
					{#if blog?.tags?.length > 0}
						<div class="mb-6">
							<span
								class="bg-[#ff6b6b] text-white border-[3px] border-gray-900 px-4 py-1.5 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#1f2937] inline-block transform -rotate-1"
							>
								{blog?.tags[0]}
							</span>
						</div>
					{/if}

					<h1
						class="font-black text-3xl md:text-5xl lg:text-6xl leading-tight mb-8 uppercase tracking-tight"
					>
						{blog?.title}
					</h1>

					<div
						class="flex flex-wrap items-center gap-6 text-sm font-bold uppercase tracking-wide border-t-[3px] border-gray-900 pt-6 mb-8"
					>
						<div class="flex items-center gap-2">
							<div
								class="w-8 h-8 bg-gray-900 rounded-full text-white flex items-center justify-center"
							>
								<i class="fa fa-user text-xs" />
							</div>
							<span>{blog?.author}</span>
						</div>
						<div class="w-2 h-2 bg-gray-300 rounded-full" />
						<div class="flex items-center gap-2">
							<i class="fa fa-calendar text-gray-400" />
							<span>{formattedDate}</span>
						</div>
						<div class="w-2 h-2 bg-gray-300 rounded-full" />
						<div class="flex items-center gap-2">
							<i class="fa fa-clock text-gray-400" />
							<span>{blog?.readingTime} min read</span>
						</div>
					</div>

					<!-- Social Share -->
					<div class="flex gap-4">
						<a
							href={`https://twitter.com/intent/tweet?url=https://pictify.io/blogs/${$page.params.slug}`}
							target="_blank"
							class="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937] active:translate-y-0 active:shadow-none transition-all rounded-lg"
						>
							<i class="fa-brands fa-twitter text-xl" />
						</a>
						<a
							href={`https://www.linkedin.com/shareArticle?mini=true&url=https://pictify.io/blogs/${$page.params.slug}`}
							target="_blank"
							class="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937] active:translate-y-0 active:shadow-none transition-all rounded-lg"
						>
							<i class="fa-brands fa-linkedin-in text-xl" />
						</a>
						<button
							type="button"
							on:click={() => {
								navigator.clipboard.writeText(`https://pictify.io/blogs/${$page.params.slug}`);
								alert('Link copied to clipboard');
							}}
							aria-label="Copy link to clipboard"
							class="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937] active:translate-y-0 active:shadow-none transition-all rounded-lg"
						>
							<i class="fa fa-link text-xl" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Blog Content -->
		<div class="w-full bg-white border-b-[3px] border-gray-900">
			<div class="max-w-4xl mx-auto px-6 py-16 md:py-24">
				<article class="blog-content">
					<SvelteMarkdown {source} {renderers} />
				</article>
			</div>
		</div>
	{/if}

	{#if recommendedBlogs.length > 0}
		<div class="max-w-7xl mx-auto px-6 py-20 w-full">
			<BlogList blogs={recommendedBlogs} title="📝  Recommended Blogs" />
		</div>
	{/if}

	<div class="mt-auto border-t-[3px] border-gray-900">
		<TryNow />
	</div>
	<Footer />
</div>

<style>
	.pattern-grid {
		background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
		background-size: 20px 20px;
	}

	/* Blog Content Styling */
	.blog-content {
		font-size: 18px;
		line-height: 1.8;
		color: #374151;
	}

	/* Headings */
	:global(.blog-content h1),
	:global(.blog-content h2),
	:global(.blog-content h3),
	:global(.blog-content h4) {
		font-weight: 900;
		color: #111827;
		margin-top: 3rem;
		margin-bottom: 1.25rem;
		line-height: 1.3;
	}

	:global(.blog-content h1) {
		font-size: 2.5rem;
	}

	:global(.blog-content h2) {
		font-size: 1.875rem;
		padding-bottom: 0.75rem;
		border-bottom: 3px solid #111827;
	}

	:global(.blog-content h3) {
		font-size: 1.5rem;
	}

	:global(.blog-content h4) {
		font-size: 1.25rem;
	}

	/* Paragraphs */
	:global(.blog-content p) {
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	/* Strong text */
	:global(.blog-content strong) {
		font-weight: 900;
		color: #111827;
	}

	/* Lists */
	:global(.blog-content ul),
	:global(.blog-content ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	:global(.blog-content li) {
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	:global(.blog-content ul li) {
		list-style-type: disc;
	}

	:global(.blog-content ol li) {
		list-style-type: decimal;
	}

	:global(.blog-content li::marker) {
		color: #111827;
		font-weight: 900;
	}

	/* Blockquotes */
	:global(.blog-content blockquote) {
		margin: 2rem 0;
		padding: 1.5rem 2rem;
		background: #fffdf8;
		border-left: 6px solid #111827;
		border-radius: 0 12px 12px 0;
		box-shadow: 4px 4px 0 0 #1f2937;
		font-weight: 600;
		color: #374151;
		font-style: normal;
	}

	:global(.blog-content blockquote p) {
		margin-bottom: 0;
	}

	/* Images */
	:global(.blog-content img) {
		margin: 2rem 0;
		border-radius: 12px;
		border: 3px solid #111827;
		box-shadow: 8px 8px 0 0 #1f2937;
		max-width: 100%;
		height: auto;
	}

	/* Inline code */
	:global(.blog-content code:not(pre code)) {
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.9em;
		font-weight: 600;
		color: #111827;
		border: 2px solid #e5e7eb;
	}

	/* Horizontal rules */
	:global(.blog-content hr) {
		margin: 3rem 0;
		border: none;
		border-top: 3px solid #111827;
	}

	/* Tables */
	:global(.blog-content table) {
		width: 100%;
		margin: 2rem 0;
		border-collapse: collapse;
		border: 3px solid #111827;
		box-shadow: 6px 6px 0 0 #1f2937;
	}

	:global(.blog-content th),
	:global(.blog-content td) {
		padding: 1rem;
		border: 2px solid #111827;
		text-align: left;
	}

	:global(.blog-content th) {
		background: #111827;
		color: white;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	:global(.blog-content tr:nth-child(even)) {
		background: #f9fafb;
	}
</style>
