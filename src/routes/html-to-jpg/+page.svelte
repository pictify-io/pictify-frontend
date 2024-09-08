<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  if (browser) {
    goto('/tools/html-to-jpg');
  }
</script>
<svelte:head>
  <link rel="canonical" href="https://pictify.io/tools/html-to-jpg">
</svelte:head>

{#if !browser}
  <div>Redirecting...</div>
{/if}

