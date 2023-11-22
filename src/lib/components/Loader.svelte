<script>
    export let size = "8";
    export let show = false;
  </script>
  
{#if show}
  <div class="flex justify-center items-center">
    <div class={` border-gray-900 rounded-full w-${size} h-${size} animate-spin border-solid border-t-2 `}></div>
  </div>
{/if}