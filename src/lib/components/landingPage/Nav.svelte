<script>
	let showMobileMenu = false;
	import { user } from '../../../store/user.store';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_DOCS_URL } from '$env/static/public';

	let isLoggedIn = false;

	let unsubscribe = () => {};

	onMount(async () => {
		unsubscribe = user.subscribe((u) => {
			isLoggedIn = !!u.email;
		});
	});

	onDestroy(() => {
		isLoggedIn = false;
		unsubscribe();
	});
</script>

<header
	class="w-full h-20 z-30 border-b-[3px] border-black flex justify-between relative items-stretch md:divide-x-[3px] divide-black"
>
	<a
		href="#_"
		class="flex flex-shrink-0 text-black items-center justify-center h-full p-5 no-underline cursor-pointer"
	>
		<span class="text-2xl font-bold font-heading text-shadow">Pictify </span>
		&nbsp;
		<span class="text-xs font-heading text-gray-700">beta</span>
	</a>
	<button
		class={[
			'p-5 h-full w-20 border-l-[3px] flex md:hidden border-black items-center justify-center'
		]}
		class:hidden={showMobileMenu}
		on:click={() => {
			showMobileMenu = true;
		}}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-8 h-8"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
			/>
		</svg>
	</button>
	<div
		class={[
			'w-full flex-col flex md:flex md:flex-row  md:relative absolute h-screen md:pt-0 pt-20 md:h-full items-stretch justify-between',
			'flex',
			showMobileMenu ? ' ' : 'hidden'
		]}
		class:hidden={!showMobileMenu}
	>
		<button
			class="p-5 h-20 w-20 border-l-[3px] border-b-[3px] flex md:hidden absolute top-0 right-0 border-black items-center justify-center"
			on:click={() => {
				showMobileMenu = false;
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-8 h-8"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<nav
			class="w-full md:space-x-8 font-medium md:bg-transparent bg-[#FFFDF8] md:px-8 flex md:flex-row flex-col z-20 items-center"
		>
			<!-- <a
				href="#_"
				class="hover:underline md:border-b-0 text-center py-6 border-b-[3px] border-black md:w-auto w-full cursor-pointer"
				>Home</a
			>
			<a
				href="#_"
				class="hover:underline md:border-b-0 text-center py-6 border-b-[3px] border-black md:w-auto w-full cursor-pointer"
				>Blog</a
			> -->
			<a
				href="{PUBLIC_DOCS_URL}"
				target="_blank"
				class="hover:underline md:border-b-0 text-center py-6 border-b-[3px] border-black md:w-auto w-full cursor-pointer"
				>API Doc</a
			>
			<a
				href="mailto:support@pectify.io"
				class="hover:underline md:border-b-0 text-center py-6 border-b-[3px] border-black md:w-auto w-full cursor-pointer"
				>Contact</a
			>
		</nav>
		<div class="flex-grow bg-[#FFFDF8]">
			
		</div>
		<div
			class="flex flex-shrink-0 md:flex-row flex-col md:bg-transparent bg-[#FFFDF8] font-medium border-l-0 md:border-l-[3px] border-black items-center"
		>
			{#if !isLoggedIn}
				<a
					href="/login"
					class="px-8 md:border-t-0 border-t-[3px] border-black md:w-auto w-full justify-center flex space-x-2 md:py-0 py-6 cursor-pointer"
				>
					<!-- <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 -ml-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"></path>
                </svg> -->
					<span>Sign In</span>
				</a>
			{/if}
			{#if isLoggedIn}
				<a
					href="/dashboard"
					class="px-8 bg-black h-full md:py-0 py-6 md:w-auto w-full text-white flex items-center justify-center cursor-pointer"
					>Dashboard</a
				>
			{:else}
				<a
					href="/login"
					class="px-8 bg-black h-full md:py-0 py-6 md:w-auto w-full text-white flex items-center justify-center cursor-pointer"
					>Start For Free</a
				>
			{/if}
		</div>
	</div>
</header>
