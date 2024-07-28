<script>
  	import Nav from '$lib/components/landingPage/Nav.svelte';
    import Footer from '$lib/components/landingPage/Footer.svelte';

    const plans = [
    {
      "name": "Starter",
      "price": "Free",
      "requests_per_month": 50,
      "features": ["Basic API Access", "Limited Support"]
    },
    {
      "name": "Basic",
      "price": "$14/month",
      "requests_per_month": 1500,
      "features": ["Full API Access", "Email Support"]
    },
    {
      "name": "Standard",
      "price": "$29/month",
      "requests_per_month": 3500,
      "features": ["Full API Access", "Email Support"]
    },
    {
      "name": "Professional",
      "price": "$49/month",
      "requests_per_month": 7500,
      "features": ["Full API Access", "Email Support", "Priority Processing"]
    },
    {
      "name": "Advanced",
      "price": "$69/month",
      "requests_per_month": 12000,
      "features": ["Full API Access", "Email Support", "Priority Processing"]
    },
    {
      "name": "Pro Plus",
      "price": "$99/month",
      "requests_per_month": 20000,
      "features": ["Full API Access", "Email Support", "Priority Processing", "Custom Branding"]
    },
    {
      "name": "Business",
      "price": "$149/month",
      "requests_per_month": 40000,
      "features": ["Full API Access", "Priority Email Support", "Custom Branding"]
    },
    {
      "name": "Business Plus",
      "price": "$199/month",
      "requests_per_month": 60000,
      "features": ["Full API Access", "Priority Email Support", "Custom Branding"]
    },
    {
      "name": "Premium",
      "price": "$249/month",
      "requests_per_month": 80000,
      "features": ["Full API Access", "Priority Email Support", "Custom Branding"]
    },
    {
      "name": "Premium Plus",
      "price": "$349/month",
      "requests_per_month": 120000,
      "features": ["Full API Access", "Priority Email Support", "Custom Branding"]
    },
    {
      "name": "Enterprise",
      "price": "$449/month",
      "requests_per_month": 150000,
      "features": ["Full API Access", "Priority Support", "Custom Branding", "Dedicated Account Manager"]
    },
    {
      "name": "Enterprise Plus",
      "price": "$649/month",
      "requests_per_month": 250000,
      "features": ["Full API Access", "Priority Support", "Custom Branding", "Dedicated Account Manager"]
    },
    {
      "name": "Elite",
      "price": "$899/month",
      "requests_per_month": 400000,
      "features": ["Full API Access", "Priority Support", "Custom Branding", "Dedicated Account Manager"]
    },
    {
      "name": "Elite Plus",
      "price": "$1,299/month",
      "requests_per_month": 600000,
      "features": ["Full API Access", "Priority Support", "Custom Branding", "Dedicated Account Manager"]
    },
    {
      "name": "Ultimate",
      "price": "$1,799/month",
      "requests_per_month": 1000000,
      "features": ["Full API Access", "Priority Support", "Custom Branding", "Dedicated Account Manager"]
    }
  ]

  let selectedPlanIndex = 0;
</script>

<section>
  <Nav />
  <main>
    <div class="w-full max-w-4xl m-auto">
      <h1 class="text-3xl md:px-0 px-6 font-bold text-left mt-8 ">Simple, Transparent Pricing</h1>
      <h1 class="opacity-70 md:px-0 px-6 text-left text-lg mt-2">Choose the plan that's right for your needs and start converting HTML to images and GIFs today.</h1>

      <div>
       <table class="w-full mt-10 border-collapse">
          <thead>
            <tr>
              <th class="text-left p-4 border-b">Plan</th>
              <th class="text-center p-4 border-b">Price</th>
              <th class="text-center p-4 border-b">Images/Gif per month</th>
              <th class="text-center p-4 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {#each plans as plan, index}
            <tr class="even:bg-gray-100 hover:bg-gray-200 cursor-pointer" on:click={() => {
              selectedPlanIndex = index;
            }}>
              <td class="text-left p-4 border-b">
                {plan.name}
              </td>
              <td class="text-center">
                {plan.price}
              </td>
              <td class="text-center">
                {plan.requests_per_month.toLocaleString()}
              </td>
              <td class="text-center">
                {#if selectedPlanIndex === index}
                ✅
                 {/if} 
              </td>
            </tr>
            {/each}
          </tbody>
            <table>
      </div>
    </div>
  </main>
  <Footer />
</section>