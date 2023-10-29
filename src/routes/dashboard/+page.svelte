<script>
    import Nav from '$lib/components/dashboard/Nav.svelte';
	import SideNav from '$lib/components/dashboard/SideNav.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';
</script>

<div class="min-h-screen flex flex-col">
<Nav />
<div class="flex w-100 flex-grow">
    <div class=" border-r-[3px] border-black">
        <SideNav />
    </div>
      <div class="flex-grow">
        <div class="p-4">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p class="text-gray-700">Welcome back, John Doe!</p>
        </div>
    </div>
</div>
<Footer />
</div>
