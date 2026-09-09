import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { stageFromAgentEvent } from './agent-stage.js';

/**
 * The bug this exists to stop: every consumer read `payload.stage`, which the
 * agent never sends, so the lock showed one frozen stage for the whole run.
 */
describe('stageFromAgentEvent', () => {
	test('maps the agent’s real ids to the lock’s stages', () => {
		assert.equal(stageFromAgentEvent({ id: 'agent', label: 'Reading the brief' }), 'read');
		assert.equal(stageFromAgentEvent({ id: 'thinking' }), 'plan');
		assert.equal(stageFromAgentEvent({ id: 'submit_template#2' }), 'write');
		assert.equal(stageFromAgentEvent({ id: 'render_preview#1' }), 'check');
	});

	test('the #n suffix does not stop a match', () => {
		// Tools that run twice come back as `render_preview#2`.
		assert.equal(stageFromAgentEvent({ id: 'render_preview#7' }), 'check');
	});

	test('an explicit stage from the server wins', () => {
		// This is a translation layer, not a replacement for one.
		assert.equal(stageFromAgentEvent({ id: 'agent', stage: 'check' }), 'check');
	});

	test('an unknown or empty frame returns null, so the caller keeps the last stage', () => {
		assert.equal(stageFromAgentEvent({ id: 'something_else' }), null);
		assert.equal(stageFromAgentEvent({}), null);
		assert.equal(stageFromAgentEvent(null), null);
	});
});
