<script>
  import Nav from '$lib/components/landingPage/Nav.svelte';
  import Footer from '$lib/components/landingPage/Footer.svelte';
  import InvoiceTemplate from '$lib/components/tools/InvoiceTemplate.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { getTemplates, getTemplate } from '../../../api/tools/invoice.js';
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import { createImagePublic } from '../../../api/image.js';

  let templates = [];
  let templateNames = [];
  let selectedTemplate = '';
  let total = 0;
  let imageUrl = '';
  let isImageGenerating = false;
  let logo;
  let invoiceData = {
    companyName: '',
    companyAddress: '',
    clientName: '',
    clientAddress: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    notes: '',
    logo: '',
    taxRate: 0
  };

  let invoiceTemplateWrapper;
  let windowWidth;

  // Function to calculate iframe scale based on window width
  function calculateScale(width) {
    if (width < 640) return 0.3; // Mobile
    if (width < 1024) return 0.4; // Tablet
    return 0.6; // Desktop
  }

  function sharePage(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this awesome OG Image Generator!');
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('OG Image Generator')}&summary=${text}`, '_blank');
    }
  }

  function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
		});
	}

  $: iframeScale = calculateScale(windowWidth);

  onMount(async () => {
    templateNames = await getTemplates();
    for (const template of templateNames) {
      const html = await getTemplate(template);
      templates.push(html);
    }
    if (templates.length > 0) {
      selectedTemplate = templates[0];
    }
  });

  function addItem() {
    invoiceData.items = [...invoiceData.items, { description: '', quantity: 1, price: 0 }];
  }

  function removeItem(index) {
    invoiceData.items = invoiceData.items.filter((_, i) => i !== index);
  }

  function calculateTotal() {
    return invoiceData.items.reduce((total, item) => total + item.quantity * item.price, 0) + (invoiceData.taxRate > 0 ? (invoiceData.items.reduce((total, item) => total + item.quantity * item.price, 0) * invoiceData.taxRate) / 100 : 0);
  }

  function updateLogo(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        invoiceData.logo = e.target.result;
        updateHTML(selectedTemplate);
      };
      reader.readAsDataURL(file);
    }
  }


  async function generateInvoice() {
    console.log('generateInvoice');
    isImageGenerating = true;
    // This function would generate the invoice based on the selected template and invoice data
    // For now, we'll just show a toast message
    const iframe = invoiceTemplateWrapper.querySelector('iframe');

    const document = iframe.contentWindow.document;
    const {image} = await createImagePublic({
      html: document.documentElement.outerHTML,
      width: 800,
    });
    imageUrl = image.url;
    isImageGenerating = false;
  }

  function updateTemplate(template) {
    selectedTemplate = template;
    updateHTML(selectedTemplate);
    // Here you would update the invoice preview based on the selected template
  }

  function updateHTML(html) { 
    if(!invoiceTemplateWrapper) {
      return;
    }
    const iframe = invoiceTemplateWrapper.querySelector('iframe');

    const document = iframe.contentWindow.document;
    console.log(document);
    const companyName = document.querySelector('#company-name');
    const companyAddress = document.querySelector('#company-address');
    const clientName = document.querySelector('#client-name');
    const clientAddress = document.querySelector('#client-address');
    const invoiceNumber = document.querySelector('#invoice-number');
    const invoiceDate = document.querySelector('#invoice-date');
    const dueDate = document.querySelector('#due-date');
    const items = document.querySelector('#line-items');
    const notes = document.querySelector('#additional-notes');
    const taxAmount = document.querySelector('#tax-amount');
    const subtotal = document.querySelector('#subtotal');

    const logo = document.querySelector('.logo');
    const itemsHTML = invoiceData.items.map(item => {
      return `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.price?.toFixed(2) || 0}</td>
          <td>$${(item.quantity * (item.price || 0)).toFixed(2)}</td>
        </tr>
      `;
    }).join('');
    companyName.innerHTML = invoiceData.companyName || '';
    companyAddress.innerHTML = invoiceData.companyAddress || '';
    clientName.innerHTML = invoiceData.clientName || '';
    clientAddress.innerHTML = invoiceData.clientAddress || '';
    invoiceNumber.innerHTML = invoiceData.invoiceNumber || '';
    invoiceDate.innerHTML = invoiceData.invoiceDate || '';
    dueDate.innerHTML = invoiceData.dueDate || '';
    items.innerHTML =  `<tbody id="line-items">${itemsHTML}</tbody>`;
    notes.innerHTML = invoiceData.notes || '';

    const updatedLogo = document.createElement('img');
    updatedLogo.src = invoiceData.logo;
    updatedLogo.classList.add('logo');
    logo.parentNode.replaceChild(updatedLogo, logo);

    total = calculateTotal();
    const tax = (total * invoiceData.taxRate) / 100;
    const totalElement = document.querySelector('#total-amount');
    totalElement.innerHTML = `$${total.toFixed(2)}`;
    taxAmount.innerHTML = `$${tax.toFixed(2)}`;
    subtotal.innerHTML = `$${invoiceData.items.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2)}`;
    html = document.documentElement.outerHTML;
  }
</script>

<svelte:head>
  <title>Free Online Invoice Generator | Pictify.io</title>
  <meta name="description" content="Create professional invoices for free with Pictify.io's Online Invoice Generator. Customize templates, add your branding, and generate invoices in seconds.">
  <meta name="keywords" content="invoice generator, free invoice, online invoice, business tools">
  <link rel="canonical" href="https://pictify.io/tools/online-invoice-generator">
  <meta property="og:title" content="Online Invoice Generator | Pictify.io">
  <meta property="og:description" content="Create custom invoices to streamline your billing process and maintain a professional image.">
  <meta property="og:image" content="https://media.pictify.io/zuhz9-1725661278941.png">
  <meta property="og:url" content="https://pictify.io/tools/online-invoice-generator">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@pictify_io">
  <meta name="twitter:title" content="Online Invoice Generator | Pictify.io">
  <meta name="twitter:description" content="Create custom invoices to streamline your billing process and maintain a professional image.">
  <meta name="twitter:image" content="https://media.pictify.io/zuhz9-1725661278941.png">
  <script type="application/ld+json">
  {
    "@context": "http://schema.org",
    "@type": "WebApplication",
    "name": "Pictify.io Online Invoice Generator",
    "url": "https://pictify.io/tools/online-invoice-generator",
    "description": "Create custom invoices to streamline your billing process and maintain a professional image.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
</svelte:head>

<svelte:window bind:innerWidth={windowWidth} />

<section>
  <Nav />
  <main class="z-10 w-full py-5 md:px-0 px-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto">
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter w-full inline-block text-left md:text-center">
      Online Invoice Generator
    </h1>
    <h2 class="max-w-3xl opacity-90 md:text-center text-xl">
      Create professional invoices for your business with our easy-to-use online invoice generator.
    </h2>
  </main>

  <div class="px-4 sm:px-6 lg:px-8 mt-20 w-full max-w-7xl mx-auto">
    <div class="flex flex-col lg:flex-row gap-8">
      <div class="w-full lg:w-1/2">
        <h3 class="text-2xl font-bold mb-4">Invoice Details</h3>
        <input
          bind:value={invoiceData.companyName}
          type="text"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          placeholder="Your Company Name"
          on:input={updateHTML(selectedTemplate)}
        />
        <input
          type="file"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          accept="image/*"
          placeholder="Your Company Logo"
          on:change={updateLogo}
        />
        <textarea
          bind:value={invoiceData.companyAddress}
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          placeholder="Your Company Address"
          rows="3"
          on:input={updateHTML(selectedTemplate)}
        ></textarea>
        <input
          bind:value={invoiceData.clientName}
          type="text"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          placeholder="Client Name"
          on:input={updateHTML(selectedTemplate)}
        />
        <textarea
          bind:value={invoiceData.clientAddress}
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          placeholder="Client Address"
          rows="3"
          on:input={updateHTML(selectedTemplate)}
        ></textarea>
        <input
          bind:value={invoiceData.invoiceNumber}
          type="text"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          placeholder="Invoice Number"
          on:input={updateHTML(selectedTemplate)}
        />
        <input
          bind:value={invoiceData.invoiceDate}
          type="date"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          on:input={updateHTML(selectedTemplate)}
        />
        <input
          bind:value={invoiceData.dueDate}
          type="date"
          class="w-full border-2 border-gray-300 p-2 rounded mb-4"
          on:input={updateHTML(selectedTemplate)}
        />

        <h4 class="text-xl font-bold mb-2">Invoice Items</h4>
        {#each invoiceData.items as item, index}
          <div class="flex  gap-2 mb-2">
            <input
              bind:value={item.description}
              type="text"
              class="flex-grow min-w-[200px] border-2 border-gray-300 p-2 rounded mb-2"
              placeholder="Item description"
              on:input={updateHTML(selectedTemplate)}
            />
            <input
              bind:value={item.quantity}
              type="number"
              class="w-14 border-2 border-gray-300 p-2 rounded mb-2"
              placeholder="Qty"
              on:input={updateHTML(selectedTemplate)}
            />
            <input
              bind:value={item.price}
              type="number"
              class="w-20 border-2 border-gray-300 p-2 rounded mb-2"
              placeholder="Price ($)"
              on:input={updateHTML(selectedTemplate)}
            />
            <button
              on:click={() => removeItem(index)}
              class="bg-[#ef4444] hover:bg-[#dc2626] text-white p-2 rounded mb-2"
              on:change={updateHTML(selectedTemplate)}
            >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            </button>
          </div>
        {/each}
        <button
          on:click={addItem}
          class="bg-blue-500 text-white p-2 rounded mt-2"
          on:change={updateHTML(selectedTemplate)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
          </svg>
        </button>

        <div class="flex flex-col gap-2 mt-2">
          <label for="tax-rate">Tax Rate (%)</label>
          <input
            bind:value={invoiceData.taxRate}
            type="number"
            class="w-20 border-2 border-gray-300 p-2 rounded mb-2"
            placeholder="Tax Rate (%)"
            on:input={updateHTML(selectedTemplate)}
          />
        </div>

        <textarea
          bind:value={invoiceData.notes}
          class="w-full border-2 border-gray-300 p-2 rounded mt-4"
          placeholder="Additional Notes"
          rows="3"
          on:input={updateHTML(selectedTemplate)}
        ></textarea>

        <div class="mt-4 text-xl font-bold">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      <div class="w-fit">
        <h3 class="text-2xl font-bold mb-4">Invoice Preview</h3>
        <div bind:this={invoiceTemplateWrapper} class="border-2 border-gray-300 p-2 rounded overflow-hidden w-fit md:w-full">
          <InvoiceTemplate html={selectedTemplate} width={800} height={1200} scale={iframeScale} />
        </div>
      </div>
    </div>

    <div class="mt-8">
      <button
        on:click={generateInvoice}
        class="w-full bg-green-500 text-white text-lg font-medium py-3.5 rounded hover:bg-green-600 transition-colors duration-300"
      >
        Generate Invoice
      </button>
      {#if isImageGenerating}
      <div class="mt-8">
        <div class="w-full text-gray-900 text-lg font-medium py-3.5 rounded bg-gray-100 shadow-md">
          <p class="text-center mb-2">Generating Image...</p>
          <div class="w-11/12 mx-auto bg-gray-200 rounded-full h-3">
            <div class="bg-gray-900 h-3 rounded-full loading-bar"></div>
          </div>
        </div>
      </div>
      {/if}
      {#if imageUrl}
        <div class="mt-8 p-6 bg-white rounded-lg shadow-lg  m-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">Generated Invoice</h3>
            <button
              on:click={() => copyToClipboard(imageUrl)}
              class="px-4 py-2 bg-black text-white rounded hover:bg-black-600 transition-colors duration-300"
            >
              Copy URL
            </button>
          </div>
          <div class="mb-4 break-all ">
            <a href={imageUrl} download="invoice.jpg" class="text-black hover:underline">
              {imageUrl}
            </a>
          </div>
          <img src={imageUrl} alt="Invoice" class="w-full max-w-3xl mt-4 m-auto h-auto rounded-lg shadow-md" />
        </div>
      {/if}
    </div>

    <div class="mt-20 mb-10 text-2xl font-bold">
      Invoice Templates
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
      {#each templates as template}
        <div
          class="{selectedTemplate === template ? 'border-4 border-green-500' : 'border-2 border-gray-300'} cursor-pointer p-2 rounded overflow-hidden w-fit relative"
          on:click={() => updateTemplate(template)}
        >
        <div class="absolute inset-0" style="z-index: 1;" on:click|stopPropagation={() => updateTemplate(template)}></div>
          <InvoiceTemplate html={template} width={800} height={800} scale={iframeScale * 0.5} />
        </div>
      {/each}
    </div>
  </div>

  <!-- Separator -->
  <div class="max-w-4xl mx-auto px-6 md:px-0 my-20">
    <div class="border-t-4 border-gray-900 relative">
      <div class="absolute left-1/2 -top-4 -translate-x-1/2 bg-white px-4">
        <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>

  <!-- New SEO-optimized sections -->
  <div class="max-w-4xl mx-auto px-6 md:px-0 mb-20">
    <h2 class="text-4xl font-bold mb-10 text-center">Learn More About Online Invoice Generation</h2>
    
    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">What is an Online Invoice Generator?</h3>
      <p class="text-lg">
        An online invoice generator is a powerful tool that allows businesses and freelancers to create professional invoices quickly and easily. It streamlines the billing process, helps maintain accurate financial records, and presents a polished image to clients.
      </p>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Benefits of Using Our Online Invoice Generator</h3>
      <ul class="list-disc list-inside text-lg">
        <li>Create professional invoices in minutes</li>
        <li>Customize templates to match your brand</li>
        <li>Automate calculations for taxes and totals</li>
        <li>Save time on billing and bookkeeping</li>
        <li>Access your invoices from anywhere, anytime</li>
        <li>Improve cash flow with prompt, accurate billing</li>
      </ul>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">How to Use Our Online Invoice Generator</h3>
      <ol class="list-decimal list-inside text-lg">
        <li>Enter your company and client details</li>
        <li>Choose from our selection of professional invoice templates</li>
        <li>Add line items for products or services</li>
        <li>Set tax rates and discounts if applicable</li>
        <li>Preview your invoice in real-time</li>
        <li>Generate and download your custom invoice</li>
      </ol>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Why Professional Invoices Matter for Your Business</h3>
      <p class="text-lg">
        Professional invoices play a crucial role in maintaining a positive business image and ensuring timely payments. They provide clear communication about services rendered, payment terms, and due dates. By using our online invoice generator, you can create consistent, branded invoices that reflect the quality of your work and help you get paid faster.
      </p>
    </section>

    <section class="mb-16">
      <h3 class="text-3xl font-bold mb-6">Best Practices for Creating Effective Invoices</h3>
      <p class="text-lg mb-4">
        To maximize the effectiveness of your invoices, follow these best practices:
      </p>
      <ul class="list-disc list-inside text-lg">
        <li>Use clear, professional language</li>
        <li>Include all necessary details (invoice number, date, payment terms)</li>
        <li>Clearly itemize products or services</li>
        <li>Include your company logo for brand recognition</li>
        <li>Set clear payment terms and due dates</li>
        <li>Provide multiple payment options for convenience</li>
        <li>Use a consistent format for all your invoices</li>
        <li>Double-check all calculations before sending</li>
      </ul>
      <p class="text-lg mt-4">
        By following these guidelines and using our online invoice generator, you can create professional invoices that help you maintain a positive cash flow and project a professional image to your clients.
      </p>
    </section>
  </div>

  <section class="max-w-4xl mx-auto px-6 md:px-0 mb-20">
    <h3 class="text-3xl font-bold mb-6">Frequently Asked Questions</h3>
    <div class="space-y-4">
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">How do I use this invoice generator?</summary>
        <p class="mt-2">Simply fill in your company and client details, add invoice items, select a template, and click "Generate Invoice". You can then download or print your professional invoice.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">Is this invoice generator free to use?</summary>
        <p class="mt-2">Yes, our online invoice generator is completely free to use. You can create and download as many invoices as you need without any cost.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">Can I customize the invoice template?</summary>
        <p class="mt-2">While you can't fully customize the templates, you can choose from a variety of professional designs. Each template can be populated with your specific invoice details.</p>
      </details>
      <details class="bg-gray-100 p-4 rounded-lg">
        <summary class="font-semibold cursor-pointer">Are the generated invoices legally compliant?</summary>
        <p class="mt-2">Our invoice templates include standard elements required for most invoices. However, please check your local regulations to ensure compliance with specific requirements in your jurisdiction.</p>
      </details>
    </div>
  </section>

  <div class="mt-8 mb-8 flex flex-col md:flex-row justify-center md:space-x-4">
    <button
      class="flex items-center justify-center px-6 py-3 bg-[#1DA1F2] text-white font-semibold rounded-full hover:bg-[#1a91da] transition duration-300 ease-in-out"
      on:click={() => sharePage('twitter')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
      Share on Twitter
    </button>
    <button
      class="flex items-center justify-center px-6 py-3 mt-4 md:mt-0 bg-[#0A66C2] text-white font-semibold rounded-full hover:bg-[#094d92] transition duration-300 ease-in-out"
      on:click={() => sharePage('linkedin')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Share on LinkedIn
    </button>
  </div>

  <Toast /> 
  <Footer />
</section>

<style>
  @keyframes loading {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }

  .loading-bar {
    width: 0%;
    animation: loading 3s forwards;
  }
</style>