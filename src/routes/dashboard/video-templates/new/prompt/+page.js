import { redirect } from '@sveltejs/kit';

/**
 * Retired: "Video from a prompt" is now a modal on the Templates page
 * (boards CF-02…04). Old links keep working and keep their brief.
 */
export const load = ({ url }) => {
	const target = new URLSearchParams({ create: 'video' });
	const prompt = url.searchParams.get('prompt');
	if (prompt) target.set('prompt', prompt);
	redirect(307, `/dashboard/template?${target}`);
};
