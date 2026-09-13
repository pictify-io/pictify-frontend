/**
 * Tests for the two campaign rules modules.
 * Run: node --test src/lib/campaigns/campaigns.test.js
 *
 * These are the fixtures the backend suite shares (spec §13 QA-01). Both sides
 * must agree exactly: a file that passes here and fails after upload is the
 * failure mode this file exists to prevent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	EDITION_STEPS,
	authUrl,
	campaignUrl,
	campaignsHome,
	editionUrl,
	isSafeReturnPath,
	postAuthDestination,
	safeIntent,
	isSafeExternalUrl,
	safeReturnPath
} from './nav.js';
import {
	LIMITS,
	csvCell,
	csvRow,
	isSafeAccountId,
	parseCsv,
	parseDecimal,
	spreadsheetSafe,
	stripBom,
	validateCsvShape,
	validateRow,
	validateRows
} from './csv.js';

// ── nav ────────────────────────────────────────────────────────────────
test('urls are built from one place and encode their parts', () => {
	assert.equal(campaignsHome(), '/dashboard/campaigns');
	assert.equal(campaignUrl('c_1'), '/dashboard/campaigns/c_1');
	assert.equal(editionUrl('c_1', 'e_2', 'data'), '/dashboard/campaigns/c_1/editions/e_2/data');
	// An unknown step lands on the first rather than 404ing a stale bookmark.
	assert.equal(editionUrl('c_1', 'e_2', 'nope'), '/dashboard/campaigns/c_1/editions/e_2/setup');
	assert.equal(
		editionUrl('c/1', 'e 2', 'setup'),
		'/dashboard/campaigns/c%2F1/editions/e%202/setup'
	);
	assert.equal(EDITION_STEPS[0], 'setup');
});

test('only the allowlisted intent survives', () => {
	assert.equal(safeIntent('customer-value-update'), 'customer-value-update');
	for (const bad of ['', null, undefined, 'admin', '../../etc', 'customer-value-update-x']) {
		assert.equal(safeIntent(bad), null, `${bad} should not be an intent`);
	}
});

test('off-site redirects are rejected in every disguise', () => {
	const hostile = [
		'//evil.com',
		'///evil.com',
		'https://evil.com',
		'http:/evil.com',
		'javascript:alert(1)',
		'data:text/html,x',
		'/\\evil.com', // backslash normalises to a second slash in some parsers
		'evil.com', // relative: resolves against whoever is current
		'',
		'  /dashboard',
		String.fromCharCode(9) + '/dashboard', // leading tab, stripped by some parsers
		'/dash' + String.fromCharCode(10) + 'board', // embedded newline
		'/x'.padEnd(3000, 'y') // absurd length
	];
	for (const path of hostile) {
		assert.equal(isSafeReturnPath(path), false, `${JSON.stringify(path)} must be rejected`);
	}
});

test('same-origin paths are allowed', () => {
	for (const path of [
		'/dashboard',
		'/dashboard/campaigns',
		'/dashboard/campaigns/c_1/editions/e_2/review?tab=issues',
		'/dashboard/campaigns#top'
	]) {
		assert.equal(isSafeReturnPath(path), true, `${path} should be allowed`);
	}
});

test('an untrusted redirect falls back rather than throwing', () => {
	assert.equal(safeReturnPath('//evil.com'), '/dashboard/campaigns');
	assert.equal(safeReturnPath('/dashboard/renders'), '/dashboard/renders');
});

test('a validated deep link beats an intent', () => {
	assert.equal(
		postAuthDestination({ redirect: '/dashboard/campaigns/c_1', intent: 'customer-value-update' }),
		'/dashboard/campaigns/c_1'
	);
	// Hostile redirect is dropped, intent still routes to campaigns.
	assert.equal(
		postAuthDestination({ redirect: '//evil.com', intent: 'customer-value-update' }),
		'/dashboard/campaigns'
	);
	assert.equal(postAuthDestination({}), '/dashboard');
});

test('authUrl drops what it cannot trust', () => {
	assert.equal(authUrl('/signup', { intent: 'nope', redirect: '//evil.com' }), '/signup');
	assert.equal(
		authUrl('/signup', { intent: 'customer-value-update', redirect: '/dashboard/campaigns' }),
		'/signup?intent=customer-value-update&redirect=%2Fdashboard%2Fcampaigns'
	);
});

// ── csv: ids ───────────────────────────────────────────────────────────
test('account ids keep leading zeroes and case, and stay strings', () => {
	assert.equal(isSafeAccountId('00042'), true);
	assert.equal(isSafeAccountId('Acct.1:2-3_4'), true);
	assert.equal(isSafeAccountId('a'.repeat(128)), true);
	assert.equal(isSafeAccountId('a'.repeat(129)), false);
	for (const bad of [
		'',
		'_leading',
		'.leading',
		'-leading',
		'has space',
		'has/slash',
		'é',
		'=cmd'
	]) {
		assert.equal(isSafeAccountId(bad), false, `${bad} should be unsafe`);
	}
});

test('an unsafe id is reported, never rewritten', () => {
	const columns = [{ key: 'account_id', required: true, type: 'string' }];
	const out = validateRow({ account_id: '=cmd|x' }, columns);
	assert.equal(out.ok, false);
	assert.equal(out.issues[0].code, 'unsafe_account_id');
	// The original is echoed back for the message; no escaped variant is stored.
	assert.equal(out.issues[0].value, '=cmd|x');
	assert.equal(out.value.account_id, undefined);
});

// ── csv: numbers ───────────────────────────────────────────────────────
test('numbers are dot-decimal only, and locale input is refused not guessed', () => {
	assert.deepEqual(parseDecimal('0'), { ok: true, value: 0 });
	assert.deepEqual(parseDecimal('12.5'), { ok: true, value: 12.5 });
	assert.deepEqual(parseDecimal('-3'), { ok: true, value: -3 });
	assert.equal(parseDecimal('1,234').code, 'grouping_or_locale');
	assert.equal(parseDecimal('1 234').code, 'grouping_or_locale');
	assert.equal(parseDecimal('$12').code, 'symbol_in_number');
	assert.equal(parseDecimal('12%').code, 'symbol_in_number');
	assert.equal(parseDecimal('1e9').code, 'symbol_in_number');
	assert.equal(parseDecimal('abc').code, 'symbol_in_number');
	assert.equal(parseDecimal('').code, 'blank');
	assert.equal(parseDecimal('9'.repeat(20)).code, 'magnitude');
});

test('required zero is valid; required blank is an error; optional blank suppresses', () => {
	const columns = [
		{ key: 'account_id', required: true, type: 'string' },
		{ key: 'saved', required: true, type: 'number' },
		{ key: 'bonus', required: false, type: 'number' }
	];

	const zero = validateRow({ account_id: '00042', saved: '0', bonus: '' }, columns);
	assert.equal(zero.ok, true);
	assert.equal(zero.value.saved, 0);
	// Not coerced to 0 — the metric is simply absent.
	assert.equal(zero.value.bonus, null);
	assert.equal(zero.value.account_id, '00042');

	const missing = validateRow({ account_id: '00042', saved: '', bonus: '1' }, columns);
	assert.equal(missing.ok, false);
	assert.equal(missing.issues[0].code, 'required_missing');
});

test('unmapped columns are never read', () => {
	const columns = [{ key: 'account_id', required: true, type: 'string' }];
	const out = validateRow({ account_id: 'a1', secret_email: 'x@y.com' }, columns);
	assert.equal(out.ok, true);
	assert.equal('secret_email' in out.value, false);
});

// ── csv: file shape ────────────────────────────────────────────────────
test('BOM and quoted fields parse', () => {
	const text = '﻿account_id,name\n00042,"Doe, Jane"\n';
	assert.equal(stripBom(text)[0], 'a');
	const out = validateCsvShape(text);
	assert.equal(out.ok, true, JSON.stringify(out.errors));
	assert.deepEqual(out.header, ['account_id', 'name']);
	assert.deepEqual(out.rows[0], ['00042', 'Doe, Jane']);
});

test('an escaped quote inside a quoted field survives', () => {
	const out = parseCsv('a\n"say ""hi"""\n');
	assert.equal(out.ok, true);
	assert.equal(out.rows[1][0], 'say "hi"');
});

test('the blocking cases block (QA-01)', () => {
	assert.equal(validateCsvShape('').errors[0].code, 'empty_file');
	assert.equal(validateCsvShape('a,b\n"unclosed\n').errors[0].code, 'unclosed_quote');

	const dup = validateCsvShape('id,Name,name\n1,a,b\n');
	assert.equal(dup.ok, false);
	assert.equal(dup.errors.find((e) => e.code === 'duplicate_headers').headers[0], 'name');

	const uneven = validateCsvShape('a,b\n1\n');
	assert.equal(uneven.errors.find((e) => e.code === 'uneven_rows').total, 1);

	const wide = validateCsvShape(Array.from({ length: 33 }, (_, i) => `c${i}`).join(',') + '\n');
	assert.equal(wide.errors.find((e) => e.code === 'over_columns').limit, LIMITS.maxColumns);

	const long = 'id\n' + Array.from({ length: 251 }, (_, i) => i).join('\n') + '\n';
	assert.equal(validateCsvShape(long).errors.find((e) => e.code === 'over_rows').limit, 250);

	const big = 'id\n' + 'x'.repeat(LIMITS.maxBytes + 10);
	assert.equal(validateCsvShape(big).errors[0].code, 'over_size');
});

test('nothing is silently trimmed, overwritten or truncated', () => {
	// A file over the row limit reports the count it saw; it does not return
	// the first 250 rows as if they were the whole file.
	const long = 'id\n' + Array.from({ length: 260 }, (_, i) => i).join('\n') + '\n';
	const out = validateCsvShape(long);
	assert.equal(out.ok, false);
	assert.equal(out.errors.find((e) => e.code === 'over_rows').rows, 260);
});

// ── csv: output safety ─────────────────────────────────────────────────
test('human-facing output cannot execute in a spreadsheet', () => {
	assert.equal(spreadsheetSafe('=1+1'), "'=1+1");
	assert.equal(spreadsheetSafe('+x'), "'+x");
	assert.equal(spreadsheetSafe('-x'), "'-x");
	assert.equal(spreadsheetSafe('@x'), "'@x");
	assert.equal(spreadsheetSafe('normal'), 'normal');
	assert.equal(csvCell('a,b'), '"a,b"');
	assert.equal(csvCell('say "hi"'), '"say ""hi"""');
	// `'=x` needs no quoting — it holds no comma, quote or newline — and the
	// leading apostrophe is what stops the spreadsheet evaluating it.
	assert.equal(csvRow(['00042', 'Doe, Jane', '=x']), '00042,"Doe, Jane",\'=x');
});

// ── csv: accounts, not rows ────────────────────────────────────────────
test('counts are accounts, and a duplicate id is one issue spanning its rows', () => {
	const columns = [
		{ key: 'account_id', required: true, type: 'string' },
		{ key: 'saved', required: true, type: 'number' }
	];
	const out = validateRows(
		[
			{ account_id: '00042', saved: '1' },
			{ account_id: 'a2', saved: '2' },
			{ account_id: '00042', saved: '3' },
			{ account_id: '00042', saved: '4' }
		],
		columns
	);

	// Four rows, two accounts — the review screen counts accounts, and 00042
	// occupying three lines is still one account.
	assert.equal(out.counts.rows, 4);
	assert.equal(out.counts.accounts, 2);

	// One issue, not three, and it names every line the id occupies.
	assert.equal(out.duplicates.length, 1);
	assert.deepEqual(out.duplicates[0].lines, [2, 4, 5]);
	assert.equal(out.duplicates[0].accountId, '00042');

	// The duplicated account is not valid; the clean one is. One issue, because
	// there is one ambiguous account — not three because it spans three lines.
	assert.equal(out.counts.valid, 1);
	assert.equal(out.counts.issues, 1);
	assert.equal(out.ok, false);
});

test('a duplicate is blocked, never silently resolved to one winner', () => {
	const columns = [
		{ key: 'account_id', required: true, type: 'string' },
		{ key: 'saved', required: true, type: 'number' }
	];
	const out = validateRows(
		[
			{ account_id: 'a1', saved: '10' },
			{ account_id: 'a1', saved: '99' }
		],
		columns
	);
	const account = out.accounts.find((a) => a.id === 'a1');
	assert.equal(account.ok, false);
	assert.ok(account.issues.some((i) => i.code === 'duplicate_account_id'));
	// Neither value has been chosen as the survivor.
	assert.equal(out.counts.valid, 0);
});

test('a row whose id cannot be read is still counted, on its own line', () => {
	const columns = [{ key: 'account_id', required: true, type: 'string' }];
	const out = validateRows([{ account_id: '' }, { account_id: 'ok1' }], columns);
	assert.equal(out.counts.accounts, 2);
	assert.equal(out.counts.valid, 1);
	assert.equal(out.accounts[0].id, null);
	assert.deepEqual(out.accounts[0].lines, [2]);
});

// ── nav: the Next action destination ───────────────────────────────────
test('the Next action takes external https only, and is not isSafeReturnPath', () => {
	for (const good of ['https://acme.com', 'https://acme.com/renew?x=1', 'https://a.b.co.uk/x#y']) {
		assert.equal(isSafeExternalUrl(good), true, `${good} should be allowed`);
		// The two validators are inverses; neither can stand in for the other.
		assert.equal(isSafeReturnPath(good), false);
	}
	for (const bad of [
		'http://acme.com', // downgraded scheme
		'javascript:alert(1)',
		'data:text/html,x',
		'https://user:pw@acme.com', // credentials would be rendered into an image
		'https://localhost', // no dot: not reachable by a customer
		'https://intranet',
		'/dashboard/campaigns', // a path is not a destination
		'acme.com',
		''
	]) {
		assert.equal(isSafeExternalUrl(bad), false, `${bad} must be rejected`);
	}
});
