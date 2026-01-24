<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import { user } from '../../store/user.store';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  $: isLoggedIn = !!$user?.email;

  onMount(() => {
    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
      goto('/dashboard');
    }
  });

  const freeFeatures = [
    {
      icon: 'image',
      title: 'Watermark-Free Images',
      description: 'Generate clean images without any Pictify branding',
      highlight: true
    },
    {
      icon: 'key',
      title: 'Free API Key',
      description: '100 image generations per month via REST API',
      highlight: true
    },
    {
      icon: 'save',
      title: 'Save Templates',
      description: 'Store unlimited templates in your workspace',
      highlight: false
    },
    {
      icon: 'history',
      title: 'Generation History',
      description: 'Access your past generations anytime',
      highlight: false
    },
    {
      icon: 'cloud',
      title: 'CDN Hosting',
      description: 'All images served from global CDN',
      highlight: false
    },
    {
      icon: 'support',
      title: 'Email Support',
      description: 'Get help when you need it',
      highlight: false
    }
  ];

  const comparisonTable = [
    { feature: 'Image generations', guest: '5/day', free: '100/month', paid: 'Unlimited' },
    { feature: 'Watermark-free', guest: 'No', free: 'Yes', paid: 'Yes' },
    { feature: 'API access', guest: 'No', free: 'Yes', paid: 'Yes' },
    { feature: 'Save templates', guest: 'No', free: 'Unlimited', paid: 'Unlimited' },
    { feature: 'Generation history', guest: 'No', free: '30 days', paid: 'Forever' },
    { feature: 'Batch rendering', guest: 'No', free: 'Up to 10', paid: 'Unlimited' },
    { feature: 'Priority support', guest: 'No', free: 'Email', paid: '24/7 Priority' },
    { feature: 'Custom domains', guest: 'No', free: 'No', paid: 'Yes' }
  ];
</script>

<svelte:head>
  <title>Free Account Benefits | Pictify.io</title>
  <meta name="description" content="Create a free Pictify account to unlock watermark-free images, API access, and unlimited template storage. No credit card required.">
  <link rel="canonical" href="https://pictify.io/free-account">
  <meta property="og:title" content="Free Account Benefits | Pictify.io">
  <meta property="og:description" content="Create a free Pictify account to unlock watermark-free images, API access, and unlimited template storage.">
  <meta property="og:url" content="https://pictify.io/free-account">
</svelte:head>

