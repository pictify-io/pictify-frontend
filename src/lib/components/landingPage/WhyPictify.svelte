<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import FeatureCard from './FeatureCard.svelte';
	import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';

  let visible = false;
  onMount(() => {
    visible = true;
  });
</script>

<section class=" py-20 w-full " id="why-pictify">
   <div class="container mx-auto px-4 max-w-4xl">
    <h2 class="text-4xl sm:text-5xl font-bold text-center mb-12">
      Why <span class="text-[#ff6b6b]">10,000+ Developers</span> Choose Pictify
    </h2>

    <div class="grid md:grid-cols-2 gap-8 mb-16">
      {#if visible}
        <div class="space-y-6" transition:fade={{ duration: 500, delay: 200 }}>
          <FeatureCard
            icon="⚡"
            title="5x Faster Conversion"
            description="Our HTML to Image/GIF API outperforms competitors, ensuring rapid content creation."
          />
          <FeatureCard
            icon="🌐"
            title="Global CDN Delivery"
            description="99.9% uptime with lightning-fast loading times worldwide."
          />
          <FeatureCard
            icon="🖥️"
            title="One-Click Website Capture"
            description="Convert any URL into high-quality images or GIFs instantly."
          />
        </div>
        <div class="space-y-6" transition:fade={{ duration: 500, delay: 400 }}>
          <FeatureCard
            icon="🚀"
            title="No Rate Limits"
            description="Scale your projects without worrying about API restrictions."
          />
          <FeatureCard
            icon="✂️"
            title="AI-Powered Smart Cropping"
            description="Perfect images every time with our intelligent algorithm."
          />
          <FeatureCard
            icon="🎛️"
            title="Developer-Friendly Customization"
            description="Fine-tune results with advanced options for pixel-perfect output."
          />
        </div>
      {/if}
    </div>

    <div class="text-center">
      <p class="text-xl mb-6">Join the thousands of developers who've streamlined their workflow with Pictify</p>
      <SignUpButton />
    </div>
  </div>
</section>

<style>
  /* Add any additional styles here */
</style>
