/**
 * Turning what we know about a source into an instruction a person can read.
 * TS-5a (board TS-05 `LBP-0`).
 *
 * The instruction is WRITTEN INTO THE COMPOSER, not sent invisibly. That is the
 * whole design: a URL box that silently produced a card would leave the visitor
 * with no way to steer the second attempt, and no way to learn what the tool
 * responds to. They see the sentence, they can edit it, they can run it again.
 *
 * So it is prose, not a payload. Every branch here exists because the source
 * did not give us something — a page with no description, no logo, no palette —
 * and the sentence still has to read like a person wrote it.
 */

/** `example.com/post` → `example.com`, and never throws on rubbish. */
export function hostOf(target) {
	const raw = String(target || '').trim();
	if (!raw) return '';
	try {
		return new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./, '');
	} catch {
		return raw;
	}
}

/** `[r,g,b]` triples → css. Anything malformed is dropped rather than printed. */
export function coloursFrom(colors, take = 2) {
	return (Array.isArray(colors) ? colors : [])
		.filter((c) => Array.isArray(c) && c.length >= 3 && c.every((n) => Number.isFinite(n)))
		.slice(0, take)
		.map((c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
}

/**
 * The OG-image instruction. `info` is `/api/tools/website-info`'s shape, or
 * null when the page could not be read — in which case the sentence is built
 * from the URL alone rather than left empty.
 */
export function writeOgInstruction(target, info) {
	const site = hostOf(target);
	const title = String(info?.title || '').trim();
    const description = String(info?.description || '').trim();
	const colours = coloursFrom(info?.colors);

	let opener = `Make an OG image for ${title ? `“${title}”` : site}`;
	if (title && site) opener += ` by ${site}`;
	const parts = [`${opener}.`];

	if (info?.logo) parts.push(`Use the logo at ${info.logo}.`);
	if (colours.length === 1) parts.push(`Use ${colours[0]} as the brand colour.`);
	if (colours.length > 1) parts.push(`Use ${colours.join(' and ')} as the brand colours.`);
	if (description) parts.push(`Use this as the subtitle: “${description}”.`);
	// Said only when we have nothing else, so the agent is not left guessing.
	if (!title && !description && !colours.length && !info?.logo) {
		parts.push('Keep it clean and readable — the site name large, plenty of contrast.');
	}
	return parts.join(' ');
}
