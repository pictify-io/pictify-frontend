<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import { popularSizes as configPopularSizes, useCases, useCaseDetails, ogPlatforms } from '$lib/pseo/config.js';
import Footer from '$lib/components/landingPage/Footer.svelte';
import CodeEditor from '$lib/components/tools/CodeEditor.svelte';
import ApiPromptSection from '$lib/components/tools/ApiPromptSection.svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { user } from '../../../store/user.store';
import { toast } from '../../../store/toast.store';
import { createImagePublic } from '../../../api/image.js';
import Toast from '$lib/components/Toast.svelte';

$: format = $page.params.format;

// Support optional size parameter from nested route: /tools/html-to-[format]/[dimensions]
function parseDimensions(dim) {
    const match = (dim || '').toLowerCase().match(/^(\d+)x(\d+)$/);
    if (!match) return { width: null, height: null };
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
        return { width: null, height: null };
    }
    return { width, height };
}

$: rawDimensions = $page.params.dimensions;
$: ({ width: dimWidth, height: dimHeight } = parseDimensions(rawDimensions));
$: hasSize = !!(dimWidth && dimHeight);
$: sizeString = hasSize ? `${dimWidth}x${dimHeight}` : '';

// SEO head computed values (dimension-aware)
$: headTitle = hasSize
    ? `HTML to ${(currentFormat && currentFormat.fullName) || 'Image'} ${sizeString} Converter | Pictify.io`
    : `Convert Image from HTML | HTML to ${format || 'Image'} | Free Online HTML Image Generator | Pictify.io`;
$: headDescription = hasSize
    ? `Convert HTML to ${(currentFormat && currentFormat.fullName) || 'image'} at ${sizeString} instantly. Perfect for ${(currentFormat && currentFormat.bestFor) || 'web use'}.`
    : `Convert HTML to ${format || 'image'} easily with Pictify.io. Transform HTML to ${(format && format.toUpperCase && format.toUpperCase()) || 'IMAGE'} images instantly. Perfect for ${(currentFormat && currentFormat.bestFor) || 'web use'}. Try our HTML to ${(format && format.toUpperCase && format.toUpperCase()) || 'IMAGE'} image converter now!`;
$: canonicalUrl = hasSize
    ? `https://pictify.io/tools/html-to-${format}/${sizeString}`
    : `https://pictify.io/tools/html-to-${format}`;
$: ogDescription = hasSize
    ? `Convert HTML to high-quality ${(currentFormat && currentFormat.fullName) || 'Image'} ${sizeString} images for free with Pictify.io's online HTML to ${(format && format.toUpperCase && format.toUpperCase()) || ''} converter.`
    : `Convert HTML to high-quality ${(currentFormat && currentFormat.fullName) || 'Image'} images for free with Pictify.io's online HTML to ${(format && format.toUpperCase && format.toUpperCase()) || ''} converter. Perfect for creating social media content, email marketing visuals, and website mockups.`;

// Add copyToClipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        toast.set({ message: 'URL copied to clipboard! 🔗', duration: 2000 });
    }).catch(() => {
        toast.set({ message: 'Failed to copy URL', duration: 2000 });
    });
}

const formatExtensionMap = {
    jpg: 'jpeg',
    png: 'png',
    webp: 'webp',
};

$: fileExtension = formatExtensionMap[format];

$: if (!fileExtension) {
    if(browser) {
        goto('/tools/html-to-jpg');
    }
}

let formats = ['jpg', 'png', 'webp',]
const popularSizes = configPopularSizes;
const featuredPlatforms = ogPlatforms.slice(0, 3);

function handleFormatChange(event) {
    const newFormat = event.target.value;
    if(browser) {
        goto(`/tools/html-to-${newFormat}`);
    }
}

// Add local storage management
let usageKey = 'pictify_free_usage';
let maxFreeGenerations = 5;
let freeGenerationsUsed = 0;

