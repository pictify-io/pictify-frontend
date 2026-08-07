import { redirect } from '@sveltejs/kit';

// Canvas engine removed (2026-08) — HTML is the only image/PDF engine, so the
// old type/engine chooser collapses straight into the HTML editor.
export function load() {
	throw redirect(301, '/template-workspace/html/create?engine=html');
}
