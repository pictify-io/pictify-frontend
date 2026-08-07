// =============================================================================
// INTEGRATIONS - for /integrations/[slug] pages
// =============================================================================
export const integrationCategories = [
	{
		id: 'automation',
		label: 'Automation',
		description: 'Connect Pictify to your automation workflows'
	},
	{
		id: 'cms',
		label: 'CMS Platforms',
		description: 'Add dynamic images to your content management system'
	},
	{
		id: 'ecommerce',
		label: 'E-Commerce',
		description: 'Generate product images and social cards for your store'
	}
];

export const integrations = [
	{
		slug: 'zapier',
		name: 'Zapier',
		category: 'automation',
		description: 'Connect Pictify to 5,000+ apps without code using Zapier automations.',
		longDescription:
			'Zapier integration enables you to generate images automatically when events happen in other apps. Create OG images when a blog post is published, generate certificates when a course is completed, or produce social cards when a new product is added—all without writing code.',
		features: [
			'Trigger-based image generation',
			'Multi-step Zaps support',
			'Template variable mapping',
			'Webhook delivery'
		],
		useCases: [
			'Auto-generate OG images for new blog posts',
			'Create certificates on course completion',
			'Generate social cards from CRM data'
		],
		docsUrl: 'https://docs.pictify.io/quickstart',
		icon: 'zapier',
		tutorial: {
			title: 'How to Connect Pictify with Zapier',
			estimatedTime: '10 minutes',
			prerequisites: [
				'A Pictify account with an API key',
				'A Zapier account (free tier works)',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Get Your Pictify API Key',
					description:
						'Log into your Pictify dashboard and navigate to Settings → API Keys. Click "Create New Key" and copy it somewhere safe.',
					code: null,
					tip: 'Keep your API key secret. Never expose it in client-side code.'
				},
				{
					title: 'Create a New Zap in Zapier',
					description:
						'Go to zapier.com and click "Create Zap". Choose your trigger app (e.g., Google Sheets, Airtable, Notion) and set up the trigger event.',
					code: null,
					tip: 'For testing, use "New Row in Google Sheets" as a simple trigger.'
				},
				{
					title: 'Add Webhooks by Zapier as Action',
					description:
						'For the action step, search for "Webhooks by Zapier" and select "POST" as the action event.',
					code: null,
					tip: null
				},
				{
					title: 'Configure the Webhook Request',
					description:
						"Set up the webhook with Pictify's render endpoint. Use your template ID and map variables from your trigger.",
					code: `URL: https://api.pictify.io/v1/render

Headers:
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

Body (JSON):
{
  "templateId": "your-template-id",
  "variables": {
    "title": "{{trigger_title}}",
    "subtitle": "{{trigger_subtitle}}",
    "image": "{{trigger_image_url}}"
  },
  "format": "png"
}`,
					tip: "Use Zapier's variable picker to map fields from your trigger to template variables."
				},
				{
					title: 'Test Your Zap',
					description:
						'Click "Test step" to send a test request. Pictify will return a URL to your generated image.',
					code: `// Success Response
{
  "success": true,
  "imageUrl": "https://cdn.pictify.io/renders/abc123.png",
  "renderTime": 1.2
}`,
					tip: null
				},
				{
					title: 'Use the Generated Image',
					description:
						'Add another action step to use the image URL. You can save it to Google Drive, post to Slack, update a CMS, or send via email.',
					code: null,
					tip: 'The imageUrl from step 5 is available as a variable in subsequent Zap steps.'
				}
			],
			troubleshooting: [
				{
					issue: '401 Unauthorized',
					solution:
						'Check that your API key is correct and has not expired. Ensure the Authorization header format is "Bearer YOUR_KEY".'
				},
				{
					issue: 'Template not found',
					solution:
						'Verify the templateId exists in your Pictify dashboard. Template IDs are case-sensitive.'
				},
				{
					issue: 'Missing variables',
					solution: 'Ensure all required template variables are included in your request body.'
				}
			]
		}
	},
	{
		slug: 'make',
		name: 'Make (Integromat)',
		category: 'automation',
		description: 'Build advanced visual automation workflows with Make scenarios.',
		longDescription:
			'Make (formerly Integromat) provides powerful visual automation with advanced features like iterators, routers, and complex data mapping. Perfect for sophisticated image generation workflows that require conditional logic or multi-branch processing.',
		features: [
			'Visual scenario builder',
			'Advanced data mapping',
			'Error handling',
			'Scheduled operations'
		],
		useCases: [
			'Batch generate images from spreadsheets',
			'Multi-variant A/B test images',
			'Complex conditional image generation'
		],
		docsUrl: 'https://docs.pictify.io/quickstart',
		icon: 'make',
		tutorial: {
			title: 'How to Generate Images with Make (Integromat)',
			estimatedTime: '15 minutes',
			prerequisites: [
				'A Pictify account with an API key',
				'A Make account',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Create a New Scenario',
					description:
						'Log into Make and click "Create a new scenario". This will be your automation workflow.',
					code: null,
					tip: null
				},
				{
					title: 'Add a Trigger Module',
					description:
						'Click the "+" button and add your trigger. For example, use Google Sheets "Watch Rows" to trigger when new data is added.',
					code: null,
					tip: "Make's iterator module is perfect for batch processing multiple rows at once."
				},
				{
					title: 'Add HTTP Module',
					description:
						'Click "+" after your trigger and search for "HTTP". Select "Make a request" to call the Pictify API.',
					code: null,
					tip: null
				},
				{
					title: 'Configure HTTP Request',
					description:
						"Set up the HTTP module to call Pictify's render endpoint with your template and variables.",
					code: `URL: https://api.pictify.io/v1/render
Method: POST

Headers:
- Authorization: Bearer YOUR_API_KEY
- Content-Type: application/json

Body type: Raw
Content type: JSON (application/json)

Request content:
{
  "templateId": "your-template-id",
  "variables": {
    "title": "{{1.title}}",
    "description": "{{1.description}}",
    "price": "{{1.price}}"
  },
  "format": "png",
  "width": 1200,
  "height": 630
}`,
					tip: "Use Make's variable picker (the small icon) to map data from previous modules."
				},
				{
					title: 'Parse the JSON Response',
					description:
						'Add a "JSON > Parse JSON" module after the HTTP module to extract the image URL from Pictify\'s response.',
					code: `// Pictify returns:
{
  "success": true,
  "imageUrl": "https://cdn.pictify.io/renders/xyz789.png",
  "width": 1200,
  "height": 630
}

// Map the response body to the JSON module's "JSON string" field`,
					tip: null
				},
				{
					title: 'Use the Generated Image',
					description:
						'Add destination modules to use your image. Save to Google Drive, update Airtable, post to social media, or send notifications.',
					code: null,
					tip: 'Use a Router module to send the image to multiple destinations simultaneously.'
				},
				{
					title: 'Enable Scheduling (Optional)',
					description:
						'Click the clock icon on your trigger to run the scenario on a schedule—every hour, daily, or when data changes.',
					code: null,
					tip: 'Start with manual runs while testing, then enable scheduling once everything works.'
				}
			],
			troubleshooting: [
				{
					issue: 'Connection timeout',
					solution:
						'Image generation can take a few seconds. Increase the HTTP module timeout to 60 seconds.'
				},
				{
					issue: 'Invalid JSON error',
					solution: "Ensure your request body is valid JSON. Use Make's built-in JSON validator."
				},
				{
					issue: 'Rate limit exceeded',
					solution:
						'Add a Sleep module between iterations when batch processing to avoid hitting rate limits.'
				}
			]
		}
	},
	{
		slug: 'n8n',
		name: 'n8n',
		category: 'automation',
		description: 'Self-hosted workflow automation with full control and privacy.',
		longDescription:
			'n8n is an open-source, self-hostable workflow automation tool. For teams that need to keep data on-premise or want maximum customization, n8n with Pictify provides powerful image generation while maintaining full control over your infrastructure.',
		features: ['Self-hosted option', 'Open source', 'Custom nodes support', 'Full data control'],
		useCases: [
			'On-premise image generation',
			'Custom workflow logic',
			'Privacy-sensitive applications'
		],
		docsUrl: 'https://docs.pictify.io/quickstart',
		icon: 'n8n',
		tutorial: {
			title: 'How to Use Pictify with n8n',
			estimatedTime: '15 minutes',
			prerequisites: [
				'A Pictify account with an API key',
				'n8n installed (cloud or self-hosted)',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Store Your API Key as a Credential',
					description:
						'In n8n, go to Settings → Credentials → Add Credential. Create a "Header Auth" credential with your Pictify API key.',
					code: `Name: Pictify API
Header Auth:
  Name: Authorization
  Value: Bearer YOUR_API_KEY`,
					tip: 'Using credentials keeps your API key secure and reusable across workflows.'
				},
				{
					title: 'Create a New Workflow',
					description:
						'Click "New Workflow" in n8n. Add a trigger node—use Manual Trigger for testing or Webhook/Schedule for production.',
					code: null,
					tip: null
				},
				{
					title: 'Add an HTTP Request Node',
					description:
						'Add an "HTTP Request" node and connect it to your trigger. This will call the Pictify API.',
					code: null,
					tip: null
				},
				{
					title: 'Configure the HTTP Request',
					description:
						"Set up the node to POST to Pictify's render endpoint with your template configuration.",
					code: `Method: POST
URL: https://api.pictify.io/v1/render

Authentication: Predefined Credential Type
Credential Type: Header Auth
Credential: Pictify API (created in step 1)

Send Headers: ON
Header Parameters:
  Content-Type: application/json

Send Body: ON
Body Content Type: JSON
Specify Body: Using Fields Below

Body Parameters:
  templateId: your-template-id
  format: png
  variables: {
    "title": "{{ $json.title }}",
    "subtitle": "{{ $json.subtitle }}"
  }`,
					tip: 'Use n8n expressions like {{ $json.fieldName }} to map data from previous nodes.'
				},
				{
					title: 'Test the Workflow',
					description:
						'Click "Execute Workflow" to run a test. The HTTP node output will contain the generated image URL.',
					code: `// Success output from HTTP node:
{
  "success": true,
  "imageUrl": "https://cdn.pictify.io/renders/abc123.png",
  "renderTime": 1.5
}`,
					tip: null
				},
				{
					title: 'Process the Response',
					description:
						'Add subsequent nodes to use the image URL. Common options: save to disk, upload to S3, update database, or send notification.',
					code: `// Access the image URL in subsequent nodes:
{{ $json.imageUrl }}

// Example: Download the image with another HTTP node
Method: GET
URL: {{ $json.imageUrl }}
Response Format: File`,
					tip: null
				},
				{
					title: 'Batch Processing with Loop',
					description:
						'For generating multiple images, use the SplitInBatches node to process items one at a time and avoid rate limits.',
					code: `// Workflow structure for batch:
Trigger → Get Data → SplitInBatches → HTTP Request (Pictify) → Merge → Save Results

// SplitInBatches settings:
Batch Size: 1
Options: Add pause between batches (1 second)`,
					tip: 'The SplitInBatches node is essential for processing arrays without overwhelming the API.'
				}
			],
			troubleshooting: [
				{
					issue: 'ECONNREFUSED errors',
					solution:
						'If self-hosted, ensure your n8n instance can reach external APIs. Check firewall and proxy settings.'
				},
				{
					issue: 'Expression not working',
					solution:
						'Use the expression editor to verify your expressions. Make sure the data exists in the input.'
				},
				{
					issue: 'Workflow stops on error',
					solution:
						'Enable "Continue On Fail" in the HTTP node settings to handle errors gracefully.'
				}
			]
		}
	},
	{
		slug: 'wordpress',
		name: 'WordPress',
		category: 'cms',
		description: 'Auto-generate featured images and OG graphics for WordPress.',
		longDescription:
			'The Pictify WordPress plugin automatically generates featured images and Open Graph graphics for your posts and pages. Define templates once, and every new post gets a professional social image automatically.',
		features: [
			'Auto-generate on publish',
			'Gutenberg block',
			'Custom field support',
			'Multisite compatible'
		],
		useCases: [
			'Auto OG images for blog posts',
			'Featured image generation',
			'WooCommerce product images'
		],
		docsUrl: 'https://docs.pictify.io/quickstart',
		icon: 'wordpress',
		tutorial: {
			title: 'Auto-Generate OG Images in WordPress',
			estimatedTime: '15 minutes',
			prerequisites: [
				'WordPress 5.9 or higher',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the Pictify Plugin',
					description:
						'Download and install the official Pictify plugin from the WordPress plugin directory.',
					code: `1. Go to Plugins → Add New in your WordPress admin
2. Search for "Pictify"
3. Click "Install Now" then "Activate"

// Or install manually:
// Download from https://wordpress.org/plugins/pictify
// Upload to /wp-content/plugins/
// Activate in the Plugins menu`,
					tip: null
				},
				{
					title: 'Configure API Settings',
					description: 'Add your Pictify API key and configure default settings.',
					code: `1. Go to Settings → Pictify in WordPress admin
2. Enter your API Key from the Pictify dashboard
3. Select your default template for OG images
4. Configure default settings:
   - Auto-generate on publish: Yes
   - Image format: PNG
   - Set as featured image: Optional
5. Click "Save Changes"`,
					tip: 'Test the connection by clicking "Verify API Key" before saving.'
				},
				{
					title: 'Map Template Variables',
					description: 'Configure which WordPress fields map to your template variables.',
					code: `In Settings → Pictify → Variable Mapping:

Template Variable    →    WordPress Field
─────────────────────────────────────────
title               →    Post Title
description         →    Excerpt (or Meta Description)
author              →    Author Display Name
date                →    Publish Date
category            →    Primary Category
featured_image      →    Featured Image URL
site_name           →    Site Title

// For custom fields (ACF, etc.):
custom_field        →    acf_field_name`,
					tip: 'Use the "Preview" button to see how your template looks with actual post data.'
				},
				{
					title: 'Configure Post Types',
					description: 'Choose which post types should auto-generate OG images.',
					code: `In Settings → Pictify → Post Types:

☑ Posts              - Auto-generate for blog posts
☑ Pages              - Auto-generate for pages
☐ Products           - Optional: WooCommerce products
☐ Custom Post Types  - Select which CPTs to include

// Per-template settings:
Posts → Use template: "blog-og-image"
Pages → Use template: "page-og-image"
Products → Use template: "product-card"`,
					tip: 'You can assign different templates to different post types.'
				},
				{
					title: 'Use the Gutenberg Block (Optional)',
					description: 'Manually insert OG images anywhere in your content.',
					code: `1. Edit any post or page
2. Click the "+" block inserter
3. Search for "Pictify Image"
4. Add the block to your content
5. Configure the block:
   - Select template
   - Override variables if needed
   - Choose display size

// The block generates a live preview in the editor
// and outputs an optimized image on the frontend`,
					tip: 'Great for adding social share cards within your content.'
				},
				{
					title: 'Test and Verify',
					description: 'Publish a post and verify the OG image is generated correctly.',
					code: `1. Create or edit a post
2. Fill in title, excerpt, and other mapped fields
3. Click "Publish" or "Update"
4. Check the post meta box for "Pictify OG Image"
5. You should see the generated image URL

// Verify with social debuggers:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/`,
					tip: "If the image doesn't appear immediately, wait 30 seconds and refresh."
				},
				{
					title: 'Bulk Generate for Existing Posts',
					description: 'Generate OG images for posts published before installing the plugin.',
					code: `Go to Tools → Pictify Bulk Generate:

1. Select post types to process
2. Choose whether to:
   - Skip posts with existing OG images
   - Regenerate all images
3. Set batch size (10-50 recommended)
4. Click "Start Bulk Generation"

// Progress will show:
// Processing: 45/230 posts
// Generated: 42 | Skipped: 3 | Failed: 0

// For large sites, run during low-traffic hours`,
					tip: 'Schedule bulk generation for off-peak hours to avoid impacting site performance.'
				}
			],
			troubleshooting: [
				{
					issue: 'Images not generating on publish',
					solution:
						'Check that auto-generate is enabled and your API key is valid. View the Pictify error log in Tools → Pictify → Logs.'
				},
				{
					issue: 'Wrong image showing on social media',
					solution:
						'Social platforms cache images. Use their debug tools to clear the cache and re-fetch.'
				},
				{
					issue: 'Plugin conflicts',
					solution:
						"Disable other SEO plugins' OG image features (Yoast, RankMath) to avoid conflicts."
				}
			]
		}
	},
	{
		slug: 'shopify',
		name: 'Shopify',
		category: 'ecommerce',
		description: 'Generate product images, social cards, and promo graphics for Shopify.',
		longDescription:
			'The Pictify Shopify integration helps store owners automate product image generation, create consistent social cards for product shares, and generate promotional graphics for sales and campaigns.',
		features: [
			'Product webhook integration',
			'Liquid template support',
			'Metafield storage',
			'App embed blocks'
		],
		useCases: ['Product social cards', 'Sale promo graphics', 'Dynamic product badges'],
		docsUrl: 'https://docs.pictify.io/quickstart',
		icon: 'shopify',
		tutorial: {
			title: 'Auto-Generate Product Images for Shopify',
			estimatedTime: '20 minutes',
			prerequisites: [
				'Shopify store (any plan)',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Create Metafield for Generated Images',
					description: 'Add a metafield to products to store the generated image URL.',
					code: `1. Go to Shopify Admin → Settings → Custom data
2. Click "Products" under Metafield definitions
3. Click "Add definition"
4. Configure:
   - Name: Generated OG Image
   - Namespace and key: custom.og_image
   - Type: URL
5. Save

// This metafield will store the Pictify-generated image URL`,
					tip: 'Use a consistent namespace (like "custom" or "pictify") for all your metafields.'
				},
				{
					title: 'Set Up Webhook in Shopify',
					description: 'Create a webhook that fires when products are created or updated.',
					code: `1. Go to Shopify Admin → Settings → Notifications
2. Scroll to "Webhooks" section
3. Click "Create webhook"
4. Configure:
   - Event: "Product creation" (add another for "Product update")
   - Format: JSON
   - URL: https://api.pictify.io/webhooks/shopify/YOUR_WEBHOOK_ID
5. Click "Save"

// Get your Webhook ID from:
// Pictify Dashboard → Integrations → Webhooks → Create Webhook`,
					tip: 'Create separate webhooks for "Product creation" and "Product update" events.'
				},
				{
					title: 'Configure Pictify Webhook',
					description: 'Set up variable mapping to use Shopify product data in your template.',
					code: `In Pictify Dashboard → Webhooks → Configure:

// Shopify sends this product payload:
{
  "id": 123456789,
  "title": "Classic T-Shirt",
  "body_html": "<p>Product description</p>",
  "vendor": "Your Brand",
  "product_type": "Apparel",
  "handle": "classic-t-shirt",
  "images": [
    { "src": "https://cdn.shopify.com/..." }
  ],
  "variants": [
    { "price": "29.99", "compare_at_price": "39.99" }
  ]
}

// Map to template variables:
title       → title
description → body_html (will strip HTML)
price       → variants[0].price
sale_price  → variants[0].compare_at_price
image       → images[0].src
brand       → vendor`,
					tip: null
				},
				{
					title: 'Enable Metafield Update',
					description: 'Configure Pictify to write the generated image back to Shopify.',
					code: `In Pictify webhook settings → Response Action:

1. Enable "Update Source System"
2. Platform: Shopify
3. Enter Shopify credentials:
   - Store URL: your-store.myshopify.com
   - Admin API Access Token: (see below)

4. Configure update:
   - Resource: Product Metafield
   - Namespace: custom
   - Key: og_image
   - Value: {{imageUrl}}

// To get Admin API Access Token:
1. Shopify Admin → Apps → Develop apps
2. Create or select an app
3. Configure Admin API scopes:
   - read_products, write_products
4. Install app and copy the token`,
					tip: 'Store API tokens securely. Never expose them in client-side code.'
				},
				{
					title: 'Update Theme to Use OG Image',
					description: 'Modify your Shopify theme to use the generated image for social sharing.',
					code: `Edit theme file: theme.liquid or product.liquid

Find the <head> section and add/modify OG tags:

{% if product.metafields.custom.og_image %}
  <meta property="og:image" content="{{ product.metafields.custom.og_image }}" />
{% elsif product.featured_image %}
  <meta property="og:image" content="{{ product.featured_image | image_url: width: 1200 }}" />
{% endif %}
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
{% if product.metafields.custom.og_image %}
  <meta name="twitter:image" content="{{ product.metafields.custom.og_image }}" />
{% endif %}

// Save and preview changes before publishing`,
					tip: "Use Shopify's theme editor preview to test before going live."
				},
				{
					title: 'Alternative: Use Shopify Flow',
					description: 'For Shopify Plus stores, use Flow for more control.',
					code: `1. Go to Shopify Admin → Apps → Flow
2. Create new workflow
3. Trigger: "Product created"
4. Add Action: "Send HTTP request"
   - Method: POST
   - URL: https://api.pictify.io/v1/render
   - Headers:
     Authorization: Bearer YOUR_PICTIFY_API_KEY
     Content-Type: application/json
   - Body:
     {
       "templateId": "your-template-id",
       "variables": {
         "title": "{{ product.title }}",
         "price": "{{ product.variants[0].price }}",
         "image": "{{ product.featured_image.src }}"
       }
     }

5. Add Action: "Update product metafield"
   - Use the imageUrl from the previous step`,
					tip: 'Shopify Flow is available on Shopify Plus plans only.'
				},
				{
					title: 'Bulk Generate for Existing Products',
					description: 'Generate images for products that existed before the integration.',
					code: `// Option 1: Use Pictify's bulk generator
1. Go to Pictify Dashboard → Bulk Generate
2. Select "Shopify" as source
3. Connect your store
4. Select products to process
5. Choose your template
6. Click "Generate All"

// Option 2: Use a script (requires coding)
// Export products from Shopify as CSV
// Process with Pictify API
// Import metafields back to Shopify

// Option 3: Use Matrixify app
// Export products → Add to spreadsheet →
// Generate images → Import with metafields`,
					tip: 'Process in batches of 50-100 to avoid rate limits.'
				},
				{
					title: 'Test the Integration',
					description: 'Create a test product and verify the image is generated.',
					code: `1. Create a new product in Shopify
2. Add title, description, price, and image
3. Save the product
4. Wait 30-60 seconds
5. Check the product metafields:
   - Product → Metafields → custom.og_image
6. Share the product URL on social media to verify

// Debug tools:
- Facebook: developers.facebook.com/tools/debug/
- Twitter: cards-dev.twitter.com/validator
- LinkedIn: linkedin.com/post-inspector/`,
					tip: "Check Pictify webhook logs if the image doesn't appear."
				}
			],
			troubleshooting: [
				{
					issue: 'Webhook not receiving events',
					solution:
						'Verify the webhook URL in Shopify settings. Check that the endpoint is publicly accessible (not localhost).'
				},
				{
					issue: 'Metafield not updating',
					solution:
						"Ensure your Shopify API token has write_products scope. Check the token hasn't expired."
				},
				{
					issue: 'Wrong product data in image',
					solution:
						'Check your variable mapping in Pictify. Shopify sends nested data—verify the path to each field.'
				}
			]
		}
	}
];
