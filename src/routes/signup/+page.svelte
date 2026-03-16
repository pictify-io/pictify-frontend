<script>
	import Login from '$lib/components/auth/login.svelte';
</script>

<svelte:head>
	<title>Sign Up | Pictify.io - Image Generation Platform</title>
	<meta name="description" content="Create your free Pictify.io account. Generate images from HTML, templates, and URLs with a powerful visual editor and API." />
	<meta property="og:title" content="Sign Up | Pictify.io" />
	<meta property="og:description" content="Create your free Pictify.io account and start generating images at scale." />
	<meta property="og:type" content="website" />
</svelte:head>
<Login isLogin={false} />
