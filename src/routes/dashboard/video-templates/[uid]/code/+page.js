import { redirect } from '@sveltejs/kit';

/**
 * The code view is gone: the studio opens Remotion templates directly.
 *
 * Kept as a redirect rather than deleted because these URLs are out in the
 * world — bookmarks, and anything the MCP server has already handed a user.
 * A 301 would be cached by the browser forever, which is the wrong bet while
 * the editor is still moving, so this is a 302.
 */
export const load = ({ params }) => {
	redirect(302, `/dashboard/video-templates/${params.uid}/studio`);
};
