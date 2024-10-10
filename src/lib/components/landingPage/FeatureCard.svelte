<script>
  export let icon;
  export let title;
  export let description;
</script>

<div class="feature-card bg-white rounded-lg p-6 transition-all duration-300 border-2 border-gray-500 hover:border-gray-900">
  <div class="icon-wrapper mb-4 text-white rounded-full w-14 h-14 flex items-center justify-center text-4xl">
    {icon}
  </div>
  <h3 class="text-xl font-semibold mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
</div>

<style>
  .feature-card:hover {
    transform: translateY(-5px);
  }
  .icon-wrapper {
    transition: all 0.3s ease;
  }
  .feature-card:hover .icon-wrapper {
    transform: scale(1.1);
  }
</style>
