/**
 * Escape a value for safe interpolation inside XML text nodes (e.g. sitemap
 * <loc> entries). Dynamic slugs come from the database and may contain &, ', "
 * or angle brackets, which would otherwise produce invalid XML.
 */
export function xmlEscape(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
