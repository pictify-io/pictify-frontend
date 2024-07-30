<script>
  	import Nav from '$lib/components/landingPage/Nav.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';
    import {getProducts} from '../../api/product';
    import {onMount, onDestroy} from 'svelte';
    import { user } from '../../store/user.store';
    import {goto} from '$app/navigation';

  let plans = [];

  const FAQs = [
    {
      question: "What happens if I exceed the monthly limit?",
      answer: "If you exceed your request limit, you can either upgrade to a higher plan or purchase additional requests at a discounted rate.",
      isOpened: false
    },
    {
      question: "Can I change my plan later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time from your account settings.",
      isOpened: false
    },
    {
      question: "Can I pay annually?",
      answer: "Yes, please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for annual payment options.",
      isOpened: false
    },
    {
      question: "Do you offer custom plans?",
      answer: "Yes, we offer custom plans for high-volume users. Please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for more information.",
      isOpened: false
    },
    {
      question: "How to debug issues with the API?",
      answer: "If you are facing issues with the API, please check the API documentation or contact us at <a href='mailto:mailto:support@pictify.io'>support@pictify.io</a> for assistance. We will respond to your queries within 48 hours.",
      isOpened: false
    }
  ]

  let isLoggedIn = false;
	let unsubscribe = () => {};

  onMount(async () => {
    plans = await getProducts();
    plans = plans.data;

     unsubscribe = user.subscribe((u) => {
      isLoggedIn = !!u.email;
    });
  });

  onDestroy(() => {
		isLoggedIn = false;
		unsubscribe();
	});
 

  let selectedPlanIndex = 0;

  const selectPlanHandler = () => {
    const selectedPlan = plans[selectedPlanIndex];
    if(!selectedPlan) return;
    if(!isLoggedIn) {
      goto(`/signup?redirect=${selectedPlan.purchase_url}`);
      return;
    } else {
      window.location.href = selectedPlan.purchase_url ? selectedPlan.purchase_url : '/dashboard/api-token';
    }
  }
</script>

<section>
  <Nav />
  <main>
    <div class="w-full max-w-4xl m-auto">
      <h1 class="text-3xl md:px-0 px-6 font-bold text-left mt-8 ">Simple, Transparent Pricing</h1>
      <h1 class="opacity-70 md:px-0 px-6 text-left text-lg mt-2">Choose the plan that's right for your needs and start converting HTML to images and GIFs today.</h1>

      <div class="overflow-x-auto">
       <table class="w-full mt-10 border-collapse text-lg  ">
          <thead>
            <tr>
              <th class="text-left p-4 border-b">Plan</th>
              <th class="text-center p-4 border-b">Price</th>
              <th class="text-center p-4 border-b">Images/Gif per month</th>
              <th class="text-center p-4 border-b">
                Selected
              </th>
            </tr>
          </thead>
          <tbody>
            {#each plans as plan, index}
            <tr 
            class="hover:bg-gray-200   border-b cursor-pointer"
            on:click={() => selectedPlanIndex = index}
            >
              <td class="text-left p-4">
                {plan.name}
              </td>
              <td class="text-center">
                {plan.price_formatted}
              </td>
              <td class="text-center">
                {@html plan.request_per_month}
              </td>
              <td class="text-center text-lg">
               {#if selectedPlanIndex === index}
                ✅
                {/if}
              </td>
              <!-- <td class="text-center text-md">
                <button
                  class="py-1.5 rounded px-2 z-20 relative  border-[2px] border-gray-900 font-medium bg-[#ffc480] tracking-wide flex-shrink-0 text-gray-900"
                > Choose Plan
                </button>
              </td> -->
            </tr>
            {/each}
          </tbody>
          <table>
      </div>

      <div class="m-auto w-[20rem] mt-12">
        <button
        class="py-3.5 rounded px-6 hover:-translate-y-px hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#ffc480] tracking-wide text-lg flex-shrink-0 text-gray-900"
        on:click={selectPlanHandler}
        > Get Your API Key
        </button>
      </div>

      <div class="mt-20 w-full">
        <div class="text-3xl md:px-0 px-6 font-bold text-left">
          <h2>FAQ</h2>
        </div>
        <div class="mt-10 md:px-0 px-6 flex flex-col max-w-6xl mx-auto gap-6">
          {#each FAQs as faq}
          <div class="flex-1 rounded-xl p-4 border-[3px] border-gray-900 bg-[#EBEBEB]">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
            class="flex w-full"
            on:click={() => faq.isOpened = !faq.isOpened}
            >
              <div class="flex-grow">
                <h3 class="text-lg font-bold">{faq.question}</h3>
              </div>
              {#if faq.isOpened}
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </div>
              {:else}
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              {/if}
            </div>
            {#if faq.isOpened}
            <p class="mt-2">
              {@html faq.answer}
            </p>
            {/if}
          </div>
          {/each}
        </div>
    </div>
  </main>

  <Footer />
</section>