/**
 * Small dependency-free CSV parser.
 *
 * Handles quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, and CRLF/CR/LF line endings. Returns { headers, rows } where each
 * row is an object keyed by header.
 */

export const MAX_ROWS = 1000;

/**
 * Parse raw CSV text into records (arrays of strings).
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsvRecords(text) {
	const records = [];
	let field = '';
	let record = [];
	let inQuotes = false;
	let i = 0;

	// Strip BOM
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

	const pushField = () => {
		record.push(field);
		field = '';
	};
	const pushRecord = () => {
		pushField();
		// Skip records that are entirely empty (blank lines)
		if (record.length > 1 || record[0].trim() !== '') {
			records.push(record);
		}
		record = [];
	};

	while (i < text.length) {
		const char = text[i];
		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i += 1;
				continue;
			}
			field += char;
			i += 1;
			continue;
		}
		if (char === '"') {
			inQuotes = true;
			i += 1;
			continue;
		}
		if (char === ',') {
			pushField();
			i += 1;
			continue;
		}
		if (char === '\r') {
			pushRecord();
			i += text[i + 1] === '\n' ? 2 : 1;
			continue;
		}
		if (char === '\n') {
			pushRecord();
			i += 1;
			continue;
		}
		field += char;
		i += 1;
	}

	// Flush trailing field/record (no final newline)
	if (field !== '' || record.length > 0) {
		pushRecord();
	}

	return records;
}

/**
 * Parse CSV text into { headers, rows, truncated, totalRows }.
 * Rows are objects keyed by header. Caps at MAX_ROWS data rows.
 * @param {string} text
 */
export function parseCsv(text) {
	const records = parseCsvRecords(text || '');
	if (records.length === 0) {
		return { headers: [], rows: [], truncated: false, totalRows: 0 };
	}

	const headers = records[0].map((h, idx) => {
		const name = String(h || '').trim();
		return name || `Column ${idx + 1}`;
	});

	const dataRecords = records.slice(1);
	const truncated = dataRecords.length > MAX_ROWS;
	const rows = dataRecords.slice(0, MAX_ROWS).map((record) => {
		const row = {};
		headers.forEach((header, idx) => {
			row[header] = record[idx] !== undefined ? record[idx].trim() : '';
		});
		return row;
	});

	return { headers, rows, truncated, totalRows: dataRecords.length };
}
