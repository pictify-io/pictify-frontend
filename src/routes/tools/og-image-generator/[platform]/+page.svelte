<script>
  import { page } from '$app/stores';
  import OgImageGenerator from '../+page.svelte';
  import { ogPlatforms, popularSizes } from '$lib/pseo/config.js';

  $: platformId = $page.params.platform;
  $: platform = ogPlatforms.find(p => p.id === platformId) || { id: platformId, label: platformId };
  $: title = `OG Image Generator for ${platform.label} | Pictify.io`;
  $: description = `Create perfect Open Graph images for ${platform.label}. Customize templates, colors, fonts, and logos with Pictify.io's free OG Image Generator.`;
  $: canonical = `https://pictify.io/tools/og-image-generator/${platform.id}`;

  const platformGuides = {
    wordpress: [
      'Install a SEO plugin (Yoast/RankMath) or edit theme header.php',
      'Upload the image and copy its URL',
      'Set og:image, og:title, og:description in the plugin or theme head',
      'Clear caches and test with Facebook Sharing Debugger'
    ],
    notion: [
      'Publish the page to web (or via custom domain proxy)',
      'Host the OG image on a CDN and copy URL',
      'Add meta tags in the proxy/front layer (Vercel/Cloudflare)',
      'Test with social debuggers (Facebook/X)'
    ],
    shopify: [
      'From Admin > Online Store > Preferences set Social sharing image',
      'For per‑product/blog, set featured image or template override',
      'Ensure theme.liquid includes og:image and twitter:card',
      'Save and test with debuggers'
    ],
    ghost: [
      'Open Post/Page settings and set Social preview image',
      'Theme should include og:* tags (most do)',
      'Regenerate and test with debuggers'
    ],
    github: [
      'For GitHub Pages, add meta tags in your index.html',
      'Commit OG image into repo or use external URL',
      'Push and verify with debuggers'
    ],
    linkedin: [
      'For shared links, LinkedIn pulls og:image from your page',
      'Ensure og:image is absolute HTTPS URL (1200x630 recommended)',
      'Use Post Inspector to refresh cache'
    ],
    twitter: [
      'Add twitter:card=summary_large_image and twitter:image',
      'Image 1200x630 recommended, under 5MB',
      'Use Card Validator to refresh'
    ]
  };

  $: steps = platformGuides[platform.id] || [
    'Upload OG image to a CDN and copy URL',
    'Add og:image, og:title, og:description meta tags',
    'Validate with social debuggers'
  ];

  $: schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `Pictify OG Image Generator for ${platform.label}`,
    url: canonical,
    applicationCategory: ["DesignApplication", "SEO Tool"],
    operatingSystem: "Web",
    description,
    mainEntity: [{
      "@type": "HowTo",
      name: `Add OG image to ${platform.label}`,
      step: steps.map(s => ({ "@type": "HowToStep", text: s }))
    }]
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {@html `<script type="application/ld+json">${JSON.stringify(schema)}</script>`}
</svelte:head>

<section>
  <OgImageGenerator platform={platform.id} />
  <!-- Note: Base generator includes its own layout, nav and footer -->
</section>


