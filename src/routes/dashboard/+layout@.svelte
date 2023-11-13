<script>
    import "../../app.css";
    import Nav from "$lib/components/dashboard/Nav.svelte";
    import SideNav from '$lib/components/dashboard/SideNav.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';

 </script>
    <Nav />
    <div class="min-h-screen flex flex-col">
      <div class="flex w-100 flex-grow">
          <div class=" border-r-[3px] border-black">
              <SideNav />
          </div>
            <div class="flex-grow">
               <slot />
          </div>
      </div>
      <Footer />
</div>
