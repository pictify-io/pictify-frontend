import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { previewCsp, PREVIEW_CSP, previewDocument } from './preview-document.js';

/**
 * The preview policy. `img-src` is the only thing that varies by context, and
 * the variance is deliberate — everything that could execute, connect or
 * navigate stays off in both modes.
 */
describe('what a preview may load', () => {
	test('the default is the strict asset list', () => {
		assert.equal(PREVIEW_CSP, previewCsp('assets'));
		assert.match(PREVIEW_CSP, /img-src 'self' data: blob: https:\/\/htgf\.s3\.amazonaws\.com/);
		assert.ok(!/img-src[^;]*https:(?!\/\/)/.test(PREVIEW_CSP), 'no blanket https in the strict mode');
	});

	test('an unknown mode falls back to strict, never to open', () => {
		// A typo in a caller must not quietly widen the policy.
		assert.equal(previewCsp('nonsense'), previewCsp('assets'));
		assert.equal(previewCsp(undefined), previewCsp('assets'));
	});

	test('the tool mode widens images to any https host', () => {
		/*
		 * Deliberate: there the author and the viewer are the same person and
		 * the feature is "use the logo from my site", which lives on a host we
		 * cannot enumerate. Every OG template loads its mark from a CDN.
		 */
		assert.match(previewCsp('any'), /img-src 'self' data: blob: https:/);
	});

	test('ONLY img-src differs between the modes', () => {
		const strict = previewCsp('assets').split('; ').filter((d) => !d.startsWith('img-src'));
		const open = previewCsp('any').split('; ').filter((d) => !d.startsWith('img-src'));
		assert.deepEqual(open, strict);
	});

	test('nothing can execute, connect or navigate in either mode', () => {
		for (const mode of ['assets', 'any']) {
			const csp = previewCsp(mode);
			for (const directive of [
				"default-src 'none'",
				"script-src 'none'",
				"connect-src 'none'",
				"frame-src 'none'",
				"object-src 'none'",
				"form-action 'none'",
				"base-uri 'none'"
			]) {
				assert.ok(csp.includes(directive), `${mode} is missing ${directive}`);
			}
		}
	});

	test('fonts stay on the two named Google hosts in both modes', () => {
		for (const mode of ['assets', 'any']) {
			assert.match(previewCsp(mode), /style-src 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
			assert.match(previewCsp(mode), /font-src data: https:\/\/fonts\.gstatic\.com/);
		}
	});
});

describe('the document it writes', () => {
	test('the policy is the FIRST thing in the head', () => {
		// Anything parsed before it would load unpoliced.
		const doc = previewDocument('<p>x</p>');
		assert.match(doc, /<head><meta http-equiv="Content-Security-Policy"/);
	});

	test('the mode reaches the meta tag', () => {
		assert.match(previewDocument('<p>x</p>', { images: 'any' }), /img-src 'self' data: blob: https:;/);
	});

	test('a bare string is still accepted as css', () => {
		assert.match(previewDocument('<p>x</p>', 'body{color:red}'), /<style>body\{color:red\}<\/style>/);
	});
});
