import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskApiKey, hasKeyPrefix } from './api-key.js';

test('a prefixed key masks with its real prefix', () => {
	assert.equal(maskApiKey('pic_live_' + 'a'.repeat(59) + 'c41d'), 'pic_live_••••ac41d');
});

test('a legacy bare-hex key masks without inventing a prefix', () => {
	assert.equal(maskApiKey('5ab9' + 'f'.repeat(56) + '90adf'), '••••90adf');
	assert.equal(hasKeyPrefix('5ab9'), false);
});

test('missing keys show the fallback', () => {
	assert.equal(maskApiKey(null), 'YOUR_API_KEY');
	assert.equal(maskApiKey('', { fallback: '—' }), '—');
});

test('tail length is configurable', () => {
	assert.equal(maskApiKey('pic_live_abcdef', { tail: 4 }), 'pic_live_••••cdef');
});