onMount(() => {
    if (browser) {
        // Load usage from local storage
        const usage = localStorage.getItem(usageKey);
        if (usage) {
            freeGenerationsUsed = parseInt(usage);
        }

        // Reset usage if it's a new day
        const lastUsageDate = localStorage.getItem(usageKey + '_date');
        const today = new Date().toDateString();
        if (lastUsageDate !== today) {
            freeGenerationsUsed = 0;
            localStorage.setItem(usageKey, '0');
            localStorage.setItem(usageKey + '_date', today);
        }
    }

    // Apply preselected dimensions from size variant pages, if present
    if (browser) {
        const storedWidth = localStorage.getItem('pictify_html_to_image_width');
        const storedHeight = localStorage.getItem('pictify_html_to_image_height');
        if (storedWidth && storedHeight) {
            const widthVal = parseInt(storedWidth, 10);
            const heightVal = parseInt(storedHeight, 10);
            if (!Number.isNaN(widthVal) && !Number.isNaN(heightVal) && widthVal > 0 && heightVal > 0) {
                previewWidth = widthVal;
                previewHeight = heightVal;
            }
            localStorage.removeItem('pictify_html_to_image_width');
            localStorage.removeItem('pictify_html_to_image_height');
        }
    }
});

// Function to update usage in local storage
function updateUsage() {
    if (browser) {
        freeGenerationsUsed++;
        localStorage.setItem(usageKey, freeGenerationsUsed.toString());
        localStorage.setItem(usageKey + '_date', new Date().toDateString());
    }
}

// Add remaining generations computed property
$: remainingGenerations = maxFreeGenerations - freeGenerationsUsed;
$: usagePercentage = (freeGenerationsUsed / maxFreeGenerations) * 100;

// Add user store subscription
let isUserLoggedIn = false;
user.subscribe(userData => {
    isUserLoggedIn = !!userData.email;
});

let totalImagesGenerated = 34567; // Social proof counter
let generationCount = 0;
let showUpgradePrompt = false;
const apiFeatureBullets = [
    'Convert HTML to PNG, JPG, or WebP at any size with one API call',
    'Automate bulk generation for invoices, OG images, certificates, and receipts',
    'Serve CDN-hosted assets instantly with usage analytics and token controls'
];
const apiSnippetTemplate = `curl -X POST https://api.pictify.io/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "html": "YOUR_HTML_HERE",
    "width": WIDTH_PLACEHOLDER,
    "height": HEIGHT_PLACEHOLDER,
    "fileExtension": "FORMAT_PLACEHOLDER"
  }'`;


let imageUrl = '';
let isImageGenerating = false;
let previewWidth = 1200;
let previewHeight = 630;
let previewHtml = '';

// Apply dimensions if present in URL params
$: if (hasSize) {
    previewWidth = dimWidth;
    previewHeight = dimHeight;
}

function handlePreviewUpdate(event) {
    const { html, width, height } = event.detail;
    previewHtml = html;
    // Only allow the editor to control dimensions when no size is locked from the URL
    if (!hasSize) {
        previewWidth = width;
        previewHeight = height;
    }
}

async function generateImage() {
    if (isImageGenerating) return;
    
    if (!isUserLoggedIn && freeGenerationsUsed >= maxFreeGenerations) {
        showUpgradePrompt = true;
        return;
    }

    isImageGenerating = true;
    
    try {
        // Add watermark for non-logged in users after first generation
        let html = previewHtml;
        if (!isUserLoggedIn && freeGenerationsUsed >= 1) {
            const watermarkDiv = `
                <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); 
                                        padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                                        font-family: system-ui, -apple-system, sans-serif;">
                    Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none;">pictify.io</a>
                </div>
            `;
            
            html = html.replace('</body>', `${watermarkDiv}</body>`);
        }
        
        const widthToUse = hasSize ? dimWidth : previewWidth;
        const heightToUse = hasSize ? dimHeight : previewHeight;
        const {image} = await createImagePublic({
            html,
            width: widthToUse,
            height: heightToUse,
            fileExtension: fileExtension
        });
        
        imageUrl = image.url;
        totalImagesGenerated++;

        // Update usage tracking for non-logged in users
        if (!isUserLoggedIn) {
            updateUsage();
        }

        // Show contextual prompts based on usage
        if (!isUserLoggedIn) {
            if (freeGenerationsUsed === 1) {
                showFirstGenerationPrompt = true;
            } else if (freeGenerationsUsed === maxFreeGenerations - 1) {
                showSharePrompt = true;
            } else if (freeGenerationsUsed >= maxFreeGenerations) {
                showUpgradePrompt = true;
            }
        }
        
    } catch (error) {
        toast.set({ message: 'Failed to generate image. Please try again.', duration: 3000 });
    } finally {
        isImageGenerating = false;
    }
}

