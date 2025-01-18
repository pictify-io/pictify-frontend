<script>
  export let icon;
  export let title;
  export let description;
  export let color = 'bg-gray-50';
  export const hoverColor = 'hover:bg-gray-100/50';
</script>

<div class="relative w-auto flex-shrink-0 group h-full">
  <div class="w-full h-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10" />
  <div class="{color} p-6 rounded-lg border-2 border-gray-900 relative z-20 transition-all group-hover:-translate-y-px group-hover:-translate-x-px h-full flex flex-col">
    <div class="text-4xl mb-4">{icon}</div>
    <h3 class="text-xl font-bold mb-2">{title}</h3>
    <p class="text-gray-600 flex-grow">{description}</p>
  </div>
</div>

<style>
  /* Remove unused styles */
</style>
