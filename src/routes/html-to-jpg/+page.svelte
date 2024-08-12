<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  if (browser) {
    goto('/tools/html-to-jpg');
  }
</script>

{#if !browser}
  <div>Redirecting...</div>
{/if}

