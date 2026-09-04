/**
 * The CSV rules, shared with the backend.
 *
 * The frontend validates so it can say what is wrong beside the field; the
 * backend validates because the frontend is not a security boundary. Both must
 * agree exactly, or a file passes here and is rejected after upload — so the
 * rules live in one file with fixtures both suites run (spec §13 QA-01).
 *
 * Three rules carry most of the weight:
 *
 *   IDs are strings.      `00042` is not 42. Losing a leading zero silently
 *                         re-points a summary at a different customer, and
 *                         nothing downstream would notice (INV-01).
 *   Blank is not zero.    An omitted optional metric is suppressed. Coercing it
 *                         to 0 would state a fact the customer never supplied.
 *   Nothing is repaired.  An unsafe ID is reported, never rewritten: silently
 *                         escaping it would break the join it exists for.
 */

export const LIMITS = {
	/** Proposed in spec §; enforced server-side too and revised only from measured need. */
	maxBytes: 2 * 1024 * 1024,
	maxRows: 250,
	maxColumns: 32
};

/**
 * R1 account-id grammar: 1–128 chars, starting with an ASCII letter or digit,
 * continuing with letters, digits, underscore, dot, colon or hyphen. Case and
 * leading zeroes are preserved exactly as supplied.
 */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
export const isSafeAccountId = (value) => typeof value === 'string' && SAFE_ID.test(value);

/**
 * Dot-decimal only, no grouping or currency symbols, no exponent.
 *
 * A locale-formatted number is ambiguous, not merely awkward: `1.234` is one
 * value in en-US and a thousand times that in de-DE, and guessing which would
 * silently publish a wrong figure. Rejected with an instruction instead.
 */
const DECIMAL = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const MAX_MAGNITUDE = 1e15;

export function parseDecimal(raw) {
	if (typeof raw !== 'string') return { ok: false, code: 'not_a_number' };
	const text = raw.trim();
	if (text === '') return { ok: false, code: 'blank' };
	if (!DECIMAL.test(text)) {
		if (/[,\s]/.test(text)) return { ok: false, code: 'grouping_or_locale' };
		if (/[^0-9.\-]/.test(text)) return { ok: false, code: 'symbol_in_number' };
		return { ok: false, code: 'not_a_number' };
	}
	const value = Number(text);
	if (!Number.isFinite(value)) return { ok: false, code: 'not_finite' };
	if (Math.abs(value) > MAX_MAGNITUDE) return { ok: false, code: 'magnitude' };
	return { ok: true, value };
}

/** Strip a UTF-8 BOM. Excel writes one; it is not part of the first header. */
export const stripBom = (text) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/**
 * RFC4180-ish parse. Deliberately strict where the spec blocks:
 * an unclosed quote is an error, not a field that runs to end-of-file.
 */
export function parseCsv(input) {
	const text = stripBom(String(input ?? '')).replace(/\r\n?/g, '\n');
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;
	let started = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += c;
			}
			continue;
		}
		if (c === '"' && field === '') {
			quoted = true;
			started = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
			started = true;
		} else if (c === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			started = false;
		} else {
			field += c;
			started = true;
		}
	}
	if (quoted) return { ok: false, code: 'unclosed_quote' };
	if (field !== '' || started || row.length) {
		row.push(field);
		rows.push(row);
	}
	return { ok: true, rows };
}

/**
 * Validate a file's shape before any mapping is offered.
 *
 * Returns blocking `errors` (the file cannot be used) separately from `rows`,
 * because the UI shows the two very differently: a blocked file gets one
 * sentence, a valid file gets a mapping table.
 */
