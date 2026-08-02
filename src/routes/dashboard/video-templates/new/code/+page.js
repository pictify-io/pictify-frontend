import { redirect } from '@sveltejs/kit';

/** New Remotion templates start in the studio too — see ../[uid]/code/+page.js. */
export const load = () => {
	redirect(302, '/dashboard/video-templates/new/studio?kind=tsx');
};
