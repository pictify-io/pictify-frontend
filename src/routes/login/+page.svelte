<script>
	import Login from '$lib/components/auth/login.svelte';
</script>

<svelte:head>
	<title>Log In | Pictify.io - Image Generation Platform</title>
	<meta name="description" content="Log in to Pictify.io to create, manage, and automate image generation with templates, APIs, and more." />
	<meta property="og:title" content="Log In | Pictify.io" />
	<meta property="og:description" content="Log in to Pictify.io to create, manage, and automate image generation." />
	<meta property="og:type" content="website" />
</svelte:head>
<Login isLogin={true} />