export function validateCsvShape(input, { maxBytes = LIMITS.maxBytes } = {}) {
	const errors = [];
	const byteLength = typeof input === 'string' ? new TextEncoder().encode(input).length : 0;
	if (byteLength > maxBytes) {
		errors.push({ code: 'over_size', bytes: byteLength, limit: maxBytes });
		// No point parsing megabytes we have already refused.
		return { ok: false, errors };
	}

	const parsed = parseCsv(input);
	if (!parsed.ok) return { ok: false, errors: [{ code: parsed.code }] };

	const rows = parsed.rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
	if (!rows.length) return { ok: false, errors: [{ code: 'empty_file' }] };

	const header = rows[0].map((h) => h.trim());
	const body = rows.slice(1);

	if (header.length > LIMITS.maxColumns) {
		errors.push({ code: 'over_columns', columns: header.length, limit: LIMITS.maxColumns });
	}
	if (body.length > LIMITS.maxRows) {
		errors.push({ code: 'over_rows', rows: body.length, limit: LIMITS.maxRows });
	}
	if (header.some((h) => h === '')) errors.push({ code: 'blank_header' });

	// Duplicate headers block: a mapping cannot say which column it meant.
	const seen = new Map();
	const duplicates = [];
	for (const h of header) {
		const key = h.toLowerCase();
		if (seen.has(key) && !duplicates.includes(h)) duplicates.push(h);
		seen.set(key, true);
	}
	if (duplicates.length) errors.push({ code: 'duplicate_headers', headers: duplicates });

	// Uneven rows block rather than being padded: a short row means the file is
	// not what the header claims, and padding invents blanks nobody supplied.
	const uneven = [];
	body.forEach((r, i) => {
		if (r.length !== header.length)
			uneven.push({ line: i + 2, got: r.length, want: header.length });
	});
	if (uneven.length)
		errors.push({ code: 'uneven_rows', rows: uneven.slice(0, 5), total: uneven.length });

	return { ok: errors.length === 0, errors, header, rows: body, byteLength };
}

/**
 * Neutralise a value that a spreadsheet would execute.
 *
 * Applies to human-facing text we WRITE OUT (error reports, manifest names),
 * never to an account id — see the module note. Excel treats a leading
 * `= + - @`, tab or CR as the start of a formula.
 */
export function spreadsheetSafe(value) {
	const text = String(value ?? '');
	return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

/** Quote for CSV output: doubles internal quotes, wraps when it has to. */
export function csvCell(value) {
	const text = spreadsheetSafe(value);
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const csvRow = (values) => values.map(csvCell).join(',');

/**
 * Validate one mapped row.
 *
 * `columns` is the confirmed mapping: `{ key, label, required, type }`.
 * Anything not mapped is ignored and never read, so an unmapped column cannot
 * reach the renderer or storage.
 */
export function validateRow(record, columns, { accountIdKey = 'account_id' } = {}) {
	const issues = [];
	const value = {};

	const rawId = record[accountIdKey];
	if (rawId === undefined || String(rawId).trim() === '') {
		issues.push({ field: accountIdKey, code: 'required_missing' });
	} else if (!isSafeAccountId(String(rawId).trim())) {
		// Reported, never rewritten: the id is the join key (INV-01).
		issues.push({ field: accountIdKey, code: 'unsafe_account_id', value: String(rawId).trim() });
	} else {
		value[accountIdKey] = String(rawId).trim();
	}

	for (const col of columns) {
		if (col.key === accountIdKey) continue;
		const raw = record[col.key];
		const blank = raw === undefined || String(raw).trim() === '';

		if (blank) {
			// Required blank is an error; optional blank suppresses the metric and
			// is NOT coerced to zero.
			if (col.required) issues.push({ field: col.key, code: 'required_missing' });
			else value[col.key] = null;
			continue;
		}

		if (col.type === 'number') {
			const parsed = parseDecimal(String(raw));
			if (!parsed.ok) issues.push({ field: col.key, code: parsed.code, value: String(raw) });
			else value[col.key] = parsed.value;
		} else {
			value[col.key] = String(raw);
		}
	}

	return { ok: issues.length === 0, value, issues };
}
