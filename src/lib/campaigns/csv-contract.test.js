import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
	parseDecimal,
	isSafeAccountId,
	spreadsheetSafe,
	csvRow,
	validateCsvShape,
	validateRow,
	validateRows
} from './csv.js';

/**
 * The shared fixture contract, run against the FRONTEND implementation.
 *
 * The backend runs this same file against service/campaign-csv.js
 * (test/unit/campaign-csv.test.js in html-to-gif). Two copies of the rules
 * exist because they answer different questions — this one puts the problem
 * beside the field, the other one is the security boundary — and this file is
 * what stops them drifting. Drift is not a tidiness problem: it means a file
 * passes in the browser and is rejected after upload, which reads to the buyer
 * as the product being broken.
 *
 * The JSON is a verbatim copy of the backend's. When you change it, change both.
 */
const fixtures = JSON.parse(
	readFileSync(fileURLToPath(new URL('./fixtures/csv-fixtures.json', import.meta.url)), 'utf8')
);

describe('csv contract — decimals', () => {
	for (const c of fixtures.decimals) {
		test(c.name, () => {
			const result = parseDecimal(c.input);
			assert.equal(result.ok, c.ok);
			if (c.ok) assert.equal(result.value, c.value);
			else assert.equal(result.code, c.code);
		});
	}
});

describe('csv contract — account ids', () => {
	for (const c of fixtures.accountIds) {
		test(`${JSON.stringify(c.input)} -> ${c.safe}`, () => {
			assert.equal(isSafeAccountId(c.input), c.safe);
		});
	}
});

describe('csv contract — spreadsheet safety', () => {
	for (const c of fixtures.spreadsheetSafe) {
		test(JSON.stringify(c.input), () => {
			assert.equal(spreadsheetSafe(c.input), c.output);
		});
	}
	for (const c of fixtures.csvRows) {
		test(`row ${JSON.stringify(c.input)}`, () => {
			assert.equal(csvRow(c.input), c.output);
		});
	}
});

describe('csv contract — file shape', () => {
	for (const c of fixtures.shapes) {
		test(c.name, () => {
			const result = validateCsvShape(c.csv);
			assert.equal(result.ok, c.ok);
			if (c.ok) {
				assert.deepEqual(result.header, c.header);
				assert.equal(result.rows.length, c.rowCount);
			} else {
				const codes = result.errors.map((e) => e.code);
				for (const expected of c.errorCodes) assert.ok(codes.includes(expected), `expected ${expected} in ${codes}`);
			}
		});
	}
});

describe('csv contract — row sets', () => {
	for (const c of fixtures.rowSets) {
		test(c.name, () => {
			const result = validateRows(c.records, c.columns);
			assert.deepEqual(result.counts, c.counts);
			assert.equal(result.ok, c.ok);

			if (c.duplicateIds) {
				assert.deepEqual(
					result.duplicates.map((d) => d.accountId).sort(),
					[...c.duplicateIds].sort()
				);
			}
			if (c.duplicateLines) {
				for (const [id, lines] of Object.entries(c.duplicateLines)) {
					assert.deepEqual(result.duplicates.find((d) => d.accountId === id).lines, lines);
				}
			}
			if (c.expectValues) {
				for (const [id, values] of Object.entries(c.expectValues)) {
					const row = validateRow(
						c.records.find((r) => r.account_id === id),
						c.columns
					);
					for (const [k, v] of Object.entries(values)) {
						// null vs 0 is the distinction under test, so Object.is, not ==.
						assert.ok(Object.is(row.value[k], v), `${id}.${k} was ${row.value[k]}, wanted ${v}`);
					}
				}
			}
			if (c.expectIds) {
				assert.deepEqual(result.accounts.map((a) => a.id), c.expectIds);
			}
			if (c.expectIssueCodes) {
				const codes = result.accounts.flatMap((a) => a.issues.map((i) => i.code));
				for (const expected of c.expectIssueCodes) assert.ok(codes.includes(expected));
			}
		});
	}
});
