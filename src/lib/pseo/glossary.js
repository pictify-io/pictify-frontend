// Glossary terms for /glossary/[term] pages

export const glossary = [
	{
		term: 'og-image',
		title: 'OG Image (Open Graph Image)',
		shortDefinition: 'The preview image shown when a link is shared on social media platforms.',
		longDefinition:
			'An OG Image (Open Graph Image) is a specific image designated to appear when a webpage is shared on social media platforms like Facebook, LinkedIn, Twitter, and messaging apps. Defined using the og:image meta tag, this image serves as a visual preview that can significantly impact click-through rates. The recommended size is 1200×630 pixels for optimal display across platforms.',
		relatedTerms: ['open-graph', 'twitter-card', 'social-preview', 'meta-tags'],
		seoKeywords: ['og image', 'open graph image', 'social media preview image', 'og:image meta tag']
	},
	{
		term: 'open-graph',
		title: 'Open Graph Protocol',
		shortDefinition: 'A protocol that enables web pages to become rich objects in a social graph.',
		longDefinition:
			'The Open Graph protocol, originally created by Facebook, enables any web page to become a rich object in a social graph. It uses meta tags in the HTML head to define properties like title, description, image, and URL. When someone shares your link, these tags determine what preview appears. The protocol is now supported by most major platforms including LinkedIn, Twitter, Pinterest, and messaging apps.',
		relatedTerms: ['og-image', 'meta-tags', 'social-preview', 'structured-data'],
		seoKeywords: [
			'open graph protocol',
			'og meta tags',
			'facebook open graph',
			'social sharing protocol'
		]
	},
	{
		term: 'twitter-card',
		title: 'Twitter Card',
		shortDefinition:
			'Rich media attachments that enhance tweets with images, videos, or summaries.',
		longDefinition:
			'Twitter Cards are a way to attach rich photos, videos, and media experiences to tweets that link to your content. By adding a few lines of meta tags to your webpage, users who tweet links to your content will have a "card" added to their tweet. Card types include Summary, Summary with Large Image, App, and Player cards. The most common for websites is Summary Large Image, which displays a large, prominently featured image.',
		relatedTerms: ['og-image', 'social-preview', 'meta-tags'],
		seoKeywords: ['twitter card', 'twitter meta tags', 'twitter:image', 'summary large image card']
	},
	{
		term: 'html-to-image',
		title: 'HTML to Image Conversion',
		shortDefinition: 'The process of rendering HTML/CSS code as a static image file.',
		longDefinition:
			'HTML to Image conversion is the process of rendering HTML and CSS markup as a static image file (PNG, JPG, WebP, etc.). This is typically done using headless browsers like Chromium that can render web pages and capture screenshots. The technique is essential for generating dynamic images like social cards, certificates, receipts, and other visual content from templates.',
		relatedTerms: ['headless-rendering', 'screenshot-api', 'programmatic-image-generation'],
		seoKeywords: ['html to image', 'convert html to png', 'html to jpg', 'html rendering to image']
	},
	{
		term: 'programmatic-image-generation',
		title: 'Programmatic Image Generation',
		shortDefinition: 'Automatically creating images using code, templates, and data.',
		longDefinition:
			'Programmatic image generation is the automated creation of images using code, templates, and dynamic data. Instead of manually designing each image, you create a template with variables that get replaced with actual data at render time. This enables generating thousands of personalized images—like social cards, certificates, or product graphics—from a single template.',
		relatedTerms: [
			'api-image-generation',
			'template-variables',
			'dynamic-images',
			'batch-rendering'
		],
		seoKeywords: ['programmatic image generation', 'automated image creation', 'dynamic image api']
	},
	{
		term: 'social-preview',
		title: 'Social Preview',
		shortDefinition: 'The visual preview displayed when a URL is shared on social platforms.',
		longDefinition:
			'A social preview is the visual representation of a link when shared on social media platforms or messaging apps. It typically includes an image, title, and description. The preview is generated from Open Graph and Twitter Card meta tags in your HTML. A well-designed social preview can dramatically increase engagement and click-through rates.',
		relatedTerms: ['og-image', 'open-graph', 'twitter-card', 'link-preview'],
		seoKeywords: ['social preview', 'link preview image', 'social media preview', 'share preview']
	},
	{
		term: 'meta-tags',
		title: 'Meta Tags',
		shortDefinition: 'HTML elements that provide metadata about a webpage.',
		longDefinition:
			"Meta tags are HTML elements placed in the head section of a webpage that provide metadata about the page. For social sharing, the most important are Open Graph tags (og:title, og:description, og:image) and Twitter Card tags (twitter:card, twitter:image). These tags don't affect how the page looks but determine how it appears when shared externally.",
		relatedTerms: ['open-graph', 'twitter-card', 'structured-data', 'seo'],
		seoKeywords: ['meta tags', 'og meta tags', 'twitter meta tags', 'html meta tags']
	},
	{
		term: 'structured-data',
		title: 'Structured Data',
		shortDefinition:
			'Standardized format for providing information about a page to search engines.',
		longDefinition:
			'Structured data is a standardized format (typically JSON-LD) for providing explicit information about a page to search engines. It helps search engines understand your content and can enable rich results in search—like star ratings, FAQs, how-to steps, and more. Schema.org provides the vocabulary for most structured data on the web.',
		relatedTerms: ['meta-tags', 'schema-org', 'rich-results', 'seo'],
		seoKeywords: ['structured data', 'json-ld', 'schema markup', 'rich snippets']
	},
	{
		term: 'cdn',
		title: 'CDN (Content Delivery Network)',
		shortDefinition:
			'A distributed network of servers that delivers content with high availability and performance.',
		longDefinition:
			'A Content Delivery Network (CDN) is a geographically distributed network of servers that work together to deliver content quickly to users based on their location. For image generation services, CDN hosting means your generated images are cached and served from edge servers worldwide, resulting in faster load times and better reliability.',
		relatedTerms: ['image-optimization', 'caching', 'edge-computing'],
		seoKeywords: ['cdn', 'content delivery network', 'image cdn', 'cdn hosting']
	},
	{
		term: 'image-optimization',
		title: 'Image Optimization',
		shortDefinition:
			'The process of reducing image file size while maintaining acceptable quality.',
		longDefinition:
			'Image optimization involves reducing the file size of images while maintaining acceptable visual quality. This includes choosing the right format (WebP for web, PNG for transparency, JPG for photos), compression, resizing, and lazy loading. Optimized images improve page load times, reduce bandwidth costs, and enhance user experience.',
		relatedTerms: ['cdn', 'webp', 'compression', 'lazy-loading'],
		seoKeywords: [
			'image optimization',
			'compress images',
			'optimize images for web',
			'image compression'
		]
	},
	{
		term: 'api-image-generation',
		title: 'API Image Generation',
		shortDefinition: 'Creating images programmatically through REST API calls.',
		longDefinition:
			'API image generation is the process of creating images by making HTTP requests to an image generation API. You send parameters like HTML content, dimensions, and format, and receive an image URL or binary data in response. This enables automated workflows where images are generated on-demand without manual intervention.',
		relatedTerms: ['programmatic-image-generation', 'rest-api', 'automation'],
		seoKeywords: [
			'image generation api',
			'generate images via api',
			'image api',
			'automated image generation'
		]
	},
	{
		term: 'template-variables',
		title: 'Template Variables',
		shortDefinition: 'Placeholders in templates that get replaced with dynamic data.',
		longDefinition:
			'Template variables are placeholders (like {{name}} or {{price}}) within a template that get replaced with actual data at render time. They enable creating one template that can generate infinite variations—each certificate with a different name, each product card with different pricing, each OG image with different titles.',
		relatedTerms: ['dynamic-images', 'programmatic-image-generation', 'templating'],
		seoKeywords: ['template variables', 'dynamic templates', 'image template placeholders']
	},
	{
		term: 'dynamic-images',
		title: 'Dynamic Images',
		shortDefinition: 'Images generated on-the-fly with personalized or real-time content.',
		longDefinition:
			"Dynamic images are images generated on-the-fly based on parameters passed at request time. Unlike static images stored on a server, dynamic images are created in real-time with personalized content—a user's name, current data, or contextual information. This enables personalization at scale without pre-generating every possible variation.",
		relatedTerms: ['template-variables', 'programmatic-image-generation', 'on-demand-rendering'],
		seoKeywords: ['dynamic images', 'personalized images', 'on-demand image generation']
	},
	{
		term: 'headless-rendering',
		title: 'Headless Rendering',
		shortDefinition: 'Running a browser without a visible UI to render web content.',
		longDefinition:
			'Headless rendering involves running a web browser (like Chrome or Firefox) without a graphical user interface. The browser still fully renders HTML, CSS, and JavaScript, but outputs to memory instead of a screen. This is how HTML to image services work—they load your HTML in a headless browser and capture the rendered result as an image.',
		relatedTerms: ['html-to-image', 'screenshot-api', 'puppeteer', 'chromium'],
		seoKeywords: [
			'headless browser',
			'headless rendering',
			'headless chrome',
			'puppeteer rendering'
		]
	},
	{
		term: 'screenshot-api',
		title: 'Screenshot API',
		shortDefinition: 'An API service that captures screenshots of web pages or HTML content.',
		longDefinition:
			'A Screenshot API is a web service that captures visual screenshots of websites, URLs, or HTML content. You provide a URL or HTML code, and the API returns an image of how it would appear in a browser. This is useful for generating page previews, archiving web content, or creating visual representations of dynamic content.',
		relatedTerms: ['headless-rendering', 'html-to-image', 'url-to-image'],
		seoKeywords: [
			'screenshot api',
			'webpage screenshot api',
			'url to image api',
			'capture screenshot api'
		]
	},
	{
		term: 'pdf-generation',
		title: 'PDF Generation',
		shortDefinition: 'Automatically creating PDF documents from HTML templates or data.',
		longDefinition:
			'PDF generation is the automated creation of PDF documents, typically from HTML/CSS templates. Like image generation, it uses headless browsers to render content and output as PDF instead of an image. Common use cases include invoices, reports, certificates, and any document that needs a consistent, printable format.',
		relatedTerms: ['html-to-image', 'headless-rendering', 'document-generation'],
		seoKeywords: ['pdf generation', 'html to pdf', 'generate pdf api', 'automated pdf creation']
	},
	{
		term: 'gif-generation',
		title: 'GIF Generation',
		shortDefinition: 'Creating animated GIF images, often from multiple frames or video clips.',
		longDefinition:
			'GIF generation is the process of creating animated GIF images. This can involve rendering multiple HTML frames as images and combining them into an animation, converting video clips, or creating frame-by-frame animations programmatically. Animated GIFs are useful for product demos, tutorials, and eye-catching social media content.',
		relatedTerms: ['html-to-image', 'animation', 'video-to-gif'],
		seoKeywords: ['gif generation', 'create animated gif', 'gif api', 'html to gif']
	},
	{
		term: 'batch-rendering',
		title: 'Batch Rendering',
		shortDefinition: 'Processing multiple image generation requests in a single operation.',
		longDefinition:
			'Batch rendering is the process of generating multiple images in a single API call or automated job. Instead of making individual requests for each image, you provide a list of variations (different names, products, data points) and receive all generated images back. This is more efficient and cost-effective for large-scale image generation.',
		relatedTerms: ['programmatic-image-generation', 'api-image-generation', 'automation'],
		seoKeywords: ['batch image generation', 'bulk image rendering', 'batch processing images']
	},
	{
		term: 'webhook',
		title: 'Webhook',
		shortDefinition: 'An HTTP callback that sends data to a URL when an event occurs.',
		longDefinition:
			"A webhook is an HTTP callback mechanism that sends data to a specified URL when a particular event occurs. In image generation, webhooks can notify your system when an image is ready, when a batch job completes, or when an error occurs. This enables asynchronous workflows where you don't have to poll for status.",
		relatedTerms: ['api', 'automation', 'event-driven'],
		seoKeywords: ['webhook', 'http callback', 'webhook api', 'event notification']
	},
	{
		term: 'aspect-ratio',
		title: 'Aspect Ratio',
		shortDefinition: "The proportional relationship between an image's width and height.",
		longDefinition:
			"Aspect ratio is the proportional relationship between an image's width and height, expressed as two numbers separated by a colon (like 16:9 or 1:1). Different platforms prefer different aspect ratios—Instagram feed posts work best at 1:1 (square), Stories at 9:16 (vertical), and OG images at 1.91:1 (landscape). Understanding aspect ratios ensures your images display correctly across platforms.",
		relatedTerms: ['image-dimensions', 'social-media-sizes', 'responsive-images'],
		seoKeywords: ['aspect ratio', 'image aspect ratio', 'social media aspect ratio', '16:9 vs 1:1']
	},
	{
		term: 'dynamic-image-generation',
		title: 'Dynamic Image Generation',
		shortDefinition:
			'The process of creating images programmatically at runtime using templates, data, and APIs.',
		longDefinition:
			'Dynamic image generation refers to creating images on-the-fly by combining templates with variable data — such as user names, product prices, or analytics metrics. Unlike static image creation in design tools, dynamic generation happens programmatically via API calls, enabling personalization at scale. Common use cases include social media cards with dynamic titles, e-commerce product images with live pricing, personalized email headers, and automated marketing visuals. Tools like Pictify provide HTML-to-image APIs that render any HTML/CSS template as a pixel-perfect image, making dynamic generation accessible to developers without graphics programming expertise.',
		relatedTerms: [
			'api-image-generation',
			'template-variables',
			'programmatic-image-generation',
			'headless-rendering'
		],
		seoKeywords: [
			'dynamic image generation',
			'generate images dynamically',
			'dynamic image api',
			'runtime image creation',
			'programmatic image generation'
		]
	},
	{
		term: 'image-rendering-api',
		title: 'Image Rendering API',
		shortDefinition:
			'An API service that converts HTML, templates, or URLs into rendered image files.',
		longDefinition:
			'An image rendering API accepts input — typically HTML/CSS, a template with variables, or a URL — and returns a rendered image file (PNG, JPG, WebP). These APIs abstract away the complexity of running headless browsers, managing rendering infrastructure, and handling edge cases like font loading, JavaScript execution, and viewport sizing. Developers use image rendering APIs to generate OG images, social media cards, certificates, invoices, screenshots, and any other visual content that needs to be created programmatically. Key evaluation criteria include rendering fidelity, latency, supported output formats, and API ergonomics.',
		relatedTerms: ['api-image-generation', 'headless-rendering', 'screenshot-api', 'html-to-image'],
		seoKeywords: [
			'image rendering api',
			'image generation api',
			'html to image api',
			'render image from html',
			'image api service'
		]
	},
	{
		term: 'serverless-image-generation',
		title: 'Serverless Image Generation',
		shortDefinition:
			'Generating images using serverless functions or managed APIs without maintaining rendering infrastructure.',
		longDefinition:
			'Serverless image generation eliminates the need to run and maintain headless browsers, Puppeteer instances, or rendering servers. Instead of managing Chrome processes, memory limits, and concurrency on your own infrastructure, you call a managed API that handles rendering at scale. This approach reduces operational complexity, eliminates cold-start delays associated with spinning up browsers, and provides predictable per-image pricing. Pictify is an example of a serverless image generation platform — you send HTML or template data via API and receive a CDN-hosted image URL in under 200ms, with no infrastructure to manage.',
		relatedTerms: [
			'api-image-generation',
			'headless-rendering',
			'puppeteer-alternative',
			'dynamic-images'
		],
		seoKeywords: [
			'serverless image generation',
			'image generation without server',
			'managed image rendering',
			'no infrastructure image api',
			'serverless screenshot'
		]
	},
	{
		term: 'html-canvas-rendering',
		title: 'HTML Canvas Rendering',
		shortDefinition:
			'Converting HTML and CSS content into rasterized image output using browser rendering engines.',
		longDefinition:
			'HTML canvas rendering is the process of taking HTML/CSS content and converting it into a rasterized image — similar to taking a screenshot of a webpage. This can be done client-side using libraries like html2canvas (which re-implements CSS rendering on a Canvas element) or server-side using headless browsers like Puppeteer or Playwright that render HTML through a full browser engine. Server-side rendering via headless browsers produces higher fidelity output since it uses the actual Chromium rendering engine, supporting all CSS features, web fonts, and JavaScript execution. APIs like Pictify abstract this process, providing a simple endpoint that accepts HTML and returns a rendered image.',
		relatedTerms: ['html-to-image', 'headless-rendering', 'headless-browser', 'chromium'],
		seoKeywords: [
			'html canvas rendering',
			'html to canvas',
			'render html as image',
			'html2canvas alternative',
			'browser rendering to image'
		]
	},
	{
		term: 'image-cdn',
		title: 'Image CDN (Content Delivery Network)',
		shortDefinition:
			'A distributed network that hosts, optimizes, and delivers images with low latency worldwide.',
		longDefinition:
			'An image CDN is a content delivery network specialized for image hosting and delivery. It stores images across globally distributed edge servers, serving them from the location closest to the end user for minimal latency. Advanced image CDNs also provide on-the-fly transformations — resizing, format conversion (WebP, AVIF), quality adjustment, and cropping — via URL parameters. When generating images programmatically (e.g., OG images, social cards, certificates), having CDN-hosted output means the generated images are immediately available at a permanent URL with global edge caching. Pictify hosts all generated images on its CDN, providing instant availability and fast load times without additional infrastructure.',
		relatedTerms: ['cdn', 'image-optimization', 'web-performance', 'core-web-vitals'],
		seoKeywords: [
			'image cdn',
			'image delivery network',
			'cdn for images',
			'image hosting cdn',
			'global image delivery'
		]
	}
];
