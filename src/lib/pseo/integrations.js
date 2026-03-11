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
		id: 'sdk',
		label: 'SDKs & Libraries',
		description: 'Official and community libraries for popular languages'
	},
	{ id: 'framework', label: 'Frameworks', description: 'Integrate with modern web frameworks' },
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
	// Automation
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
		docsUrl: 'https://docs.pictify.io/integrations/zapier',
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
		docsUrl: 'https://docs.pictify.io/integrations/make',
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
		docsUrl: 'https://docs.pictify.io/integrations/n8n',
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
	// SDKs
	{
		slug: 'node-js',
		name: 'Node.js SDK',
		category: 'sdk',
		description: 'Official Node.js library for server-side image generation.',
		longDescription:
			'The official Pictify Node.js SDK provides a simple, typed interface for generating images from your Node.js applications. Supports both CommonJS and ES Modules, with full TypeScript definitions included.',
		features: [
			'Full TypeScript support',
			'Promise-based API',
			'Automatic retries',
			'Stream support'
		],
		useCases: [
			'Next.js API routes',
			'Express.js backends',
			'Serverless functions',
			'Build-time generation'
		],
		docsUrl: 'https://docs.pictify.io/sdks/nodejs',
		icon: 'nodejs',
		installCommand: 'npm install @pictify/sdk',
		tutorial: {
			title: 'Getting Started with the Node.js SDK',
			estimatedTime: '5 minutes',
			prerequisites: [
				'Node.js 16 or higher',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Add the Pictify SDK to your project using npm, yarn, or pnpm.',
					code: `# Using npm
npm install @pictify/sdk

# Using yarn
yarn add @pictify/sdk

# Using pnpm
pnpm add @pictify/sdk`,
					tip: null
				},
				{
					title: 'Initialize the Client',
					description:
						'Create a Pictify client instance with your API key. Store your API key in environment variables for security.',
					code: `// ES Modules
import { Pictify } from '@pictify/sdk';

// CommonJS
const { Pictify } = require('@pictify/sdk');

// Initialize the client
const pictify = new Pictify({
  apiKey: process.env.PICTIFY_API_KEY
});`,
					tip: 'Never hardcode your API key. Use environment variables or a secrets manager.'
				},
				{
					title: 'Generate Your First Image',
					description:
						'Call the render method with your template ID and variables to generate an image.',
					code: `const result = await pictify.render({
  templateId: 'your-template-id',
  variables: {
    title: 'Hello World',
    subtitle: 'Generated with Pictify',
    backgroundColor: '#667eea'
  },
  format: 'png', // or 'jpg', 'webp'
  width: 1200,
  height: 630
});

console.log('Image URL:', result.imageUrl);
// https://cdn.pictify.io/renders/abc123.png`,
					tip: "The imageUrl is permanently hosted on Pictify's CDN. No need to download and re-upload."
				},
				{
					title: 'Download Image as Buffer (Optional)',
					description: 'If you need the raw image data instead of a URL, use the download option.',
					code: `const result = await pictify.render({
  templateId: 'your-template-id',
  variables: { title: 'My Image' },
  format: 'png',
  download: true // Returns buffer instead of URL
});

// Save to file
import fs from 'fs';
fs.writeFileSync('output.png', result.buffer);

// Or use with streams
const stream = await pictify.renderStream({
  templateId: 'your-template-id',
  variables: { title: 'Streamed Image' }
});
stream.pipe(fs.createWriteStream('streamed.png'));`,
					tip: null
				},
				{
					title: 'Batch Rendering',
					description: 'Generate multiple images efficiently with a single API call.',
					code: `const items = [
  { title: 'Image 1', color: '#ff6b6b' },
  { title: 'Image 2', color: '#4ecdc4' },
  { title: 'Image 3', color: '#667eea' }
];

const results = await pictify.renderBatch({
  templateId: 'your-template-id',
  items: items.map(item => ({
    variables: item
  }))
});

results.forEach((result, i) => {
  console.log(\`Image \${i + 1}: \${result.imageUrl}\`);
});`,
					tip: 'Batch rendering is faster and more efficient than multiple individual requests.'
				},
				{
					title: 'Error Handling',
					description: "Handle errors gracefully with try/catch and the SDK's error types.",
					code: `import { Pictify, PictifyError } from '@pictify/sdk';

try {
  const result = await pictify.render({
    templateId: 'your-template-id',
    variables: { title: 'Test' }
  });
} catch (error) {
  if (error instanceof PictifyError) {
    console.error('Pictify error:', error.message);
    console.error('Error code:', error.code);
    // Handle specific errors
    if (error.code === 'TEMPLATE_NOT_FOUND') {
      // Template doesn't exist
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Back off and retry
    }
  } else {
    throw error; // Re-throw unexpected errors
  }
}`,
					tip: null
				}
			],
			troubleshooting: [
				{
					issue: 'Module not found error',
					solution: 'Ensure you\'re using Node.js 16+. Run "node -v" to check your version.'
				},
				{
					issue: 'API key invalid',
					solution:
						'Verify your API key in the Pictify dashboard. Check that the environment variable is set correctly.'
				},
				{
					issue: 'TypeScript errors',
					solution:
						'The SDK includes types. If you see errors, update to the latest version: npm update @pictify/sdk'
				}
			]
		}
	},
	{
		slug: 'python',
		name: 'Python SDK',
		category: 'sdk',
		description: 'Official Python library for data science and backend applications.',
		longDescription:
			'The Pictify Python SDK enables image generation from Python applications, notebooks, and scripts. Perfect for data science workflows, Django/Flask backends, and automation scripts.',
		features: ['Async support', 'Type hints', 'Pandas integration', 'Jupyter-friendly'],
		useCases: [
			'Django/Flask backends',
			'Data visualization exports',
			'Jupyter notebooks',
			'Batch scripts'
		],
		docsUrl: 'https://docs.pictify.io/sdks/python',
		icon: 'python',
		installCommand: 'pip install pictify',
		tutorial: {
			title: 'Getting Started with the Python SDK',
			estimatedTime: '5 minutes',
			prerequisites: [
				'Python 3.8 or higher',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Install the Pictify package using pip.',
					code: `# Using pip
pip install pictify

# Using poetry
poetry add pictify

# Using pipenv
pipenv install pictify`,
					tip: null
				},
				{
					title: 'Initialize the Client',
					description:
						'Create a Pictify client with your API key. Use environment variables to keep credentials secure.',
					code: `import os
from pictify import Pictify

# Initialize with API key from environment
client = Pictify(api_key=os.environ.get('PICTIFY_API_KEY'))

# Or pass directly (not recommended for production)
client = Pictify(api_key='your-api-key')`,
					tip: 'Set your API key with: export PICTIFY_API_KEY=your-key'
				},
				{
					title: 'Generate an Image',
					description: 'Use the render method to generate images from your templates.',
					code: `result = client.render(
    template_id='your-template-id',
    variables={
        'title': 'Hello from Python',
        'subtitle': 'Generated with the Pictify SDK',
        'accent_color': '#667eea'
    },
    format='png',
    width=1200,
    height=630
)

print(f"Image URL: {result.image_url}")
# https://cdn.pictify.io/renders/abc123.png`,
					tip: null
				},
				{
					title: 'Download Image Locally',
					description: 'Save the generated image to your local filesystem.',
					code: `# Download as bytes
image_bytes = client.render(
    template_id='your-template-id',
    variables={'title': 'Download Test'},
    download=True
)

# Save to file
with open('output.png', 'wb') as f:
    f.write(image_bytes)

# Or use the convenience method
client.render_to_file(
    template_id='your-template-id',
    variables={'title': 'Save Test'},
    output_path='my-image.png'
)`,
					tip: null
				},
				{
					title: 'Batch Processing with Pandas',
					description: 'Generate images from a DataFrame—perfect for data science workflows.',
					code: `import pandas as pd

# Load your data
df = pd.read_csv('products.csv')

# Generate images for each row
results = client.render_batch(
    template_id='product-card-template',
    items=[
        {
            'variables': {
                'name': row['product_name'],
                'price': f"$" + "{row['price']:.2f}",
                'image': row['image_url']
            }
        }
        for _, row in df.iterrows()
    ]
)

# Add image URLs back to DataFrame
df['generated_image'] = [r.image_url for r in results]
df.to_csv('products_with_images.csv', index=False)`,
					tip: 'For large datasets, process in chunks to avoid memory issues.'
				},
				{
					title: 'Async Support',
					description: 'Use async/await for non-blocking image generation in async applications.',
					code: `import asyncio
from pictify import AsyncPictify

async def generate_images():
    client = AsyncPictify(api_key=os.environ.get('PICTIFY_API_KEY'))

    # Generate multiple images concurrently
    tasks = [
        client.render(
            template_id='your-template-id',
            variables={'title': f'Image {i}'}
        )
        for i in range(10)
    ]

    results = await asyncio.gather(*tasks)

    for i, result in enumerate(results):
        print(f"Image {i}: {result.image_url}")

    await client.close()

asyncio.run(generate_images())`,
					tip: 'Always close the async client when done to release connections.'
				},
				{
					title: 'Display in Jupyter Notebook',
					description: 'Display generated images directly in Jupyter notebooks.',
					code: `from IPython.display import Image, display

result = client.render(
    template_id='your-template-id',
    variables={'title': 'Notebook Demo'}
)

# Display from URL
display(Image(url=result.image_url))

# Or display from bytes
image_bytes = client.render(
    template_id='your-template-id',
    variables={'title': 'Direct Display'},
    download=True
)
display(Image(data=image_bytes))`,
					tip: null
				}
			],
			troubleshooting: [
				{
					issue: 'ImportError: No module named pictify',
					solution:
						"Ensure you installed the package: pip install pictify. Check you're using the correct Python environment."
				},
				{
					issue: 'SSL certificate errors',
					solution: 'Update your certificates: pip install --upgrade certifi'
				},
				{
					issue: 'Async errors in Jupyter',
					solution:
						'Use nest_asyncio: pip install nest_asyncio, then import nest_asyncio; nest_asyncio.apply()'
				}
			]
		}
	},
	{
		slug: 'go',
		name: 'Go SDK',
		category: 'sdk',
		description: 'Official Go library for high-performance applications.',
		longDescription:
			'The Pictify Go SDK is designed for high-performance applications that need efficient image generation. Fully idiomatic Go with context support, proper error handling, and minimal dependencies.',
		features: ['Context support', 'Zero dependencies', 'Concurrent-safe', 'Efficient memory use'],
		useCases: ['High-throughput APIs', 'Microservices', 'CLI tools', 'Backend services'],
		docsUrl: 'https://docs.pictify.io/sdks/go',
		icon: 'go',
		installCommand: 'go get github.com/pictify/pictify-go',
		tutorial: {
			title: 'Getting Started with the Go SDK',
			estimatedTime: '5 minutes',
			prerequisites: [
				'Go 1.19 or higher',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Add the Pictify Go SDK to your project using go get.',
					code: `go get github.com/pictify/pictify-go`,
					tip: null
				},
				{
					title: 'Initialize the Client',
					description: 'Create a new Pictify client with your API key.',
					code: `package main

import (
    "os"
    "github.com/pictify/pictify-go"
)

func main() {
    // Create client with API key from environment
    client := pictify.NewClient(os.Getenv("PICTIFY_API_KEY"))

    // Or with options
    client := pictify.NewClient(
        os.Getenv("PICTIFY_API_KEY"),
        pictify.WithTimeout(30 * time.Second),
        pictify.WithRetries(3),
    )
}`,
					tip: 'The client is safe for concurrent use. Create one client and reuse it.'
				},
				{
					title: 'Generate an Image',
					description:
						'Use the Render method to generate images. Always pass a context for cancellation support.',
					code: `import (
    "context"
    "fmt"
    "github.com/pictify/pictify-go"
)

func generateImage(client *pictify.Client) error {
    ctx := context.Background()

    result, err := client.Render(ctx, &pictify.RenderRequest{
        TemplateID: "your-template-id",
        Variables: map[string]interface{}{
            "title":    "Hello from Go",
            "subtitle": "High-performance image generation",
            "color":    "#667eea",
        },
        Format: pictify.FormatPNG,
        Width:  1200,
        Height: 630,
    })
    if err != nil {
        return fmt.Errorf("render failed: %w", err)
    }

    fmt.Printf("Image URL: %s\\n", result.ImageURL)
    return nil
}`,
					tip: null
				},
				{
					title: 'Download Image as Bytes',
					description: 'Get the raw image bytes for further processing or saving to disk.',
					code: `func downloadImage(client *pictify.Client) error {
    ctx := context.Background()

    imageBytes, err := client.RenderBytes(ctx, &pictify.RenderRequest{
        TemplateID: "your-template-id",
        Variables: map[string]interface{}{
            "title": "Download Test",
        },
        Format: pictify.FormatPNG,
    })
    if err != nil {
        return err
    }

    // Save to file
    return os.WriteFile("output.png", imageBytes, 0644)
}`,
					tip: null
				},
				{
					title: 'Concurrent Image Generation',
					description: 'Generate multiple images concurrently using goroutines.',
					code: `import (
    "context"
    "sync"
)

func generateBatch(client *pictify.Client, items []Item) ([]string, error) {
    ctx := context.Background()
    results := make([]string, len(items))
    errs := make([]error, len(items))

    var wg sync.WaitGroup
    // Limit concurrency with a semaphore
    sem := make(chan struct{}, 5)

    for i, item := range items {
        wg.Add(1)
        go func(idx int, item Item) {
            defer wg.Done()
            sem <- struct{}{}        // Acquire
            defer func() { <-sem }() // Release

            result, err := client.Render(ctx, &pictify.RenderRequest{
                TemplateID: "your-template-id",
                Variables: map[string]interface{}{
                    "title": item.Title,
                    "price": item.Price,
                },
            })
            if err != nil {
                errs[idx] = err
                return
            }
            results[idx] = result.ImageURL
        }(i, item)
    }

    wg.Wait()

    // Check for errors
    for _, err := range errs {
        if err != nil {
            return nil, err
        }
    }
    return results, nil
}`,
					tip: 'Use a semaphore channel to limit concurrent requests and avoid overwhelming the API.'
				},
				{
					title: 'Context Timeout and Cancellation',
					description: 'Use context for timeouts and graceful cancellation.',
					code: `func renderWithTimeout(client *pictify.Client) error {
    // Create context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    result, err := client.Render(ctx, &pictify.RenderRequest{
        TemplateID: "your-template-id",
        Variables: map[string]interface{}{
            "title": "Timeout Test",
        },
    })
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return fmt.Errorf("render timed out")
        }
        return err
    }

    fmt.Println(result.ImageURL)
    return nil
}`,
					tip: null
				},
				{
					title: 'Error Handling',
					description: 'Handle specific error types for better error recovery.',
					code: `result, err := client.Render(ctx, req)
if err != nil {
    var apiErr *pictify.APIError
    if errors.As(err, &apiErr) {
        switch apiErr.Code {
        case pictify.ErrTemplateNotFound:
            log.Printf("Template %s not found", req.TemplateID)
        case pictify.ErrRateLimitExceeded:
            log.Printf("Rate limited, retry after %v", apiErr.RetryAfter)
        case pictify.ErrInvalidVariables:
            log.Printf("Invalid variables: %s", apiErr.Message)
        default:
            log.Printf("API error: %s", apiErr.Message)
        }
    }
    return err
}`,
					tip: null
				}
			],
			troubleshooting: [
				{
					issue: 'go get fails',
					solution:
						'Ensure you have Go 1.19+. Run "go version" to check. Also verify GOPROXY is accessible.'
				},
				{
					issue: 'Context deadline exceeded',
					solution:
						'Increase timeout or check network connectivity. Image generation typically takes 1-3 seconds.'
				},
				{
					issue: 'Too many open files',
					solution:
						'Close response bodies and limit concurrent requests. The SDK reuses connections when possible.'
				}
			]
		}
	},
	{
		slug: 'ruby',
		name: 'Ruby SDK',
		category: 'sdk',
		description: 'Official Ruby gem for Rails and Ruby applications.',
		longDescription:
			'The Pictify Ruby gem provides a clean, Ruby-idiomatic interface for image generation. Includes Rails helpers and integrations for seamless use in Rails applications.',
		features: [
			'Rails integration',
			'ActiveJob support',
			'Ruby-idiomatic API',
			'Faraday-based HTTP'
		],
		useCases: ['Rails applications', 'Background jobs', 'Admin dashboards', 'API backends'],
		docsUrl: 'https://docs.pictify.io/sdks/ruby',
		icon: 'ruby',
		installCommand: 'gem install pictify',
		tutorial: {
			title: 'Getting Started with the Ruby SDK',
			estimatedTime: '5 minutes',
			prerequisites: [
				'Ruby 3.0 or higher',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the Gem',
					description: 'Add Pictify to your Gemfile or install directly.',
					code: `# Add to Gemfile
gem 'pictify'

# Then run
bundle install

# Or install directly
gem install pictify`,
					tip: null
				},
				{
					title: 'Configure the Client',
					description: 'Set up Pictify with your API key. In Rails, use an initializer.',
					code: `# config/initializers/pictify.rb (Rails)
Pictify.configure do |config|
  config.api_key = ENV['PICTIFY_API_KEY']
  config.timeout = 30 # seconds
end

# Or configure inline (standalone Ruby)
require 'pictify'

client = Pictify::Client.new(api_key: ENV['PICTIFY_API_KEY'])`,
					tip: 'Store your API key in Rails credentials or environment variables.'
				},
				{
					title: 'Generate an Image',
					description: 'Use the render method to generate images from templates.',
					code: `# Using the global client (after configuration)
result = Pictify.render(
  template_id: 'your-template-id',
  variables: {
    title: 'Hello from Ruby',
    subtitle: 'Generated with the Pictify gem',
    accent_color: '#667eea'
  },
  format: :png,
  width: 1200,
  height: 630
)

puts result.image_url
# => "https://cdn.pictify.io/renders/abc123.png"

# Or using an instance
client = Pictify::Client.new(api_key: ENV['PICTIFY_API_KEY'])
result = client.render(template_id: 'your-template-id', variables: { title: 'Test' })`,
					tip: null
				},
				{
					title: 'Download Image',
					description: 'Save the generated image to disk or get raw bytes.',
					code: `# Download as bytes
image_data = Pictify.render(
  template_id: 'your-template-id',
  variables: { title: 'Download Test' },
  download: true
)

# Save to file
File.binwrite('output.png', image_data)

# Or use the convenience method
Pictify.render_to_file(
  template_id: 'your-template-id',
  variables: { title: 'File Test' },
  output_path: 'my-image.png'
)`,
					tip: null
				},
				{
					title: 'Rails Integration with ActiveJob',
					description: 'Generate images in the background using ActiveJob.',
					code: `# app/jobs/generate_og_image_job.rb
class GenerateOgImageJob < ApplicationJob
  queue_as :default

  def perform(post_id)
    post = Post.find(post_id)

    result = Pictify.render(
      template_id: 'blog-og-template',
      variables: {
        title: post.title,
        author: post.author.name,
        date: post.published_at.strftime('%B %d, %Y'),
        category: post.category.name
      }
    )

    post.update!(og_image_url: result.image_url)
  end
end

# Trigger from controller or callback
class PostsController < ApplicationController
  def publish
    @post.publish!
    GenerateOgImageJob.perform_later(@post.id)
  end
end`,
					tip: "Use ActiveJob for any render that doesn't need to block the request."
				},
				{
					title: 'Batch Processing',
					description: 'Generate multiple images efficiently.',
					code: `products = Product.where(needs_image: true).limit(100)

results = Pictify.render_batch(
  template_id: 'product-card',
  items: products.map do |product|
    {
      variables: {
        name: product.name,
        price: helpers.number_to_currency(product.price),
        image_url: product.photo_url
      }
    }
  end
)

# Update products with generated images
products.each_with_index do |product, i|
  product.update!(card_image_url: results[i].image_url)
end`,
					tip: null
				},
				{
					title: 'View Helper for Rails',
					description: 'Use the included helper to generate image URLs in views.',
					code: `# In your view (ERB)
<%= pictify_image_tag(
  template_id: 'social-card',
  variables: { title: @post.title },
  width: 1200,
  height: 630,
  alt: @post.title,
  class: 'og-preview'
) %>

# Or just get the URL
<meta property="og:image" content="<%= pictify_url(
  template_id: 'og-image',
  variables: { title: @post.title }
) %>" />`,
					tip: 'The helper caches URLs by default. Pass cache: false to disable.'
				}
			],
			troubleshooting: [
				{
					issue: 'LoadError: cannot load such file',
					solution:
						'Run "bundle install" or "gem install pictify". Check your Gemfile includes the gem.'
				},
				{
					issue: 'Faraday::TimeoutError',
					solution: 'Increase timeout in configuration or check network. Default is 30 seconds.'
				},
				{
					issue: 'API key not found in Rails',
					solution:
						'Ensure the initializer loads after environment variables. Check config/application.rb load order.'
				}
			]
		}
	},
	// Frameworks
	{
		slug: 'nextjs',
		name: 'Next.js',
		category: 'framework',
		description: 'Generate dynamic OG images in Next.js with API routes or edge functions.',
		longDescription:
			'Integrate Pictify with Next.js for dynamic OG image generation. Use API routes for server-side generation, or edge functions for low-latency image creation. Perfect for blogs, e-commerce, and SaaS applications built with Next.js.',
		features: [
			'API route integration',
			'Edge function support',
			'ISR compatibility',
			'App Router ready'
		],
		useCases: [
			'Dynamic blog OG images',
			'Product page social cards',
			'User-generated content previews'
		],
		docsUrl: 'https://docs.pictify.io/frameworks/nextjs',
		icon: 'nextjs',
		tutorial: {
			title: 'Dynamic OG Images with Next.js',
			estimatedTime: '10 minutes',
			prerequisites: [
				'Next.js 13+ project',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Add the Pictify SDK to your Next.js project.',
					code: `npm install @pictify/sdk`,
					tip: null
				},
				{
					title: 'Set Up Environment Variables',
					description: 'Add your Pictify API key to your environment configuration.',
					code: `# .env.local
PICTIFY_API_KEY=your-api-key-here
PICTIFY_TEMPLATE_ID=your-og-template-id`,
					tip: 'Never commit .env.local to git. Add it to .gitignore.'
				},
				{
					title: 'Create an API Route (App Router)',
					description: 'Create an API route to generate OG images on demand.',
					code: `// app/api/og/route.ts
import { Pictify } from '@pictify/sdk';
import { NextRequest, NextResponse } from 'next/server';

const pictify = new Pictify({
  apiKey: process.env.PICTIFY_API_KEY!
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || '';

  try {
    const result = await pictify.render({
      templateId: process.env.PICTIFY_TEMPLATE_ID!,
      variables: { title, description },
      format: 'png',
      width: 1200,
      height: 630
    });

    // Redirect to the CDN-hosted image
    return NextResponse.redirect(result.imageUrl);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}`,
					tip: null
				},
				{
					title: 'Add Dynamic Metadata to Pages',
					description: 'Use Next.js metadata API to set OG images dynamically.',
					code: `// app/blog/[slug]/page.tsx
import { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  // Build the OG image URL with query params
  const ogImageUrl = new URL('/api/og', process.env.NEXT_PUBLIC_SITE_URL);
  ogImageUrl.searchParams.set('title', post.title);
  ogImageUrl.searchParams.set('description', post.excerpt);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);
  return <article>{/* Your post content */}</article>;
}`,
					tip: 'The OG image is generated on-demand when social platforms fetch the URL.'
				},
				{
					title: 'Pre-generate at Build Time (Optional)',
					description: 'For static sites, generate OG images during build for better performance.',
					code: `// scripts/generate-og-images.ts
import { Pictify } from '@pictify/sdk';
import { getAllPosts } from '../lib/posts';
import fs from 'fs';
import path from 'path';

const pictify = new Pictify({ apiKey: process.env.PICTIFY_API_KEY! });

async function generateOgImages() {
  const posts = await getAllPosts();

  for (const post of posts) {
    const result = await pictify.render({
      templateId: process.env.PICTIFY_TEMPLATE_ID!,
      variables: {
        title: post.title,
        author: post.author,
        date: post.date
      },
      download: true
    });

    const outputPath = path.join(
      process.cwd(),
      'public',
      'og',
      \`\${post.slug}.png\`
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result.buffer);

    console.log(\`Generated: \${outputPath}\`);
  }
}

generateOgImages();`,
					tip: 'Add this script to your build process: "prebuild": "tsx scripts/generate-og-images.ts"'
				},
				{
					title: 'Edge Function for Low Latency (Optional)',
					description: 'Use Edge Runtime for faster cold starts globally.',
					code: `// app/api/og/route.ts
import { Pictify } from '@pictify/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Use Edge Runtime
export const runtime = 'edge';

const pictify = new Pictify({
  apiKey: process.env.PICTIFY_API_KEY!
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';

  const result = await pictify.render({
    templateId: process.env.PICTIFY_TEMPLATE_ID!,
    variables: { title },
  });

  // Redirect to CDN with caching headers
  return NextResponse.redirect(result.imageUrl, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}`,
					tip: 'Edge functions run closer to users, reducing latency for global audiences.'
				}
			],
			troubleshooting: [
				{
					issue: 'Environment variables undefined',
					solution:
						'Ensure variables are in .env.local (not .env). Restart the dev server after changes.'
				},
				{
					issue: 'OG image not showing on social media',
					solution:
						'Use the Facebook Sharing Debugger or Twitter Card Validator to clear cached images.'
				},
				{
					issue: 'Build fails with Pictify import',
					solution:
						"The SDK is server-only. Ensure you're only importing it in API routes or server components."
				}
			]
		}
	},
	{
		slug: 'nuxt',
		name: 'Nuxt',
		category: 'framework',
		description: 'Add dynamic image generation to Nuxt applications.',
		longDescription:
			"The Pictify Nuxt module provides seamless integration for Vue-based applications. Generate images from server routes, use composables for reactive image URLs, and leverage Nuxt's powerful rendering modes.",
		features: [
			'Nuxt module available',
			'Server routes integration',
			'Composables included',
			'SSR compatible'
		],
		useCases: ['Vue-based applications', 'SSR image generation', 'Jamstack sites'],
		docsUrl: 'https://docs.pictify.io/frameworks/nuxt',
		icon: 'nuxt',
		tutorial: {
			title: 'Dynamic OG Images with Nuxt',
			estimatedTime: '10 minutes',
			prerequisites: [
				'Nuxt 3 project',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Add the Pictify SDK to your Nuxt project.',
					code: `npm install @pictify/sdk`,
					tip: null
				},
				{
					title: 'Configure Environment Variables',
					description: 'Add your Pictify credentials to your Nuxt config.',
					code: `# .env
PICTIFY_API_KEY=your-api-key-here
PICTIFY_TEMPLATE_ID=your-og-template-id

// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (server-only)
    pictifyApiKey: process.env.PICTIFY_API_KEY,
    pictifyTemplateId: process.env.PICTIFY_TEMPLATE_ID,
    // Public keys (exposed to client)
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})`,
					tip: 'Private runtime config keys are only available on the server.'
				},
				{
					title: 'Create a Server API Route',
					description: 'Create an API endpoint to generate OG images on demand.',
					code: `// server/api/og.get.ts
import { Pictify } from '@pictify/sdk';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const pictify = new Pictify({
    apiKey: config.pictifyApiKey
  });

  try {
    const result = await pictify.render({
      templateId: config.pictifyTemplateId,
      variables: {
        title: query.title as string || 'Default Title',
        description: query.description as string || '',
        author: query.author as string || ''
      },
      format: 'png',
      width: 1200,
      height: 630
    });

    // Redirect to CDN-hosted image
    return sendRedirect(event, result.imageUrl);
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to generate OG image'
    });
  }
});`,
					tip: null
				},
				{
					title: 'Create a Composable for OG URLs',
					description: 'Build a reusable composable to generate OG image URLs.',
					code: `// composables/useOgImage.ts
export function useOgImage(options: {
  title: string;
  description?: string;
  author?: string;
}) {
  const config = useRuntimeConfig();

  const ogUrl = computed(() => {
    const url = new URL('/api/og', config.public.siteUrl);
    url.searchParams.set('title', options.title);
    if (options.description) {
      url.searchParams.set('description', options.description);
    }
    if (options.author) {
      url.searchParams.set('author', options.author);
    }
    return url.toString();
  });

  return { ogUrl };
}`,
					tip: null
				},
				{
					title: 'Use in Pages with useSeoMeta',
					description: "Set dynamic OG images using Nuxt's SEO composables.",
					code: `<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: post } = await useFetch(\`/api/posts/\${route.params.slug}\`);

const { ogUrl } = useOgImage({
  title: post.value.title,
  description: post.value.excerpt,
  author: post.value.author.name
});

useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt,
  ogImage: ogUrl.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle: post.value.title,
  twitterDescription: post.value.excerpt,
  twitterImage: ogUrl.value
});
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <div v-html="post.content" />
  </article>
</template>`,
					tip: 'useSeoMeta is SSR-safe and works with both server and client rendering.'
				},
				{
					title: 'Pre-render OG Images at Build Time',
					description: 'For static sites, generate images during the build process.',
					code: `// server/plugins/generate-og.ts
import { Pictify } from '@pictify/sdk';

export default defineNitroPlugin(async () => {
  // Only run during prerendering
  if (process.env.NITRO_PRERENDER) {
    const config = useRuntimeConfig();
    const pictify = new Pictify({ apiKey: config.pictifyApiKey });

    // Fetch all posts that need OG images
    const posts = await $fetch('/api/posts');

    for (const post of posts) {
      const result = await pictify.render({
        templateId: config.pictifyTemplateId,
        variables: {
          title: post.title,
          description: post.excerpt
        }
      });

      // Store the URL somewhere (database, JSON file, etc.)
      console.log(\`Generated OG for \${post.slug}: \${result.imageUrl}\`);
    }
  }
});`,
					tip: 'This runs during "nuxt generate" for static site generation.'
				}
			],
			troubleshooting: [
				{
					issue: 'Runtime config undefined',
					solution:
						"Ensure you're accessing config on the server with useRuntimeConfig(). Check your nuxt.config.ts."
				},
				{
					issue: 'CORS errors in development',
					solution:
						'The API route handles redirects. If fetching directly, ensure the CDN allows your origin.'
				},
				{
					issue: 'OG image not updating',
					solution:
						'Social platforms cache images aggressively. Add a version query param or use their debug tools.'
				}
			]
		}
	},
	{
		slug: 'sveltekit',
		name: 'SvelteKit',
		category: 'framework',
		description: 'Generate images with SvelteKit server endpoints and load functions.',
		longDescription:
			'Use Pictify with SvelteKit for powerful image generation capabilities. Generate images in +server.js endpoints, prerender social cards at build time, or create dynamic images based on route parameters.',
		features: [
			'Server endpoint integration',
			'Prerendering support',
			'Adapter-agnostic',
			'TypeScript support'
		],
		useCases: ['Svelte applications', 'Static site generation', 'Dynamic server routes'],
		docsUrl: 'https://docs.pictify.io/frameworks/sveltekit',
		icon: 'svelte',
		tutorial: {
			title: 'Dynamic OG Images with SvelteKit',
			estimatedTime: '10 minutes',
			prerequisites: [
				'SvelteKit project',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Install the SDK',
					description: 'Add the Pictify SDK to your SvelteKit project.',
					code: `npm install @pictify/sdk`,
					tip: null
				},
				{
					title: 'Configure Environment Variables',
					description: 'Add your Pictify credentials as environment variables.',
					code: `# .env
PICTIFY_API_KEY=your-api-key-here
PICTIFY_TEMPLATE_ID=your-og-template-id
PUBLIC_SITE_URL=https://yoursite.com`,
					tip: 'Variables prefixed with PUBLIC_ are exposed to the browser. Keep API keys private.'
				},
				{
					title: 'Create a Server-Only Pictify Module',
					description: 'Create a server-side module to initialize the Pictify client.',
					code: `// src/lib/server/pictify.ts
import { Pictify } from '@pictify/sdk';
import { PICTIFY_API_KEY } from '$env/static/private';

export const pictify = new Pictify({
  apiKey: PICTIFY_API_KEY
});`,
					tip: 'Files in $lib/server are never included in client bundles.'
				},
				{
					title: 'Create an API Endpoint',
					description: 'Create a server endpoint to generate OG images on demand.',
					code: `// src/routes/api/og/+server.ts
import { pictify } from '$lib/server/pictify';
import { PICTIFY_TEMPLATE_ID } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const title = url.searchParams.get('title') || 'Default Title';
  const description = url.searchParams.get('description') || '';

  try {
    const result = await pictify.render({
      templateId: PICTIFY_TEMPLATE_ID,
      variables: { title, description },
      format: 'png',
      width: 1200,
      height: 630
    });

    // Redirect to the CDN-hosted image
    throw redirect(302, result.imageUrl);
  } catch (error) {
    if (error instanceof Response) throw error; // Re-throw redirects
    return new Response('Failed to generate image', { status: 500 });
  }
};`,
					tip: null
				},
				{
					title: 'Set OG Meta Tags in Pages',
					description: 'Use load functions to set dynamic OG images for each page.',
					code: `// src/routes/blog/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { PUBLIC_SITE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPost(params.slug); // Your data fetching

  const ogImageUrl = new URL('/api/og', PUBLIC_SITE_URL);
  ogImageUrl.searchParams.set('title', post.title);
  ogImageUrl.searchParams.set('description', post.excerpt);

  return {
    post,
    meta: {
      title: post.title,
      description: post.excerpt,
      ogImage: ogImageUrl.toString()
    }
  };
};

// src/routes/blog/[slug]/+page.svelte
<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
  <meta property="og:title" content={data.meta.title} />
  <meta property="og:description" content={data.meta.description} />
  <meta property="og:image" content={data.meta.ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={data.meta.ogImage} />
</svelte:head>

<article>
  <h1>{data.post.title}</h1>
  {@html data.post.content}
</article>`,
					tip: null
				},
				{
					title: 'Pre-render OG Images at Build Time',
					description: 'Generate static OG images during the build process.',
					code: `// src/routes/blog/[slug]/og.png/+server.ts
import { pictify } from '$lib/server/pictify';
import { PICTIFY_TEMPLATE_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

// Enable prerendering for this endpoint
export const prerender = true;

export const GET: RequestHandler = async ({ params }) => {
  const post = await getPost(params.slug);

  const result = await pictify.render({
    templateId: PICTIFY_TEMPLATE_ID,
    variables: {
      title: post.title,
      description: post.excerpt,
      author: post.author
    },
    format: 'png',
    download: true // Get bytes instead of URL
  });

  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
};

// In your +page.svelte, reference the static image:
// <meta property="og:image" content="/blog/{data.post.slug}/og.png" />`,
					tip: 'Prerendering generates the images at build time, eliminating runtime API calls.'
				},
				{
					title: 'Create a Utility Function',
					description: 'Build a reusable function for generating OG URLs throughout your app.',
					code: `// src/lib/og.ts
import { PUBLIC_SITE_URL } from '$env/static/public';

export function getOgImageUrl(params: {
  title: string;
  description?: string;
  author?: string;
}): string {
  const url = new URL('/api/og', PUBLIC_SITE_URL);

  url.searchParams.set('title', params.title);
  if (params.description) {
    url.searchParams.set('description', params.description);
  }
  if (params.author) {
    url.searchParams.set('author', params.author);
  }

  return url.toString();
}

// Usage in load functions:
import { getOgImageUrl } from '$lib/og';

return {
  ogImage: getOgImageUrl({
    title: post.title,
    description: post.excerpt
  })
};`,
					tip: null
				}
			],
			troubleshooting: [
				{
					issue: 'Cannot find module $env/static/private',
					solution:
						'Ensure your .env file exists and restart the dev server. SvelteKit loads env at startup.'
				},
				{
					issue: 'Redirect loop in API endpoint',
					solution:
						"Make sure you're throwing the redirect, not returning it: throw redirect(302, url)"
				},
				{
					issue: 'Prerendering fails',
					solution:
						'Ensure all data needed for rendering is available at build time. Check that API endpoints are reachable.'
				}
			]
		}
	},
	// CMS
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
		docsUrl: 'https://docs.pictify.io/cms/wordpress',
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
		slug: 'ghost',
		name: 'Ghost',
		category: 'cms',
		description: 'Dynamic social cards for Ghost publications.',
		longDescription:
			'Integrate Pictify with Ghost to automatically generate beautiful social preview images for your publications. Use Ghost webhooks to trigger image generation when posts are published or updated.',
		features: [
			'Webhook integration',
			'Feature image support',
			'Custom code injection',
			'Member data support'
		],
		useCases: ['Publication social cards', 'Newsletter images', 'Member certificates'],
		docsUrl: 'https://docs.pictify.io/cms/ghost',
		icon: 'ghost',
		tutorial: {
			title: 'Auto-Generate OG Images in Ghost',
			estimatedTime: '15 minutes',
			prerequisites: [
				'Ghost 5.x publication',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Create a Custom Integration in Ghost',
					description: 'Set up a custom integration in Ghost to enable webhook functionality.',
					code: `1. Go to Ghost Admin → Settings → Integrations
2. Scroll down and click "Add custom integration"
3. Name it "Pictify OG Images"
4. Note the Content API Key and Admin API Key
5. Click "Save"`,
					tip: "You'll use the Admin API key to write images back to posts."
				},
				{
					title: 'Configure the Webhook in Ghost',
					description: 'Add a webhook that fires when posts are published.',
					code: `1. In your Pictify integration settings, click "Add webhook"
2. Configure the webhook:
   - Name: "Generate OG Image on Publish"
   - Event: "Post published"
   - Target URL: https://api.pictify.io/webhooks/ghost/YOUR_WEBHOOK_ID

3. Add another webhook for updates (optional):
   - Name: "Regenerate OG Image on Update"
   - Event: "Post updated"
   - Target URL: Same as above`,
					tip: 'Get your webhook URL from Pictify Dashboard → Integrations → Webhooks.'
				},
				{
					title: 'Configure Pictify Webhook Handler',
					description: "Set up variable mapping in Pictify to handle Ghost's webhook payload.",
					code: `In Pictify Dashboard → Webhooks → Configure:

// Ghost sends this payload when a post is published:
{
  "post": {
    "current": {
      "id": "abc123",
      "title": "My Blog Post",
      "slug": "my-blog-post",
      "excerpt": "A short summary...",
      "feature_image": "https://...",
      "published_at": "2024-01-15T10:00:00Z",
      "primary_author": {
        "name": "Author Name",
        "profile_image": "https://..."
      },
      "primary_tag": { "name": "Technology" }
    }
  }
}

// Variable mapping:
title       → post.current.title
description → post.current.excerpt
author      → post.current.primary_author.name
category    → post.current.primary_tag.name
image       → post.current.feature_image`,
					tip: null
				},
				{
					title: 'Set Up Response Action',
					description: 'Configure Pictify to update Ghost with the generated image URL.',
					code: `In Pictify webhook settings → Response Action:

1. Enable "Update Source System"
2. Select "Ghost" as the platform
3. Enter your Ghost details:
   - Ghost URL: https://your-site.ghost.io
   - Admin API Key: (from Step 1)

4. Configure the update:
   - Field to update: "og_image" (custom field)
   - Or: "feature_image" (replaces existing)

5. Save the configuration

// Pictify will automatically update the post after generating the image`,
					tip: 'Using og_image as a custom field preserves your original feature image.'
				},
				{
					title: 'Add OG Meta Tags to Theme',
					description: 'Modify your Ghost theme to use the generated OG image.',
					code: `// Edit your theme's default.hbs (in <head> section):

{{#post}}
  {{#if og_image}}
    <meta property="og:image" content="{{og_image}}" />
  {{else if feature_image}}
    <meta property="og:image" content="{{feature_image}}" />
  {{else}}
    <meta property="og:image" content="{{@site.cover_image}}" />
  {{/if}}
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
{{/post}}

// Upload your modified theme:
// Ghost Admin → Design → Change theme → Upload`,
					tip: "Test locally first using Ghost's theme development tools."
				},
				{
					title: 'Alternative: Use Code Injection',
					description: "For a no-theme-edit approach, use Ghost's code injection.",
					code: `Go to Ghost Admin → Settings → Code Injection → Site Header:

<script>
(function() {
  // Build dynamic OG image URL
  var title = document.querySelector('meta[property="og:title"]')?.content;
  if (title) {
    var ogUrl = 'https://api.pictify.io/v1/og?' +
      'template=YOUR_TEMPLATE_ID&' +
      'title=' + encodeURIComponent(title);

    // Update or create OG image meta tag
    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.content = ogUrl;
    }
  }
})();
</script>`,
					tip: 'This generates images on-demand without storing them in Ghost.'
				},
				{
					title: 'Test the Integration',
					description: 'Publish a test post and verify everything works.',
					code: `1. Create a new post in Ghost with title and excerpt
2. Click "Publish"
3. Check Pictify dashboard → Webhooks → Logs
4. Verify the image was generated
5. Check if Ghost post was updated (if using response action)

// Test with social debuggers:
- Facebook: developers.facebook.com/tools/debug/
- Twitter: cards-dev.twitter.com/validator
- LinkedIn: linkedin.com/post-inspector/`,
					tip: 'Give it 10-30 seconds for the webhook to process after publishing.'
				}
			],
			troubleshooting: [
				{
					issue: 'Webhook not triggering',
					solution:
						'Verify the webhook URL in Ghost settings. Check that your Ghost instance can make outbound HTTP requests.'
				},
				{
					issue: 'Image not updating in Ghost',
					solution:
						'Verify your Admin API key is correct and has write permissions. Check Pictify webhook logs for errors.'
				},
				{
					issue: 'Social preview shows old image',
					solution:
						'Social platforms cache images. Use their debug tools to force a re-fetch of your page metadata.'
				}
			]
		}
	},
	{
		slug: 'webflow',
		name: 'Webflow',
		category: 'cms',
		description: 'Generate dynamic images for Webflow CMS collections.',
		longDescription:
			'Connect Pictify to Webflow via webhooks or Zapier to generate images for CMS collection items. Perfect for blogs, portfolios, and directories that need consistent, branded social images.',
		features: [
			'Webhook support',
			'CMS collection integration',
			'Custom field mapping',
			'Zapier connection'
		],
		useCases: ['Collection item images', 'Dynamic directories', 'Portfolio showcases'],
		docsUrl: 'https://docs.pictify.io/cms/webflow',
		icon: 'webflow',
		tutorial: {
			title: 'Auto-Generate OG Images for Webflow CMS',
			estimatedTime: '20 minutes',
			prerequisites: [
				'Webflow site with CMS',
				'A Pictify account with an API key',
				'A template created in Pictify'
			],
			steps: [
				{
					title: 'Add a CMS Field for OG Image',
					description:
						'First, add a field to your CMS collection to store the generated image URL.',
					code: `1. Go to your Webflow project → CMS Collections
2. Select your collection (e.g., "Blog Posts")
3. Click "Add New Field"
4. Choose "Plain Text" or "Link" field type
5. Name it "OG Image URL" or "Generated Social Image"
6. Save the collection`,
					tip: 'Use a Link field if you want Webflow to validate it as a URL.'
				},
				{
					title: 'Set Up Zapier Integration',
					description: 'Connect Webflow to Pictify using Zapier for no-code automation.',
					code: `1. Go to zapier.com and create a new Zap
2. Trigger: Choose "Webflow"
   - Event: "New CMS Item" or "Updated CMS Item"
   - Connect your Webflow account
   - Select your site and collection

3. Action: Choose "Webhooks by Zapier"
   - Event: "POST"
   - URL: https://api.pictify.io/v1/render
   - Headers:
     Authorization: Bearer YOUR_PICTIFY_API_KEY
     Content-Type: application/json
   - Body:
     {
       "templateId": "your-template-id",
       "variables": {
         "title": "{{name}}",
         "description": "{{excerpt}}",
         "image": "{{featured_image}}"
       }
     }`,
					tip: "Use Zapier's variable picker to map Webflow fields to template variables."
				},
				{
					title: 'Update Webflow with Generated Image',
					description: 'Add a second Zapier action to write the image URL back to Webflow.',
					code: `Add another action step in your Zap:

1. Action: Choose "Webflow"
   - Event: "Update CMS Item"
   - Connect same Webflow account
   - Site: Your site
   - Collection: Same collection

2. Configure the update:
   - Item ID: {{item_id}} from trigger
   - OG Image URL: {{imageUrl}} from Pictify response

3. Turn on your Zap

// Now when you add/update a CMS item:
// 1. Zapier triggers
// 2. Pictify generates the image
// 3. Zapier updates Webflow with the URL`,
					tip: 'Add a delay step between Pictify and Webflow if you experience timing issues.'
				},
				{
					title: 'Alternative: Use Make (Integromat)',
					description: 'For more complex workflows, use Make instead of Zapier.',
					code: `In Make.com:

1. Create a new Scenario
2. Add Webflow module: "Watch CMS Items"
3. Add HTTP module for Pictify:
   - URL: https://api.pictify.io/v1/render
   - Method: POST
   - Headers: Authorization: Bearer YOUR_KEY
   - Body: JSON with template and variables

4. Add Webflow module: "Update a CMS Item"
   - Map the imageUrl from Pictify response

5. Enable the scenario

// Make advantages:
// - Visual workflow builder
// - Better error handling
// - Conditional logic support`,
					tip: null
				},
				{
					title: 'Add OG Meta Tags in Webflow',
					description: 'Configure your Webflow pages to use the generated OG image.',
					code: `1. Go to your CMS collection template page
2. Click the Settings icon (gear) in the top left
3. Scroll to "Open Graph Settings"
4. For "OG Image":
   - Click "Get OG Image from [Collection]"
   - Select your "OG Image URL" field

5. Alternatively, use custom code in Page Settings:
   <meta property="og:image" content="{{wf {&quot;path&quot;:&quot;og-image-url&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}" />

6. Publish your site`,
					tip: "Webflow's OG settings automatically add the meta tags to your page head."
				},
				{
					title: 'Direct API Integration (Advanced)',
					description: 'For developers: integrate directly without Zapier.',
					code: `// Using Webflow's webhook feature + a serverless function:

// 1. In Webflow: Site Settings → Integrations → Add Webhook
// - Trigger: CMS Item Created
// - URL: Your serverless function URL

// 2. Your serverless function (e.g., Vercel):
export default async function handler(req, res) {
  const item = req.body;

  // Generate image with Pictify
  const pictifyRes = await fetch('https://api.pictify.io/v1/render', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.PICTIFY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      templateId: 'your-template-id',
      variables: {
        title: item.name,
        description: item.excerpt
      }
    })
  });

  const { imageUrl } = await pictifyRes.json();

  // Update Webflow CMS item
  await fetch('https://api.webflow.com/collections/{collection_id}/items/{item_id}', {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + process.env.WEBFLOW_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: { 'og-image-url': imageUrl }
    })
  });

  res.status(200).json({ success: true });
}`,
					tip: 'This gives you full control but requires hosting a serverless function.'
				},
				{
					title: 'Test and Publish',
					description: 'Verify the integration works end-to-end.',
					code: `1. Add a new CMS item in Webflow
2. Fill in required fields (title, excerpt, etc.)
3. Save and publish the item
4. Wait 30-60 seconds for the automation to run
5. Check the CMS item - OG Image URL should be populated
6. Publish your Webflow site
7. Test with social debuggers:
   - Facebook: developers.facebook.com/tools/debug/
   - Twitter: cards-dev.twitter.com/validator`,
					tip: 'Remember to publish your site after CMS updates for changes to go live.'
				}
			],
			troubleshooting: [
				{
					issue: 'Zapier not triggering',
					solution:
						'Ensure your Webflow site is published. Zapier only detects changes on published items.'
				},
				{
					issue: 'OG image not showing',
					solution:
						"Verify the CMS field is properly connected in Webflow's OG settings. Check that the URL is valid."
				},
				{
					issue: 'Rate limit errors',
					solution:
						'Add delays between items when processing bulk updates. Both Webflow and Pictify have rate limits.'
				}
			]
		}
	},
	// E-Commerce
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
		docsUrl: 'https://docs.pictify.io/ecommerce/shopify',
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
