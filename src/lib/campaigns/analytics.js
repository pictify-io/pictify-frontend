import { analytics } from '$lib/telemetry';
import { scrub } from './scrub.js';

/**
 * Campaign analytics. FE-18.
 *
 * One rule dominates this file: NOTHING ABOUT THE BUYER'S CUSTOMERS LEAVES.
 *
 * Every event here fires from a screen that is displaying a named third party's
 * business figures. An account id, an account name, a metric value or a preview
 * URL captured into a product analytics tool would be third-party personal and
 * commercial data sitting in a system nobody in that relationship agreed to —
 * and it would be there permanently, in a place no purge sweep reaches.
 *
 * So the payloads carry SHAPES, not contents: counts, states, durations,
 * booleans, and identifiers that belong to the buyer's own tenancy. The guard
 * that enforces it lives in ./scrub.js, in its own importless file so it can be
 * tested directly — a convention is one hurried edit away from shipping an
 * account name to PostHog.
 */

/**
 * Context attached to every campaign event, and to the existing events fired
 * from campaign surfaces: which surface, which shell, and what the user
 * arrived wanting.
 */
let context = { surface: 'campaigns', experience: 'campaigns', entry_intent: null };

export function setCampaignContext(next = {}) {
	context = { ...context, ...scrub(next) };
}

const emit = (event, props = {}) => analytics.track(event, { ...context, ...scrub(props) });

/* The nine events in FE-18. Each takes only shapes. */

export const campaignIntentClicked = (props) => emit('campaign_intent_clicked', props);
export const campaignAccessRequested = (props) => emit('campaign_access_requested', props);
export const campaignSetupStarted = (props) => emit('campaign_setup_started', props);
export const campaignDataValidated = (props) => emit('campaign_data_validated', props);
export const campaignApproved = (props) => emit('campaign_approved', props);
export const campaignRunStarted = (props) => emit('campaign_run_started', props);
export const campaignExportDownloaded = (props) => emit('campaign_export_downloaded', props);
export const campaignHandoffAccepted = (props) => emit('campaign_handoff_accepted', props);
export const campaignNewPeriod = (props) => emit('campaign_new_period', props);

export { scrub };

export default {
	scrub,
	setCampaignContext,
	campaignIntentClicked,
	campaignAccessRequested,
	campaignSetupStarted,
	campaignDataValidated,
	campaignApproved,
	campaignRunStarted,
	campaignExportDownloaded,
	campaignHandoffAccepted,
	campaignNewPeriod
};