<div class="bg-[#FFFDF8] min-h-screen flex flex-col font-sans text-gray-900">
  <Nav />

  <main class="flex-grow">
    <!-- Hero Section -->
    <section class="w-full py-16 md:py-24 px-6">
      <div class="max-w-5xl mx-auto text-center">
        <div class="inline-block bg-[#4ade80] border-[3px] border-black shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1">
          <span class="font-black uppercase tracking-widest text-sm">100% Free</span>
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
          Unlock the Full<br/>
          <span class="text-[#ff6b6b]">Pictify Experience</span>
        </h1>

        <p class="text-xl md:text-2xl font-bold text-gray-700 max-w-2xl mx-auto mb-8">
          Create a free account in 30 seconds. No credit card required.
          Get watermark-free images and API access instantly.
        </p>

        <a
          href="/signup"
          class="inline-block px-8 py-4 bg-[#ff6b6b] text-white border-[4px] border-black font-black text-xl uppercase tracking-wide shadow-[6px_6px_0_0_#000] hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          Create Free Account
        </a>

        <p class="mt-4 text-sm font-bold text-gray-500">
          Already have an account? <a href="/login" class="text-[#ff6b6b] underline">Log in</a>
        </p>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="w-full py-16 px-6 bg-white border-y-[3px] border-black">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-center mb-12">
          What You Get for Free
        </h2>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each freeFeatures as feature}
            <div
              class={`
                border-[3px] border-black p-6 rounded-xl
                ${feature.highlight ? 'bg-[#ffc480] shadow-[6px_6px_0_0_#000]' : 'bg-[#FFFDF8] shadow-[4px_4px_0_0_#ccc]'}
              `}
            >
              <div class={`w-12 h-12 border-[3px] border-black rounded-lg flex items-center justify-center mb-4 ${feature.highlight ? 'bg-white' : 'bg-[#ffc480]'}`}>
                {#if feature.icon === 'image'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                {:else if feature.icon === 'key'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                {:else if feature.icon === 'save'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                {:else if feature.icon === 'history'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                {:else if feature.icon === 'cloud'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                {:else if feature.icon === 'support'}
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                {/if}
              </div>

              <h3 class="text-xl font-black uppercase tracking-tight mb-2">{feature.title}</h3>
              <p class="font-bold text-gray-700">{feature.description}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Comparison Table -->
    <section class="w-full py-16 px-6">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-center mb-4">
          Guest vs Free vs Paid
        </h2>
        <p class="text-lg font-bold text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          See exactly what you get with a free account compared to guest access and paid plans.
        </p>

        <div class="border-[3px] border-black bg-white shadow-[8px_8px_0_0_#000] overflow-hidden rounded-xl">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-black text-white">
                  <th class="text-left p-4 font-black uppercase tracking-wide">Feature</th>
                  <th class="text-center p-4 font-black uppercase tracking-wide">Guest</th>
                  <th class="text-center p-4 font-black uppercase tracking-wide bg-[#ffc480] text-black border-x-[3px] border-black">
                    Free Account
                    <span class="block text-xs font-bold normal-case mt-1">Recommended</span>
                  </th>
                  <th class="text-center p-4 font-black uppercase tracking-wide">Paid Plans</th>
                </tr>
              </thead>
              <tbody>
                {#each comparisonTable as row, i}
                  <tr class={i % 2 === 0 ? 'bg-[#FFFDF8]' : 'bg-white'}>
                    <td class="p-4 font-bold border-t-[2px] border-gray-200">{row.feature}</td>
                    <td class="p-4 text-center border-t-[2px] border-gray-200">
                      {#if row.guest === 'No'}
                        <span class="text-gray-400 font-bold">-</span>
                      {:else}
                        <span class="font-bold text-gray-700">{row.guest}</span>
                      {/if}
                    </td>
                    <td class="p-4 text-center border-t-[2px] border-gray-200 bg-[#ffc480]/20 border-x-[3px] border-black">
                      {#if row.free === 'Yes'}
                        <span class="inline-flex items-center justify-center w-6 h-6 bg-[#4ade80] border-[2px] border-black rounded-full">
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                        </span>
                      {:else if row.free === 'No'}
                        <span class="text-gray-400 font-bold">-</span>
                      {:else}
                        <span class="font-black text-black">{row.free}</span>
                      {/if}
                    </td>
                    <td class="p-4 text-center border-t-[2px] border-gray-200">
                      {#if row.paid === 'Yes'}
                        <span class="inline-flex items-center justify-center w-6 h-6 bg-[#4ade80] border-[2px] border-black rounded-full">
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                        </span>
                      {:else}
                        <span class="font-bold text-gray-700">{row.paid}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="w-full py-16 px-6 bg-[#ffc480] border-y-[3px] border-black">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
          Ready to Get Started?
        </h2>
        <p class="text-xl font-bold text-gray-800 mb-8">
          Join 10,000+ developers generating images at scale.
          Create your free account in seconds.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            class="px-8 py-4 bg-black text-white border-[4px] border-black font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Create Free Account
          </a>
          <a
            href="/tools"
            class="px-8 py-4 bg-white text-black border-[4px] border-black font-black text-lg uppercase tracking-wide shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Try Tools First
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="w-full py-16 px-6">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div class="space-y-4">
          <details class="group bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#ccc]">
            <summary class="flex items-center justify-between p-5 cursor-pointer">
              <span class="font-black text-lg">Do I need a credit card?</span>
              <span class="transform transition-transform group-open:rotate-180 bg-black text-white w-7 h-7 flex items-center justify-center rounded border-[2px] border-black">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div class="p-5 pt-0 font-bold text-gray-700">
              No. Free accounts are completely free forever. You only need an email address to sign up. We'll never charge you unless you explicitly upgrade to a paid plan.
            </div>
          </details>

          <details class="group bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#ccc]">
            <summary class="flex items-center justify-between p-5 cursor-pointer">
              <span class="font-black text-lg">What happens when I hit the limit?</span>
              <span class="transform transition-transform group-open:rotate-180 bg-black text-white w-7 h-7 flex items-center justify-center rounded border-[2px] border-black">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div class="p-5 pt-0 font-bold text-gray-700">
              Your limit resets at the start of each month. If you need more generations, you can upgrade to a paid plan anytime. We'll never automatically charge you.
            </div>
          </details>

          <details class="group bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#ccc]">
            <summary class="flex items-center justify-between p-5 cursor-pointer">
              <span class="font-black text-lg">Can I use free images commercially?</span>
              <span class="transform transition-transform group-open:rotate-180 bg-black text-white w-7 h-7 flex items-center justify-center rounded border-[2px] border-black">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div class="p-5 pt-0 font-bold text-gray-700">
              Yes! All images generated with a free account are yours to use however you want, including commercial projects. No attribution required.
            </div>
          </details>

          <details class="group bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#ccc]">
            <summary class="flex items-center justify-between p-5 cursor-pointer">
              <span class="font-black text-lg">How do I get my API key?</span>
              <span class="transform transition-transform group-open:rotate-180 bg-black text-white w-7 h-7 flex items-center justify-center rounded border-[2px] border-black">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div class="p-5 pt-0 font-bold text-gray-700">
              After signing up, go to your Dashboard and click "API Token" in the sidebar. You can create and manage your API keys from there.
            </div>
          </details>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>
