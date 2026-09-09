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

/* ── the nine source blocks (TS-7, board TS-05 `LBP-0`) ─────────────────── */

/**
 * What each tool asks for, and what it writes.
 *
 * `fields` drives `SourceBlock.svelte`, so a tool's inputs and the sentence
 * they produce are defined in ONE place — a field that stops being written
 * into the instruction is then a visible inconsistency here rather than a
 * silent one in a component.
 *
 * `label` is the block heading, `cta` the button. Both come from the board.
 */
export const SOURCES = {
	og: {
		label: 'From a page URL',
		cta: 'Make it',
		hint: "Writes the instruction below from the page's title, description, logo and colours, then runs it.",
		fields: [{ key: 'url', placeholder: 'yoursite.com/post', type: 'url' }]
	},
	linkedin: {
		label: 'From your profile',
		cta: 'Make it',
		hint: 'A profile URL, or just your name and headline.',
		fields: [
			{ key: 'url', placeholder: 'linkedin.com/in/you', type: 'url' },
			{ key: 'name', placeholder: 'Your name' },
			{ key: 'headline', placeholder: 'What you do' }
		]
	},
	'social-proof': {
		label: 'From a review',
		cta: 'Make it',
		hint: 'A link to the review, or paste the quote.',
		fields: [
			{ key: 'url', placeholder: 'g2.com/…', type: 'url' },
			{ key: 'quote', placeholder: 'What they said', type: 'textarea' },
			{ key: 'author', placeholder: 'Who said it' }
		]
	},
	certificate: {
		label: 'From the award',
		cta: 'Make it',
		hint: 'The recipient becomes a variable, so one certificate is also a thousand.',
		fields: [
			{ key: 'course', placeholder: 'Course or award' },
			{ key: 'recipient', placeholder: 'Recipient name' },
			{ key: 'issuer', placeholder: 'Issued by' }
		]
	},
	invoice: {
		label: 'From your company',
		cta: 'Make it',
		hint: 'Your site fills the branding; the numbers stay yours to edit.',
		fields: [
			{ key: 'url', placeholder: 'yourcompany.com', type: 'url' },
			{ key: 'number', placeholder: 'Invoice number' },
			{ key: 'client', placeholder: 'Billed to' }
		]
	},
	'email-header': {
		label: 'From your site',
		cta: 'Make it',
		hint: 'The campaign line is the one thing the header has to say.',
		fields: [
			{ key: 'url', placeholder: 'yoursite.com', type: 'url' },
			{ key: 'campaign', placeholder: 'What this email is about' }
		]
	},
	badge: {
		label: 'From the attendee',
		cta: 'Make it',
		hint: 'The role picks the colour band.',
		fields: [
			{ key: 'name', placeholder: 'Attendee name' },
			{ key: 'role', placeholder: 'Speaker, attendee, crew…' },
			{ key: 'event', placeholder: 'Event name' }
		]
	},
	card: {
		label: 'From the details',
		cta: 'Make it',
		hint: 'Two or three lines is enough to start.',
		fields: [
			{ key: 'name', placeholder: 'Name' },
			{ key: 'subtitle', placeholder: 'Role, tier or tagline' },
			{ key: 'org', placeholder: 'Organisation' }
		]
	},
	table: {
		label: 'From a table',
		cta: 'Make it',
		hint: 'Paste rows — tab, comma or markdown. Each row becomes a variable.',
		fields: [{ key: 'rows', placeholder: 'Name\tScore\nAda\t120', type: 'textarea' }]
	},
	code: {
		label: 'From your code',
		cta: 'Make it',
		hint: 'Your markup is in the Code tab. Say what should change about how it looks.',
		fields: [{ key: 'note', placeholder: 'Dark theme, bigger type…' }]
	}
};

const clean = (v) => String(v ?? '').trim();
const quoted = (v) => `“${clean(v)}”`;

/** How many rows a pasted table has, ignoring a header and blank lines. */
export function countRows(text) {
	const lines = clean(text)
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		// markdown separator rows are not data
		.filter((l) => !/^\|?[\s:-]+\|[\s|:-]*$/.test(l));
	return Math.max(0, lines.length - (lines.length > 1 ? 1 : 0));
}

/**
 * The instruction for a source block, from whatever the visitor filled in.
 *
 * Returns '' when there is nothing to say — the caller keeps the button
 * disabled rather than running an AI edit on an empty sentence and spending
 * one of three daily credits to be told nothing changed.
 */
