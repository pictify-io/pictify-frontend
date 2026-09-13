<script>
	/**
	 * /privacy — legal prose in the v2 reading column.
	 *
	 * The words, the "Last updated" date and the heading outline are the live
	 * page's, unchanged. Only the container moved: no cards, no colour below
	 * the hero, a 720px column.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import ProseGroup from '$lib/components/tools/v2/longform/ProseGroup.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';

	const crumbs = [{ label: 'LEGAL' }, { label: 'PRIVACY POLICY' }];

	const intro =
		'Pictify.io ("we," "us," or "our") operates the website https://pictify.io (the "Service"). Your privacy is important to us. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our Service.';

	/** { title, items?: [{ heading, body, bullets? }], paragraphs?: string[] } */
	const sections = [
		{
			title: '1. Information we collect',
			items: [
				{
					heading: '1.1. Personal Information',
					body: 'We only ask for personal information when we truly need it to provide a service to you. The types of personal information we may collect include, but are not limited to:',
					bullets: ['Email Address', 'Billing Information']
				},
				{
					heading: '1.2. Non Personal Information',
					body: "We may collect non-personal information about users whenever they interact with our website. Non-personal information may include the browser name, the type of computer, and technical information about users' means of connection to our website, such as the operating system and the Internet service providers utilized, and other similar information."
				}
			]
		},
		{
			title: '2. How We Collect Information',
			items: [
				{
					heading: '2.1. Voluntary Information',
					body: 'We collect personal information from you only when you voluntarily submit it to us, for instance, when you register for an account, place an order, or fill out a form.'
				},
				{
					heading: '2.2. Information Collected Automatically',
					body: 'We may automatically collect certain information about you when you visit our website. This information may include your IP address, browser type, domain names, access times, and referring website addresses. This information is used for operational purposes and to provide general statistics regarding the use of our website. We may use cookies, web beacons, tracking pixels, and other tracking technologies on the website to help customize the website and improve your experience.'
				}
			]
		},
		{
			title: '3. Use of Collected Information',
			items: [
				{
					heading: '3.1 Providing and Improving Our Services',
					body: 'We use the information we collect to:',
					bullets: [
						'Provide, operate, and maintain our website',
						'Improve, personalize, and expand our website',
						'Understand and analyze how you use our website',
						'Develop new products, services, features, and functionality'
					]
				},
				{
					heading: '3.2 Communication',
					body: 'We may use your information to contact you with newsletters, marketing, or promotional materials and other information that may be of interest to you. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.'
				}
			]
		},
		{
			title: '4. Data Retention',
			paragraphs: [
				'We only retain collected information for as long as necessary to provide you with your requested service. Once the data is no longer needed, we will delete it using commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.'
			]
		},
		{
			title: '5. Security of Your Information',
			paragraphs: [
				'We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. However, no method of transmission over the Internet, or method of electronic storage is 100% secure, and we cannot guarantee absolute security.'
			]
		},
		{
			title: '6. Data Sharing and Disclosure',
			paragraphs: [
				'We do not share any personally identifying information publicly or with third parties, except when required to by law. Any image or data uploaded or created on Pictify.io is not shared with any third parties. The user has full control over the data created by them using Pictify.io.'
			]
		},
		{
			title: '7. Third-Party Links',
			paragraphs: [
				'Our website may contain links to third-party websites. Any access to and use of such linked websites is not governed by this Privacy Policy but instead is governed by the privacy policies of those third-party websites. We are not responsible for the information practices of such third-party websites.'
			]
		},
		{
			title: '8. Your Rights',
			paragraphs: [
				'You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. If you have any questions about how we handle user data and personal information, feel free to contact us at support@pictify.io'
			]
		},
		{
			title: '9. Changes to This Privacy Policy',
			paragraphs: [
				'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "effective date" at the top of this Privacy Policy.'
			]
		}
	];

	const closing =
		'By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this Privacy Policy, please do not use our Service.';
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
	<HeroTitle slot="h1">Privacy Policy</HeroTitle>

	<svelte:fragment slot="longform">
		<Prose>
			<p>{intro}</p>
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

		<Prose>
			<p>{closing}</p>
		</Prose>
	</svelte:fragment>
</ToolPageShell>
