<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import FeatureCard from './FeatureCard.svelte';
  import SignUpButton from '$lib/components/landingPage/SignUpButton.svelte';

  let visible = false;
  let activeTab = 'performance';
  
  onMount(() => {
    visible = true;
  });

  const features = {
    performance: [
      {
        icon: "⚡",
        title: "Lightning Fast Conversion",
        description: "Convert HTML to images in milliseconds. 5x faster than competitors with our optimized rendering engine.",
        color: "bg-yellow-50",
        hoverColor: "hover:bg-yellow-100/50"
      },
      {
        icon: "🌐",
        title: "Global Edge Network",
        description: "99.9% uptime with automatic failover. Your images are delivered instantly through our global CDN.",
        color: "bg-blue-50",
        hoverColor: "hover:bg-blue-100/50"
      }
    ],
    quality: [
      {
        icon: "🎯",
        title: "Pixel Perfect Output",
        description: "Get high-quality, retina-ready images that look exactly like your HTML design, every time.",
        color: "bg-red-50",
        hoverColor: "hover:bg-red-100/50"
      },
      {
        icon: "🚀",
        title: "Unlimited Scale",
        description: "No rate limits. Scale from 100 to 1M+ conversions without changing a line of code.",
        color: "bg-purple-50",
        hoverColor: "hover:bg-purple-100/50"
      }
    ],
    customization: [
      {
        icon: "🎨",
        title: "Flexible Options",
        description: "Customize image dimensions, formats, quality, and more with simple API parameters.",
        color: "bg-green-50",
        hoverColor: "hover:bg-green-100/50"
      },
      {
        icon: "✨",
        title: "Advanced Styling",
        description: "Full support for custom fonts, CSS animations, and responsive designs in your output images.",
        color: "bg-orange-50",
        hoverColor: "hover:bg-orange-100/50"
      }
    ]
  };
</script>

<section class="py-12 sm:py-16 w-full relative" id="why-pictify">
   <div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
		<div class="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/10 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
	</div>
   
   <div class="container mx-auto px-4 md:px-6 max-w-5xl relative">
    {#if visible}
    <div class="text-center space-y-4 md:space-y-6 mb-8 md:mb-12" in:fade={{ duration: 1000, delay: 200 }}>
      <h2 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
        Built For <span class="text-[#ff6b6b]">Modern Developers</span>
      </h2>
      <p class="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto font-medium">Everything you need to create stunning images from your HTML code</p>
    </div>

    <!-- Feature Categories -->
    <div class="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
      <div class="relative w-auto flex-shrink-0 group">
        <button
          class={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all relative z-20 ${
            activeTab === 'performance' 
              ? 'bg-[#ff6b6b] text-white shadow-lg' 
              : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 hover:border-[#ff6b6b]/30'
          }`}
          on:click={() => activeTab = 'performance'}
        >
          Performance
        </button>
      </div>
      <div class="relative w-auto flex-shrink-0 group">
        <button
          class={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all relative z-20 ${
            activeTab === 'quality' 
              ? 'bg-[#ff6b6b] text-white shadow-lg' 
              : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 hover:border-[#ff6b6b]/30'
          }`}
          on:click={() => activeTab = 'quality'}
        >
          Quality
        </button>
      </div>
      <div class="relative w-auto flex-shrink-0 group">
        <button
          class={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all relative z-20 ${
            activeTab === 'customization' 
              ? 'bg-[#ff6b6b] text-white shadow-lg' 
              : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800 hover:border-[#ff6b6b]/30'
          }`}
          on:click={() => activeTab = 'customization'}
        >
          Customization
        </button>
      </div>
    </div>

    <!-- Feature Cards -->
    {#if visible}
      <div class="grid md:grid-cols-2 gap-6 lg:gap-8" in:fade>
        {#each features[activeTab] as feature}
          <FeatureCard
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            color={feature.color}
            hoverColor={feature.hoverColor}
          />
        {/each}
      </div>
    {/if}

    <!-- Additional Feature Details -->
    <div class="mt-8 md:mt-12 p-6 md:p-8 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-200 shadow-sm">
      {#if activeTab === 'performance'}
        <div class="space-y-4 md:space-y-6" in:fade>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900">Performance That Scales</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="text-3xl md:text-4xl font-bold text-[#ff6b6b]">&lt; 1s</div>
              <div class="text-sm md:text-base font-medium text-gray-700 mt-1 md:mt-2">Average Response</div>
            </div>
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="text-3xl md:text-4xl font-bold text-[#ff6b6b]">∞</div>
              <div class="text-sm md:text-base font-medium text-gray-700 mt-1 md:mt-2">No Rate Limits</div>
            </div>
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="text-3xl md:text-4xl font-bold text-[#ff6b6b]">12</div>
              <div class="text-sm md:text-base font-medium text-gray-700 mt-1 md:mt-2">Global Edge Locations</div>
            </div>
          </div>
        </div>
      {:else if activeTab === 'quality'}
        <div class="space-y-4 md:space-y-6" in:fade>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900">Quality Assurance</h3>
          <ul class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-[#ff6b6b]/10 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-base md:text-lg font-medium text-gray-800">4K Resolution Support</span>
              </div>
            </div>
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-[#ff6b6b]/10 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-base md:text-lg font-medium text-gray-800">Retina Display Optimization</span>
              </div>
            </div>
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-[#ff6b6b]/10 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-base md:text-lg font-medium text-gray-800">Custom DPI Settings</span>
              </div>
            </div>
          </ul>
        </div>
      {:else}
        <div class="space-y-4 md:space-y-6" in:fade>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900">Customization Options</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <h4 class="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">Format Options</h4>
              <p class="text-sm md:text-base text-gray-700">Export to PNG, JPG, WebP with custom quality settings.</p>
            </div>
            <div class="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 transition-all duration-300">
              <h4 class="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">Styling Control</h4>
              <p class="text-sm md:text-base text-gray-700">Custom CSS, fonts, and viewport settings for perfect renders.</p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-8 md:mt-12 flex flex-col items-center space-y-4 md:space-y-6" in:fade={{ duration: 1000, delay: 800 }}>
      <SignUpButton />
      <p class="text-sm md:text-base text-gray-700 font-medium">Join thousands of developers building better experiences</p>
    </div>
    {/if}
   </div>
</section>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes float-delayed {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(20px); }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
  }
</style>
