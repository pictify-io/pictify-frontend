import { json } from '@sveltejs/kit';

/**
 * Lead Capture API Endpoint
 * Captures email leads from various sources (tools, exit intent, etc.)
 *
 * POST /api/leads/capture
 * Body: { email, source, toolName?, generatedUrl? }
 */

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { email, source, toolName, generatedUrl } = body;

		// Basic validation
		if (!email || !email.includes('@')) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		// Log the lead capture (in production, this would go to a database or CRM)

		// TODO: In production, implement one of these:
		// 1. Save to database
		// 2. Send to email marketing service (Mailchimp, ConvertKit, etc.)
		// 3. Send to CRM (HubSpot, Salesforce, etc.)
		// 4. Send webhook to Zapier/Make

		// Example: Send to backend API
		// try {
		//   await fetch('https://api.pictify.io/leads', {
		//     method: 'POST',
		//     headers: { 'Content-Type': 'application/json' },
		//     body: JSON.stringify({ email, source, toolName, generatedUrl })
		//   });
		// } catch (err) {
		//   console.error('Failed to send lead to backend:', err);
		// }

		return json({
			success: true,
			message: 'Lead captured successfully'
		});
	} catch (error) {
		return json({ error: 'Failed to capture lead' }, { status: 500 });
	}
}