// Function to handle social sharing with rewards
function handleSocialShare(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this awesome HTML to ${format.toUpperCase()} converter!`);
    
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('HTML to Image Converter')}&summary=${text}`, '_blank');
    }

    // Increment generation limit as a reward
    generationCount--;
    showSharePrompt = false;
    toast.set({ message: 'Thank you for sharing! You got 1 extra generation 🎉', duration: 3000 });
}

// Add format-specific information
const formatInfo = {
    jpg: {
        fullName: "JPG",
        benefits: ["Excellent compression for photographs", "Smaller file sizes", "Wide compatibility"],
        bestFor: "photographs and complex images with gradients",
        drawbacks: "lossy compression, not ideal for text or simple graphics"
    },
    png: {
        fullName: "PNG",
        benefits: ["Lossless compression", "Supports transparency", "Ideal for graphics and screenshots"],
        bestFor: "logos, icons, and images with text",
        drawbacks: "larger file sizes compared to JPG for photographs"
    },
    webp: {
        fullName: "WebP",
        benefits: ["Superior compression", "Supports both lossy and lossless compression", "Smaller file sizes than JPG and PNG"],
        bestFor: "web graphics, combining the best of JPG and PNG",
        drawbacks: "not universally supported by older browsers"
    }
};

// Add default format info
const defaultFormatInfo = {
    jpg: {
    fullName: "JPG",
    benefits: ["Excellent compression for photographs", "Smaller file sizes", "Wide compatibility"],
    bestFor: "photographs and complex images with gradients",
    drawbacks: "lossy compression, not ideal for text or simple graphics"
    },
    png: {
    fullName: "PNG",
    benefits: ["Lossless compression", "Supports transparency", "Ideal for graphics and screenshots"],
    bestFor: "logos, icons, and images with text",
    drawbacks: "larger file sizes compared to JPG for photographs"
    },
    webp: {
    fullName: "WebP",
    benefits: ["Superior compression", "Supports both lossy and lossless compression", "Smaller file sizes than JPG and PNG"],
    bestFor: "web graphics, combining the best of JPG and PNG",
    drawbacks: "not universally supported by older browsers"
    }
};

// Add safe access to format info
$: currentFormat = formatInfo[format] || defaultFormatInfo.jpg;
$: otherFormats = Object.keys(formatInfo).filter(f => f !== format);

// Add state for contextual prompts
let showFirstGenerationPrompt = false;
let showSharePrompt = false;

