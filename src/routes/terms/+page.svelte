<script>
	/**
	 * /terms — legal prose in the v2 reading column.
	 *
	 * The words, the "Last updated" date and the heading outline (h1, the ten
	 * numbered h2s, their h3 clauses) are the live page's, unchanged. Only the
	 * container moved: no cards, no colour below the hero, a 720px column.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';

	const crumbs = [{ label: 'LEGAL' }, { label: 'TERMS OF SERVICE' }];

	const intro = [
		"Welcome to Pictify.io. These terms and conditions outline the rules and regulations for the use of Pictify.io's website and services.",
		'By accessing this website, you accept these terms and conditions in full. Do not continue to use Pictify.io if you do not accept all of the terms and conditions stated on this page.'
	];

	/** { title, items?: [{ heading, body, bullets? }], paragraphs?: string[] } */
	const sections = [
		{
			title: '1. Definitions',
			items: [
				{
					heading: '1.1. Service',
					body: '"Service" refers to the Pictify.io website and the HTML to Images and GIFs API provided by Pictify.io.'
				},
				{
					heading: '1.2. User',
					body: '"User" refers to any individual or entity that uses the Service.'
				},
				{
					heading: '1.3. Content',
					body: '"Content" refers to text, images, GIFs, and other materials that are generated using the Service.'
				}
			]
		},
		{
			title: '2. Use of Service',
			items: [
				{
					heading: '2.1. Eligibility',
					body: 'By using the Service, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into a binding agreement. If you are using our Service on behalf of an entity, you represent and warrant that you have the authority to bind that entity to these terms.'
				},
				{
					heading: '2.2. Account Registration',
					body: 'To use certain features of the Service, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.'
				},
				{
					heading: '2.3. Prohibited Activities',
					body: 'You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service or impair the ability of others to use the Service, including but not limited to:',
					bullets: [
						'Uploading or sharing any illegal content',
						'Harassing, abusing, or harming another person or entity',
						'Engaging in any unauthorized collection of personal data',
						'Using the Service to generate spam or fraudulent activity',
						'Interfering with or disrupting the integrity or performance of the Service'
					]
				}
			]
		},
		{
			title: '3. User Content',
			items: [
				{
					heading: '3.1. Ownership',
					body: 'You retain ownership of any intellectual property rights that you hold in the Content that you generate using the Service. Pictify.io does not claim ownership of your Content.'
				},
				{
					heading: '3.2. Responsibility',
					body: 'You are solely responsible for the Content that you generate using the Service. You agree not to generate any Content that is illegal, defamatory, obscene, or otherwise objectionable.'
				},
				{
					heading: '3.3. License',
					body: 'By generating Content using the Service, you grant Pictify.io a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the Content in connection with the Service.'
				}
			]
		},
		{
			title: '4. Payment and Refunds',
			items: [
				{
					heading: '4.1. Payment Terms',
					body: 'Certain features of our Service may be subject to fees. By using these features, you agree to pay the fees specified on our website. All fees are in USD. Refunds are only applicable in the window of 7 days from the date of purchase and if you have not generated any images or gif using the Service.'
				},
				{
					heading: '4.2. Subscription',
					body: 'If you subscribe to a recurring payment plan, your subscription will automatically renew at the end of each billing cycle unless you cancel it. You can cancel your subscription at any time through your account settings.'
				},
				{
					heading: '4.3. Refunds',
					body: 'To request a refund, please contact us at support@pictify.io with your purchase details. Refunds will be processed within 7 days of receiving the request.'
				}
			]
		},
		{
			title: '5. Intellectual Property',
			items: [
				{
					heading: '5.1. Ownership',
					body: 'Pictify.io owns all intellectual property rights in the Service, including but not limited to the website, API, and any software used to provide the Service. You agree not to reproduce, distribute, or create derivative works of any part of the Service without our express written consent.'
				}
			]
		},
		{
			title: '6. Termination',
			items: [
				{
					heading: '6.1. Termination by User',
					body: 'You may terminate your account at any time by discontinuing the use of the Service.'
				},
				{
					heading: '6.2. Termination by Pictify.io',
					body: 'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.'
				}
			]
		},
		{
			title: '7. Limitation of Liability',
			paragraphs: [
				'To the fullest extent permitted by applicable law, Pictify.io shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your use or inability to use the Service; (ii) any unauthorized access to or use of our servers and/or any personal information stored therein; (iii) any interruption or cessation of transmission to or from the Service; (iv) any bugs, viruses, trojan horses, or the like that may be transmitted to or through our Service by any third party; (v) any errors or omissions in any Content or for any loss or damage incurred as a result of your use of any Content posted, emailed, transmitted, or otherwise made available through the Service; and/or (vi) the defamatory, offensive, or illegal conduct of any third party.'
			]
		},
		{
			title: '8. Governing Law',
			paragraphs: [
				'These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.'
			]
		},
		{
			title: '9. Changes to Terms',
			paragraphs: [
				"We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion."
			]
		},
		{
			title: '10. Contact Us',
			paragraphs: [
				'If you have any questions about these Terms, please contact us at support@pictify.io',
				'Please review these terms periodically for changes. Your continued use of or access to the Service following the posting of any changes constitutes acceptance of those changes.'
			]
		}
	];
</script>

<ToolPageShell
	{crumbs}
	facts="LAST UPDATED · 18 JULY 2024"
	longform="column"
	heroDecor={false}
	readingWidth="max-w-[720px]"
	showSignup={false}
	showRelated={false}
	showClosing={false}
>
	<HeroTitle slot="h1">Terms of Service</HeroTitle>

	<svelte:fragment slot="longform">
		<Prose>
			{#each intro as paragraph}
				<p>{paragraph}</p>
			{/each}
		</Prose>

		{#each sections as section, i (section.title)}
			<LongformSection index="" first={i === 0} compact title={section.title}>
				{#if section.items}
					<ProseGroup items={section.items} />
				{/if}
				{#if section.paragraphs}
					<Prose>
						{#each section.paragraphs as paragraph}
							<p>{paragraph}</p>
						{/each}
					</Prose>
				{/if}
			</LongformSection>
		{/each}
	</svelte:fragment>
</ToolPageShell>
