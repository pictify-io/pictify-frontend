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

/* ------------------------------------------------------------------ AI-7 */

/**
 * AI surface telemetry, per spec §13.
 *
 * SHAPES ONLY, and here the rule bites harder than anywhere else: an
 * instruction is the buyer's own sentence, and a sentence about a customer
 * contains that customer. `scrub` drops the instruction and every label by
 * name; what is left is what the product needs to know — whether people scope
 * their edits, how often a scoped edit has to be widened, and how often a run
 * produced nothing.
 *
 * The question these are here to answer is whether the scope contract is worth
 * its cost. A high refusal rate with a low acceptance rate would mean the
 * scoping is fighting people rather than protecting them.
 */
export const aiEditRequested = (props) => emit('ai_edit_requested', props);
export const aiEditApplied = (props) => emit('ai_edit_applied', props);
export const aiEditRefused = (props) => emit('ai_edit_refused', props);
export const aiEditNoChange = (props) => emit('ai_edit_no_change', props);
export const aiEditFailed = (props) => emit('ai_edit_failed', props);
export const aiProposalAccepted = (props) => emit('ai_proposal_accepted', props);
export const aiProposalDismissed = (props) => emit('ai_proposal_dismissed', props);
export const aiProofRendered = (props) => emit('ai_proof_rendered', props);

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