export function writeInstruction(kind, values = {}, info = null) {
	if (kind === 'og') return writeOgInstruction(values.url || '', info);

	const v = Object.fromEntries(Object.entries(values).map(([k, x]) => [k, clean(x)]));
	const brand = () => {
		const bits = [];
		if (info?.logo) bits.push(`the logo at ${info.logo}`);
		const colours = coloursFrom(info?.colors);
		if (colours.length) bits.push(colours.join(' and '));
		return bits.length ? ` Use ${bits.join(' and ')}.` : '';
	};

	switch (kind) {
		case 'linkedin': {
			const who = v.name || (v.url ? hostOf(v.url) : '');
			if (!who && !v.headline) return '';
			const parts = [`Make a LinkedIn banner for ${who || 'me'}.`];
			if (v.headline) parts.push(`The headline is ${quoted(v.headline)}.`);
			// The board draws this zone; the instruction has to respect it too.
			parts.push('Keep the left 20% clear — the profile photo sits there.');
			return parts.join(' ') + brand();
		}
		case 'social-proof': {
			if (!v.quote && !v.url) return '';
			const parts = [];
			parts.push(v.quote ? `Make a social proof card for this review: ${quoted(v.quote)}.` : `Make a social proof card for the review at ${v.url}.`);
			if (v.author) parts.push(`It is by ${v.author}.`);
			if (v.url) parts.push(`Show the ${hostOf(v.url)} mark.`);
			return parts.join(' ') + brand();
		}
		case 'certificate': {
			if (!v.course && !v.recipient) return '';
			const parts = [`Make a certificate of completion for ${v.course ? quoted(v.course) : 'the course'}.`];
			// The recipient is a VARIABLE, which is the whole bulk story.
			if (v.recipient) parts.push(`Put the recipient's name large in the middle as a {{name}} variable, showing ${quoted(v.recipient)} as the sample.`);
			if (v.issuer) parts.push(`Issued by ${v.issuer}.`);
			parts.push('Landscape A4, with room for a date and a signature along the bottom.');
			return parts.join(' ') + brand();
		}
		case 'invoice': {
			if (!v.url && !v.number && !v.client) return '';
			const parts = [`Make a one-page invoice${v.url ? ` for ${hostOf(v.url)}` : ''}.`];
			if (v.number) parts.push(`The invoice number is ${v.number}.`);
			if (v.client) parts.push(`It is billed to ${v.client}.`);
			parts.push('Portrait A4, with a line-item table and a total block.');
			return parts.join(' ') + brand();
		}
		case 'email-header': {
			if (!v.url && !v.campaign) return '';
			const parts = [`Make an email header${v.url ? ` for ${hostOf(v.url)}` : ''}.`];
			if (v.campaign) parts.push(`It is about ${quoted(v.campaign)}.`);
			parts.push('600 × 200, readable at a glance in an inbox.');
			return parts.join(' ') + brand();
		}
		case 'badge': {
			if (!v.name && !v.event) return '';
			const parts = [`Make an event badge${v.event ? ` for ${quoted(v.event)}` : ''}.`];
			if (v.name) parts.push(`The attendee name is ${quoted(v.name)}, as a {{name}} variable.`);
			if (v.role) parts.push(`Their role is ${v.role} — give the role its own colour band.`);
			return parts.join(' ') + brand();
		}
		case 'card': {
			if (!v.name) return '';
			const parts = [`Make a card for ${quoted(v.name)}.`];
			if (v.subtitle) parts.push(`Underneath it says ${quoted(v.subtitle)}.`);
			if (v.org) parts.push(`It is from ${v.org}.`);
			return parts.join(' ') + brand();
		}
		case 'table': {
			const rows = countRows(v.rows);
			if (!rows) return '';
			return (
				`Lay these ${rows} row${rows === 1 ? '' : 's'} out as a leaderboard table, ` +
				'keeping the column alignment and letting the height follow the content. ' +
				'Make the rows a {{rows}} variable so more can be passed in.' + brand()
			);
		}
		case 'code': {
			if (!v.note) return '';
			return `${v.note[0].toUpperCase()}${v.note.slice(1)}${/[.!?]$/.test(v.note) ? '' : '.'} Change only how the markup in the Code tab looks — keep its structure and text.`;
		}
		default:
			return '';
	}
}
