<script>
    import Nav from '$lib/components/dashboard/Nav.svelte';
	import SideNav from '$lib/components/dashboard/SideNav.svelte';
    import Template from '$lib/components/dashboard/Template.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';

    import { page } from "../../lib/store/pages.store";


    const pages = [
    { id: "template", component: Template },
    ];

	const getComponent = function () {
		try {
			return pages.find((p) => p.id === $page).component;
		} catch (e) {
			return null;
		}
	}
</script>

<div class="min-h-screen flex flex-col">
<div class="flex w-100 flex-grow">
    <div class=" border-r-[3px] border-black">
        <SideNav />
    </div>
      <div class="flex-grow">
        <svelte:component this={getComponent()} />
    </div>
</div>
<Footer />
</div>
