/**
 * Tests for the numbers /pricing puts on screen.
 * Run: node --test src/config/plan-features.pricing.test.js
 *
 * The pricing page renders every figure through this config — card render
 * counts, prices, overage rates, and each comparison cell — so the page and the
 * limits the product actually enforces cannot drift apart. What can still drift
 * is the config itself: a limit edited in one place and not the other, or a row
 * left pointing at a retired feature. These tests pin the shape the page
 * depends on, and the exact values the design was drawn against.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	PLANS,
	PLAN_PRICING,
	PLAN_FEATURES,
	FEATURES,
	formatLimit,
	formatOverageRate
} from './plan-features.js';

const CARD_PLANS = [PLANS.BASIC, PLANS.STANDARD, PLANS.BUSINESS];
const TABLE_PLANS = [PLANS.STARTER, ...CARD_PLANS];

test('every plan on the page has a render count and a price', () => {
	for (const plan of TABLE_PLANS) {
		assert.equal(
			typeof PLAN_FEATURES[plan][FEATURES.RENDERS],
			'number',
			`${plan} needs a render count`
		);
		assert.ok(PLAN_PRICING[plan], `${plan} needs pricing`);
		assert.equal(typeof PLAN_PRICING[plan].monthly, 'number');
		assert.equal(typeof PLAN_PRICING[plan].annual, 'number');
	}
});

test('annual is cheaper than monthly on every paid plan', () => {
	for (const plan of CARD_PLANS) {
		assert.ok(
			PLAN_PRICING[plan].annual < PLAN_PRICING[plan].monthly,
			`${plan}: annual should undercut monthly`
		);
	}
});

test('render counts and prices match the approved design', () => {
	assert.equal(PLAN_FEATURES[PLANS.STARTER][FEATURES.RENDERS], 50);
	assert.equal(PLAN_FEATURES[PLANS.BASIC][FEATURES.RENDERS], 1000);
	assert.equal(PLAN_FEATURES[PLANS.STANDARD][FEATURES.RENDERS], 10000);
	assert.equal(PLAN_FEATURES[PLANS.BUSINESS][FEATURES.RENDERS], 40000);

	assert.deepEqual(PLAN_PRICING[PLANS.BASIC], { monthly: 19, annual: 15 });
	assert.deepEqual(PLAN_PRICING[PLANS.STANDARD], { monthly: 49, annual: 39 });
	assert.deepEqual(PLAN_PRICING[PLANS.BUSINESS], { monthly: 249, annual: 199 });
});

test('overage: free has none, paid plans get cheaper as they grow', () => {
	assert.equal(formatOverageRate(PLANS.STARTER), null);
	assert.equal(formatOverageRate(PLANS.BASIC), '$0.020');
	assert.equal(formatOverageRate(PLANS.STANDARD), '$0.010');
	assert.equal(formatOverageRate(PLANS.BUSINESS), '$0.005');
});

test('the comparison rows the page renders all resolve to a value', () => {
	// Mirrors COMPARISON in src/routes/pricing/+page.svelte.
	const keyed = [
		FEATURES.RENDERS,
		FEATURES.PDF_OUTPUT,
		FEATURES.TEMPLATES_SAVED,
		FEATURES.BATCH_RENDER,
		FEATURES.BATCH_ITEMS_PER_REQUEST,
		FEATURES.WEBHOOKS,
		FEATURES.AI_CREDITS,
		FEATURES.TEAM_SEATS,
		FEATURES.BRAND_ASSETS,
		FEATURES.AUDIT_LOGS
	];
	for (const plan of TABLE_PLANS) {
		for (const key of keyed) {
			assert.notEqual(PLAN_FEATURES[plan][key], undefined, `${plan} is missing a value for ${key}`);
		}
	}
});

test('unlimited templates render as "Unlimited", not as null', () => {
	assert.equal(formatLimit(PLAN_FEATURES[PLANS.STANDARD][FEATURES.TEMPLATES_SAVED]), 'Unlimited');
	assert.equal(formatLimit(PLAN_FEATURES[PLANS.BASIC][FEATURES.TEMPLATES_SAVED]), '25');
});

test('the pricing page never renders a retired or unbuilt feature', () => {
	// These keys still carry values in the config so feature gates keep working
	// for grandfathered accounts — experiments, dynamic links, storage
	// connectors, white-label, SSO. What must stay true is that the pricing page
	// does not sell them, so the guard reads the route itself.
	const page = readFileSync(new URL('../routes/pricing/+page.svelte', import.meta.url), 'utf8');
	const forbidden = [
		'AB_TESTING',
		'SMART_LINKS',
		'SCHEDULED_IMAGES',
		'AUTO_OPTIMIZATION',
		'DYNAMIC_LINKS',
		'STORAGE_CONNECTORS',
		'WHITE_LABEL',
		'SSO_SAML'
	];
	for (const key of forbidden) {
		assert.ok(
			!page.includes(`FEATURES.${key}`),
			`/pricing references FEATURES.${key}; that feature is retired or unbuilt`
		);
	}
	// And no Enterprise surface, by owner decision. Only the markup is checked:
	// the script's own comment explains the absence and would match otherwise.
	const markup = page.slice(page.indexOf('</script>'));
	assert.ok(!/Enterprise/.test(markup), '/pricing should not carry an Enterprise surface');
});