// Enhanced Schema Markup (dimension-aware)
$: schemaMarkup = format ? {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": hasSize ? `HTML to ${currentFormat?.fullName || 'Image'} ${sizeString} Converter` : `HTML to ${currentFormat?.fullName || 'Image'} Converter`,
    "url": hasSize ? `https://pictify.io/tools/html-to-${format}/${sizeString}` : `https://pictify.io/tools/html-to-${format}`,
    "description": hasSize ? `Convert HTML to high-quality ${currentFormat?.fullName || 'image'} at ${sizeString} instantly. Create optimized images for websites, social media, and email marketing.` : `Convert HTML to high-quality ${currentFormat?.fullName || 'image'} instantly. Create optimized images for websites, social media, and email marketing.`,
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "featureList": [
        `Instant HTML to ${currentFormat?.fullName || 'Image'} conversion${hasSize ? ` at ${sizeString}` : ''}`,
        `Optimized for ${currentFormat?.bestFor || 'web use'}`,
        "Web-friendly output",
        "No watermarks"
    ],
    "mainEntity": [
        {
            "@type": "HowTo",
            "name": hasSize ? `How to Convert HTML to ${currentFormat?.fullName || 'Image'} (${sizeString})` : `How to Convert HTML to ${currentFormat?.fullName || 'Image'}`,
            "description": hasSize ? `Step-by-step guide to convert HTML to ${currentFormat?.fullName || 'Image'} images at ${sizeString}` : `Step-by-step guide to convert HTML to ${currentFormat?.fullName || 'Image'} images`,
            "step": [
                {
                    "@type": "HowToStep",
                    "text": "Input your HTML code in the editor",
                    "url": `https://pictify.io/tools/html-to-${format}#input`
                },
                {
                    "@type": "HowToStep",
                    "text": "Preview your HTML design",
                    "url": `https://pictify.io/tools/html-to-${format}#preview`
                },
                {
                    "@type": "HowToStep",
                    "text": hasSize ? `Generate your ${currentFormat?.fullName || 'Image'} image at ${sizeString}` : `Generate your ${currentFormat?.fullName || 'Image'} image`,
                    "url": `https://pictify.io/tools/html-to-${format}#generate`
                }
            ]
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": `How does HTML to ${currentFormat?.fullName || 'Image'} conversion work?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality image."
                    }
                },
                {
                    "@type": "Question",
                    "name": `What's the best use case for ${currentFormat?.fullName || 'Image'}?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `${currentFormat?.fullName || 'Image'} is best for ${currentFormat?.bestFor || 'web use'}.`
                    }
                }
            ]
        }
    ]
} : null;
</script>

<svelte:head>
<title>{headTitle}</title>
<meta name="description" content={headDescription} />
<meta name="keywords" content={hasSize ? `convert image from HTML, HTML to ${format.toUpperCase()} ${sizeString}, ${format.toUpperCase()} converter, ${sizeString} image, online image generator, web design tool, ${currentFormat.fullName} image creator, Pictify.io` : `convert image from HTML, HTML to ${format.toUpperCase()}, ${format.toUpperCase()} converter, online image generator, web design tool, ${currentFormat.fullName} image creator, Pictify.io`} />
<meta name="author" content="Pictify.io" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta Property="og:title" content="Pictify.io" />
<meta Property="og:description" content={ogDescription} />
<meta
    Property="og:image"
    content="https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png"
/>
<meta Property="og:url" content={canonicalUrl} />
<meta Property="og:type" content="website" />
<meta Property="og:site_name" content="Pictify.io" />
<meta Property="og:locale" content="en_US" />
<link rel="canonical" href={canonicalUrl} />

{#if schemaMarkup}
{@html `<script type="application/ld+json">
${JSON.stringify(schemaMarkup)}
</script>`}	
{/if}
</svelte:head>

<section class="min-h-screen bg-[#FFFDF8] font-['Manrope']">
<Nav />
<main class="w-full max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 relative z-10">
    <!-- Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] transform -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ffc480]/10 rounded-full blur-[100px] transform translate-y-1/2"></div>
    </div>

    <!-- Hero Content -->
    <div class="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto mb-16 relative">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1">
            <span class="text-lg">🎨</span>
            <span class="font-bold text-gray-900">HTML to {currentFormat.fullName} Converter</span>
        </div>

        <h1 class="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] mb-4">
            HTML to {currentFormat.fullName}{#if hasSize}<br/><span class="text-4xl md:text-5xl align-middle">({sizeString})</span>{/if}<br/>
            <span class="text-[#ff6b6b] relative inline-block">
                Converter
                <svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
                </svg>
            </span>
        </h1>
        
        <p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
            Transform your HTML code into high-quality {currentFormat.fullName} images {#if hasSize} at {sizeString}{/if} instantly. Perfect for {currentFormat.bestFor}.
        </p>

        <!-- Format Selector -->
        <div class="w-full max-w-3xl mx-auto bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] mt-8">
            <div class="flex flex-col items-center gap-6">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    {#each formats as f}
                        <button
                            class="group w-full relative"
                            on:click={() => {
                                if(browser && f !== format) {
                                    goto(`/tools/html-to-${f}`);
                                }
                            }}
                        >
                            <div 
                                class={`px-4 py-3 rounded-xl border-[3px] transition-all duration-200 ${f === format ? 'border-gray-900 bg-[#ff6b6b] text-white shadow-[4px_4px_0_0_#1f2937]' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5'}`}
                            >
                                <div class="flex flex-col items-center gap-1">
                                    <span class="text-lg font-black">{f.toUpperCase()}</span>
                                    <span class={`text-xs font-bold ${f === format ? 'text-white/90' : 'text-gray-500'}`}>{formatInfo[f].fullName}</span>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
                {#if hasSize}
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                        {#each popularSizes as sz}
                            <a href={`/tools/html-to-${format}/${sz}`} class="group">
                                <div class={`px-4 py-2 rounded-lg border-[3px] text-sm font-bold text-center transition-all duration-200 ${sizeString === sz ? 'border-gray-900 bg-[#ffc480] text-gray-900 shadow-[2px_2px_0_0_#1f2937]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-y-0.5'}`}>
                                    {sz}
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Usage Progress Bar for non-logged in users -->
    {#if !isUserLoggedIn}
        <div class="w-full max-w-6xl mx-auto mb-12">
            <div class="bg-white rounded-2xl border-[3px] border-gray-900 p-6 shadow-[6px_6px_0_0_#1f2937]">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <div class="flex-1 w-full">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-bold text-gray-900 uppercase tracking-wide">Guest Limit</span>
                            <span class="text-sm font-black text-gray-900">{freeGenerationsUsed}/{maxFreeGenerations}</span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-4 border-2 border-gray-900 overflow-hidden">
                            <div 
                                class="bg-[#ff6b6b] h-full transition-all duration-500 border-r-2 border-gray-900" 
                                style="width: {usagePercentage}%" 
                            />
                        </div>
                        <p class="text-sm font-medium text-gray-600 mt-2">Sign up free to unlock unlimited generations</p>
                    </div>
                    {#if remainingGenerations !== 1}
                        <a 
                            href={`/signup?redirect=/tools/html-to-${format}`}
                            class="w-full md:w-auto py-3 px-6 rounded-xl border-[3px] border-gray-900 font-black bg-[#ffc480] text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center whitespace-nowrap"
                        >
                            Sign Up Free
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Code Editor Section -->
    <div class="w-full max-w-6xl mx-auto bg-white rounded-3xl border-[3px] border-gray-900 p-6 md:p-8 shadow-[8px_8px_0_0_#1f2937] mb-20">
        <div class="flex flex-col gap-8">
            <div class="border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1f2937]">
                <CodeEditor
                    isPreviewEnabled={false}
                    fileExtension={fileExtension}
                    targetWidth={hasSize ? dimWidth : undefined}
                    targetHeight={hasSize ? dimHeight : undefined}
                    on:previewUpdated={handlePreviewUpdate}
                />
            </div>
            
            <!-- Generate Button -->
            <div class="relative group w-full">
                <div class="w-full rounded-xl bg-gray-900 translate-y-2 translate-x-2 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-3 group-hover:translate-x-3" />
                <button 
                    on:click={generateImage}
                    disabled={isImageGenerating}
                    class="py-5 rounded-xl px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-black bg-[#ffc480] tracking-wide text-xl flex-shrink-0 text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span class="relative inline-flex items-center gap-3 justify-center">
                        {#if isImageGenerating}
                            <span>Generating Magic...</span>
                            <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        {:else}
                            <span>Generate {format.toUpperCase()} Image</span>
                            <svg class="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        {/if}
                    </span>
                </button>
            </div>
        </div>
    </div>

    <!-- Generated Image Section -->
    {#if imageUrl}
        <div class="w-full max-w-6xl mx-auto bg-white rounded-3xl border-[3px] border-gray-900 p-6 md:p-8 shadow-[8px_8px_0_0_#1f2937] mb-20 animate-fade-in">
            <!-- Success Message -->
            <div class="text-center mb-8">
                <h3 class="text-3xl font-black text-gray-900 mb-2">🎉 Your Image is Ready!</h3>
                <p class="text-gray-600 font-medium">Join {totalImagesGenerated.toLocaleString()} others creating beautiful images</p>
            </div>

            <!-- URL Section -->
            <div class="mb-8 flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
                <div class="flex-1 w-full min-w-0 bg-white border-2 border-gray-200 rounded-lg px-4 py-2">
                    <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="text-sm font-mono text-gray-600 hover:text-[#ff6b6b] truncate block transition-colors"
                    >
                        {imageUrl}
                    </a>
                </div>
                <button
                    class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors shadow-[2px_2px_0_0_#ff6b6b] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                    on:click={() => copyToClipboard(imageUrl)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy URL
                </button>
            </div>

            <!-- Generated Image Preview -->
            <div class="mb-10 overflow-hidden rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]">
                <div class="relative w-full bg-gray-100" style={hasSize ? `aspect-ratio: ${dimWidth} / ${dimHeight}` : 'aspect-ratio: 1200 / 630'}>
                    <img 
                        src={imageUrl} 
                        alt="Generated Image" 
                        class="absolute inset-0 w-full h-full object-contain p-4" 
                    />
                </div>
            </div>
    
            <!-- Action Buttons -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#if !isUserLoggedIn}
                    <div class="relative w-full group">
                        <div class="w-full rounded-xl bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                        <button 
                            class="py-4 rounded-xl px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-black bg-[#ff6b6b] tracking-wide text-lg text-white transition-all"
                            on:click={() => window.location.href = `/signup?redirect=/tools/html-to-${format}`}
                        >
                            <span class="relative inline-flex items-center gap-2">
                                <span>Create Free Account</span>
                                <svg class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </span>
                        </button>
                    </div>
                {/if}
    
                <!-- Share Buttons -->
                <div class="grid grid-cols-2 gap-4 {isUserLoggedIn ? 'md:col-span-2' : ''}">
                    <div class="relative group w-full">
                        <div class="w-full rounded-xl bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                        <button 
                            class="py-4 px-4 rounded-xl group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-bold bg-black tracking-wide text-sm text-white transition-all"
                            on:click={() => handleSocialShare('twitter')}
                        >
                            <span class="relative inline-flex items-center gap-2 justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                <span class="hidden md:inline">Share on X</span>
                            </span>
                        </button>
                    </div>
                    
                    <div class="relative group w-full">
                        <div class="w-full rounded-xl bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
                        <button 
                            class="py-4 px-4 rounded-xl group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-bold bg-[#0A66C2] tracking-wide text-sm text-white transition-all"
                            on:click={() => handleSocialShare('linkedin')}
                        >
                            <span class="relative inline-flex items-center gap-2 justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.065 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                <span class="hidden md:inline">Share on LinkedIn</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Content Sections -->
    <div class="max-w-6xl mx-auto px-4 mt-20">
        <!-- How it Works Section -->
        <section class="mb-16 bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-transform duration-300">
            <h2 class="text-3xl font-black mb-10 text-gray-900">How to Convert HTML to {currentFormat.fullName} {#if hasSize} ({sizeString}){/if}</h2>
            <div class="flex flex-col md:flex-row gap-8">
                <div class="flex-1 relative">
                    <div class="absolute -top-4 -left-4 w-12 h-12 bg-[#ff6b6b] rounded-full border-[3px] border-gray-900 flex items-center justify-center text-xl font-black text-white shadow-[2px_2px_0_0_#1f2937] z-10">1</div>
                    <div class="bg-[#FFFDF8] rounded-2xl p-6 border-[3px] border-gray-900 h-full pt-10">
                        <h3 class="text-xl font-black mb-2">Input HTML</h3>
                        <p class="text-gray-700 font-medium">Paste your HTML code in the editor above or start with our default template.</p>
                    </div>
                </div>
                <div class="flex-1 relative">
                    <div class="absolute -top-4 -left-4 w-12 h-12 bg-[#ffc480] rounded-full border-[3px] border-gray-900 flex items-center justify-center text-xl font-black text-gray-900 shadow-[2px_2px_0_0_#1f2937] z-10">2</div>
                    <div class="bg-[#FFFDF8] rounded-2xl p-6 border-[3px] border-gray-900 h-full pt-10">
                        <h3 class="text-xl font-black mb-2">Preview</h3>
                        <p class="text-gray-700 font-medium">Check how your HTML will look as a {currentFormat.fullName} image in real-time.</p>
                    </div>
                </div>
                <div class="flex-1 relative">
                    <div class="absolute -top-4 -left-4 w-12 h-12 bg-[#4ade80] rounded-full border-[3px] border-gray-900 flex items-center justify-center text-xl font-black text-gray-900 shadow-[2px_2px_0_0_#1f2937] z-10">3</div>
                    <div class="bg-[#FFFDF8] rounded-2xl p-6 border-[3px] border-gray-900 h-full pt-10">
                        <h3 class="text-xl font-black mb-2">Convert</h3>
                        <p class="text-gray-700 font-medium">Click generate to get your high-quality {currentFormat.fullName} image instantly.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Best Practices Section -->
        <section class="mb-16 bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-transform duration-300">
            <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 bg-[#ff6b6b] rounded-xl border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 class="text-3xl font-black text-gray-900">Best Practices</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-2 h-2 mt-2.5 rounded-full bg-gray-900 flex-shrink-0"></div>
                    <p class="text-lg font-medium text-gray-700">Optimize HTML design for {currentFormat.bestFor}</p>
                </div>
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-2 h-2 mt-2.5 rounded-full bg-gray-900 flex-shrink-0"></div>
                    <p class="text-lg font-medium text-gray-700">Consider final dimensions for layout</p>
                </div>
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-2 h-2 mt-2.5 rounded-full bg-gray-900 flex-shrink-0"></div>
                    <p class="text-lg font-medium text-gray-700">Test across different devices</p>
                </div>
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-2 h-2 mt-2.5 rounded-full bg-gray-900 flex-shrink-0"></div>
                    <p class="text-lg font-medium text-gray-700">Use appropriate compression settings</p>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="mb-16 bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937]">
            <h2 class="text-3xl font-black mb-8 text-gray-900">Frequently Asked Questions</h2>
            <div class="space-y-4">
                <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
                    <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
                        <span>How does the image conversion work?</span>
                        <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
                        Our converter renders your HTML code in a virtual browser environment and captures the output as a high-quality {format.toUpperCase()} image. This process ensures that your HTML is accurately represented in the final image.
                    </div>
                </details>

                <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
                    <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
                        <span>Can I convert HTML with external resources?</span>
                        <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
                        Yes, our converter supports HTML with external resources such as images and stylesheets. However, for the best results and fastest conversion, we recommend using inline styles and data URIs for images when possible.
                    </div>
                </details>

                <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
                    <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
                        <span>What's the maximum file size?</span>
                        <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
                        Our free tool supports HTML files up to 5MB in size. For larger files or batch conversions, consider upgrading to our premium plan or API service.
                    </div>
                </details>

                <details class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937]">
                    <summary class="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 select-none">
                        <span>Is my HTML code kept private?</span>
                        <svg class="w-6 h-6 text-gray-900 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div class="px-6 pb-6 pt-0 text-gray-700 font-medium leading-relaxed border-t-2 border-gray-100 mt-4">
                        Yes, we take your privacy seriously. Your HTML code is processed in real-time and is not stored on our servers. Once the conversion is complete, all data is immediately deleted.
                    </div>
                </details>
            </div>
        </section>

        <!-- Why Choose Section -->
        <section class="mb-16 bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937]">
            <h2 class="text-3xl font-black mb-8 text-gray-900">Why Choose Our Tool?</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gray-50 rounded-2xl p-6 border-[3px] border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-12 h-12 bg-[#ffc480] rounded-xl border-2 border-gray-900 flex items-center justify-center mb-4 shadow-[2px_2px_0_0_#1f2937]">
                        <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Lightning Fast</h3>
                    <p class="text-gray-700 font-medium">Get your {currentFormat.fullName} images in seconds with our optimized processing.</p>
                </div>
                <div class="bg-gray-50 rounded-2xl p-6 border-[3px] border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-12 h-12 bg-[#ff6b6b] rounded-xl border-2 border-gray-900 flex items-center justify-center mb-4 shadow-[2px_2px_0_0_#1f2937]">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Secure & Private</h3>
                    <p class="text-gray-700 font-medium">Your data is processed securely and never stored on our servers.</p>
                </div>
                <div class="bg-gray-50 rounded-2xl p-6 border-[3px] border-gray-200 hover:border-gray-900 transition-colors">
                    <div class="w-12 h-12 bg-[#4ade80] rounded-xl border-2 border-gray-900 flex items-center justify-center mb-4 shadow-[2px_2px_0_0_#1f2937]">
                        <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">High Quality</h3>
                    <p class="text-gray-700 font-medium">Pixel-perfect rendering ensures your images look exactly as intended.</p>
                </div>
            </div>
        </section>

        <!-- Technical Details Section -->
        <section class="mb-16 bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937]">
            <h2 class="text-3xl font-black mb-8 text-gray-900">Technical Specs</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex items-start gap-4 p-4 border-b-2 border-gray-100">
                    <span class="font-bold text-gray-900 w-32 flex-shrink-0">Process</span>
                    <span class="text-gray-700 font-medium">Headless browser rendering for pixel-perfect results</span>
                </div>
                <div class="flex items-start gap-4 p-4 border-b-2 border-gray-100">
                    <span class="font-bold text-gray-900 w-32 flex-shrink-0">Quality</span>
                    <span class="text-gray-700 font-medium">96 DPI with optimized compression</span>
                </div>
                <div class="flex items-start gap-4 p-4 border-b-2 border-gray-100">
                    <span class="font-bold text-gray-900 w-32 flex-shrink-0">Features</span>
                    <span class="text-gray-700 font-medium">CSS3, JavaScript, Web Fonts, Custom Dimensions</span>
                </div>
                <div class="flex items-start gap-4 p-4 border-b-2 border-gray-100">
                    <span class="font-bold text-gray-900 w-32 flex-shrink-0">Speed</span>
                    <span class="text-gray-700 font-medium">Average conversion &lt; 5 seconds</span>
                </div>
            </div>
        </section>

        <!-- API Prompt Section -->
        <section class="mb-16">
            <ApiPromptSection
                title={`Ship HTML → ${currentFormat.fullName} via API`}
                description="Render marketing visuals, invoices, or personalized content at scale without managing browsers or queues."
                featurePoints={apiFeatureBullets}
                codeLanguage="bash"
                codeSnippet={apiSnippetTemplate
                    .replace('WIDTH_PLACEHOLDER', (hasSize ? dimWidth : previewWidth) || 1200)
                    .replace('HEIGHT_PLACEHOLDER', (hasSize ? dimHeight : previewHeight) || 630)
                    .replace('FORMAT_PLACEHOLDER', format)}
                docsUrl="https://docs.pictify.io"
                docsLabel="View HTML → Image API docs"
                secondaryCtaUrl="/dashboard/api-playground"
                secondaryCtaLabel="Open API Playground"
                note="Talk to sales for dedicated regions, SLAs, or volume pricing."
            />
        </section>

        <!-- Related OG Image Workflows -->
        <div class="bg-white rounded-3xl border-[3px] border-gray-900 p-8 shadow-[8px_8px_0_0_#1f2937]">
            <h2 class="text-3xl font-black text-gray-900 mb-8">Need social previews?</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {#each featuredPlatforms as platform}
                    <a href={`/tools/og-image-generator/${platform.id}`} class="group block h-full">
                        <div class="bg-gray-50 rounded-2xl p-6 border-[3px] border-gray-200 h-full transition-all group-hover:border-gray-900 group-hover:bg-white group-hover:shadow-[4px_4px_0_0_#1f2937] group-hover:-translate-y-1">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">{platform.label}</h3>
                            <p class="text-gray-600 font-medium group-hover:text-gray-700">Design branded OG images tailored for {platform.label} in a few clicks.</p>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </div>

    <Toast />
    <Footer />
</main>
</section>

<style>
:global(body) {
    background-color: #FFFDF8;
}

@keyframes loading {
    0% { width: 0%; }
    100% { width: 100%; }
}
</style>

<!-- Add IDs for schema steps -->
<section id="input">
<!-- Input section content -->
</section>

<section id="preview">
<!-- Preview section content -->
</section>

<section id="generate">
<!-- Generate section content -->
</section>