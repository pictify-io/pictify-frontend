/**
 * Centralized Analytics Module for Pictify
 *
 * Wraps PostHog and provides consistent event tracking across the app.
 * All analytics calls should go through this module.
 */

import posthog from 'posthog-js';
import { browser } from '$app/environment';

const isProd = import.meta.env.MODE === 'production';

// UTM parameter names to capture
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const UTM_STORAGE_KEY = 'pictify_utm';
const REFERRER_STORAGE_KEY = 'pictify_referrer';

/**
 * Analytics utility object
 */
export const analytics = {
	/**
	 * Initialize PostHog (called once in layout)
	 */
	init: () => {
		if (browser && isProd && !posthog.__loaded) {
			posthog.init('phc_3ecva80rtrdIJiDyYVwsqjy2YI7CbhbAydPApERhNtU', {
				api_host: 'https://api.pictify.io/posthog',
				disable_compression: true,
				capture_pageview: true,
				capture_pageleave: true,
				persistence: 'localStorage'
			});
		}
	},

	/**
	 * Identify a user (call after login/signup)
	 * @param {string} userId - Unique user identifier (email or ID)
	 * @param {Object} traits - User properties
	 */
	identify: (userId, traits = {}) => {
		if (!browser || !isProd) return;

		const utm = analytics.getStoredUTM();
		const referrer = analytics.getStoredReferrer();

		posthog.identify(userId, {
			...traits,
			...(utm.utm_source && { initial_utm_source: utm.utm_source }),
			...(utm.utm_medium && { initial_utm_medium: utm.utm_medium }),
			...(utm.utm_campaign && { initial_utm_campaign: utm.utm_campaign }),
			...(referrer && { initial_referrer: referrer })
		});
	},

	/**
	 * Track a custom event
	 * @param {string} eventName - Name of the event (snake_case)
	 * @param {Object} properties - Event properties
	 */
	track: (eventName, properties = {}) => {
		if (!browser || !isProd) return;

		const utm = analytics.getStoredUTM();

		posthog.capture(eventName, {
			...properties,
			...utm,
			timestamp: new Date().toISOString()
		});
	},

	/**
	 * Track a page view with custom properties
	 * @param {string} pageName - Name of the page
	 * @param {Object} properties - Additional properties
	 */
	page: (pageName, properties = {}) => {
		if (!browser || !isProd) return;

		posthog.capture('$pageview', {
			page_name: pageName,
			...properties
		});
	},

	/**
	 * Reset analytics state (call on logout)
	 */
	reset: () => {
		if (!browser || !isProd) return;
		posthog.reset();
	},

	/**
	 * Set user properties without identifying
	 * @param {Object} properties - Properties to set
	 */
	setUserProperties: (properties) => {
		if (!browser || !isProd) return;
		posthog.people.set(properties);
	},

	/**
	 * Capture UTM parameters from URL and store them
	 */
	captureUTM: () => {
		if (!browser) return;

		const params = new URLSearchParams(window.location.search);
		const utm = {};

		UTM_PARAMS.forEach((param) => {
			const value = params.get(param);
			if (value) utm[param] = value;
		});

		// Only store if we have UTM params
		if (Object.keys(utm).length > 0) {
			try {
				sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
			} catch (e) {
				/* ignored */
			}
		}

		// Also store referrer if this is first visit
		if (document.referrer && !sessionStorage.getItem(REFERRER_STORAGE_KEY)) {
			try {
				const referrerUrl = new URL(document.referrer);
				if (referrerUrl.hostname !== window.location.hostname) {
					sessionStorage.setItem(REFERRER_STORAGE_KEY, document.referrer);
				}
			} catch (e) {
				// Invalid referrer URL, ignore
			}
		}
	},

	/**
	 * Get stored UTM parameters
	 * @returns {Object} UTM parameters
	 */
	getStoredUTM: () => {
		if (!browser) return {};

		try {
			return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || '{}');
		} catch {
			return {};
		}
	},

	/**
	 * Get stored referrer
	 * @returns {string|null} Referrer URL
	 */
	getStoredReferrer: () => {
		if (!browser) return null;
		return sessionStorage.getItem(REFERRER_STORAGE_KEY);
	},

	// ============================================
	// Pre-defined Event Helpers
	// ============================================

	/**
	 * Track signup started
	 * @param {Object} params - { source, page }
	 */
	trackSignupStarted: (params = {}) => {
		analytics.track('signup_started', {
			source: params.source || 'direct',
			page: params.page || window?.location?.pathname
		});
	},

	/**
	 * Track signup completed
	 * @param {Object} params - { method, plan }
	 */
	trackSignupCompleted: (params = {}) => {
		analytics.track('signup_completed', {
			method: params.method || 'email',
			plan: params.plan || 'starter'
		});
	},

	/**
	 * Track login completed
	 * @param {Object} params - { method }
	 */
	trackLoginCompleted: (params = {}) => {
		analytics.track('login_completed', {
			method: params.method || 'email'
		});
	},

	/**
	 * Track CTA clicked
	 * @param {Object} params - { cta_text, location, page }
	 */
	trackCTAClicked: (params = {}) => {
		analytics.track('cta_clicked', {
			cta_text: params.cta_text,
			location: params.location,
			page: params.page || window?.location?.pathname
		});
	},

	/**
	 * Track feature used
	 * @param {Object} params - { feature_name, context }
	 */
	trackFeatureUsed: (params = {}) => {
		analytics.track('feature_used', {
			feature_name: params.feature_name,
			context: params.context
		});
	},

	/**
	 * Track image generated (free tool)
	 * @param {Object} params - { tool_name, format, with_watermark }
	 */
	trackImageGenerated: (params = {}) => {
		analytics.track('image_generated', {
			tool_name: params.tool_name,
			format: params.format || 'png',
			with_watermark: params.with_watermark ?? true
		});
	},

	/**
	 * Track template rendered (API/dashboard)
	 * @param {Object} params - { template_id, format }
	 */
	trackTemplateRendered: (params = {}) => {
		analytics.track('template_rendered', {
			template_id: params.template_id,
			format: params.format || 'png'
		});
	},

	/**
	 * Track upgrade prompt shown
	 * @param {Object} params - { prompt_type, trigger, discount }
	 */
	trackUpgradePromptShown: (params = {}) => {
		analytics.track('upgrade_prompt_shown', {
			prompt_type: params.prompt_type,
			trigger: params.trigger,
			discount: params.discount
		});
	},

	/**
	 * Track upgrade prompt clicked
	 * @param {Object} params - { prompt_type, discount }
	 */
	trackUpgradePromptClicked: (params = {}) => {
		analytics.track('upgrade_prompt_clicked', {
			prompt_type: params.prompt_type,
			discount: params.discount
		});
	},

	/**
	 * Track upgrade prompt dismissed
	 * @param {Object} params - { prompt_type }
	 */
	trackUpgradePromptDismissed: (params = {}) => {
		analytics.track('upgrade_prompt_dismissed', {
			prompt_type: params.prompt_type
		});
	},

	/**
	 * Track milestone achieved
	 * @param {Object} params - { milestone_id, milestone_type, count }
	 */
	trackMilestoneAchieved: (params = {}) => {
		analytics.track('milestone_achieved', {
			milestone_id: params.milestone_id,
			milestone_type: params.milestone_type,
			count: params.count
		});
	},

	// ============================================
	// Usage Nudge Tracking
	// ============================================

	/**
	 * Track usage banner shown
	 * @param {Object} params - { percentage, plan }
	 */
	trackUsageBannerShown: (params = {}) => {
		analytics.track('usage_banner_shown', {
			percentage: params.percentage,
			plan: params.plan
		});
	},

	/**
	 * Track usage banner dismissed
	 * @param {Object} params - { percentage, plan }
	 */
	trackUsageBannerDismissed: (params = {}) => {
		analytics.track('usage_banner_dismissed', {
			percentage: params.percentage,
			plan: params.plan
		});
	},

	/**
	 * Track usage banner upgrade clicked
	 * @param {Object} params - { percentage, plan }
	 */
	trackUsageBannerUpgradeClicked: (params = {}) => {
		analytics.track('usage_banner_upgrade_clicked', {
			percentage: params.percentage,
			plan: params.plan
		});
	},

	/**
	 * Track proactive modal shown
	 * @param {Object} params - { percentage, plan, renders_completed, time_saved }
	 */
	trackProactiveModalShown: (params = {}) => {
		analytics.track('proactive_modal_shown', {
			percentage: params.percentage,
			plan: params.plan,
			renders_completed: params.renders_completed,
			time_saved: params.time_saved
		});
	},

	/**
	 * Track proactive modal dismissed
	 * @param {Object} params - { percentage, plan }
	 */
	trackProactiveModalDismissed: (params = {}) => {
		analytics.track('proactive_modal_dismissed', {
			percentage: params.percentage,
			plan: params.plan
		});
	},

	/**
	 * Track proactive modal upgrade clicked
	 * @param {Object} params - { percentage, plan, discount }
	 */
	trackProactiveModalUpgradeClicked: (params = {}) => {
		analytics.track('proactive_modal_upgrade_clicked', {
			percentage: params.percentage,
			plan: params.plan,
			discount: params.discount
		});
	},

	/**
	 * Track API key created
	 */
	trackAPIKeyCreated: () => {
		analytics.track('api_key_created');
	},

	/**
	 * Track pricing page viewed
	 * @param {Object} params - { source }
	 */
	trackPricingViewed: (params = {}) => {
		analytics.track('pricing_viewed', {
			source: params.source || 'direct'
		});
	},

	/**
	 * Track upgrade started (checkout initiated)
	 * @param {Object} params - { plan, source }
	 */
	trackUpgradeStarted: (params = {}) => {
		analytics.track('upgrade_started', {
			plan: params.plan,
			source: params.source
		});
	},

	/**
	 * Track tool opened (free tool page)
	 * @param {Object} params - { tool_name }
	 */
	trackToolOpened: (params = {}) => {
		analytics.track('tool_opened', {
			tool_name: params.tool_name
		});
	},

	/**
	 * Track social share
	 * @param {Object} params - { platform, content_type, tool_name }
	 */
	trackSocialShare: (params = {}) => {
		analytics.track('social_share', {
			platform: params.platform,
			content_type: params.content_type,
			tool_name: params.tool_name
		});
	},

	// ============================================
	// Error Tracking
	// ============================================

	/**
	 * Track an error event
	 * @param {Object} params - { error_type, error_message, context, page }
	 */
	trackError: (params = {}) => {
		analytics.track('error_occurred', {
			error_type: params.error_type,
			error_message: params.error_message,
			context: params.context,
			page: params.page || window?.location?.pathname
		});
	},

	/**
	 * Track API error
	 * @param {Object} params - { endpoint, status_code, error_message }
	 */
	trackApiError: (params = {}) => {
		analytics.track('api_error', {
			endpoint: params.endpoint,
			status_code: params.status_code,
			error_message: params.error_message
		});
	},

	/**
	 * Track render error (image generation failure)
	 * @param {Object} params - { template_id, tool_name, error_message }
	 */
	trackRenderError: (params = {}) => {
		analytics.track('render_error', {
			template_id: params.template_id,
			tool_name: params.tool_name,
			error_message: params.error_message
		});
	},

	// ============================================
	// Dashboard Page Tracking
	// ============================================

	/**
	 * Track dashboard page view
	 * @param {Object} params - { page_name, template_id }
	 */
	trackDashboardPage: (params = {}) => {
		analytics.track('dashboard_page_viewed', {
			page_name: params.page_name,
			template_id: params.template_id
		});
	},

	// ============================================
	// Conversion Tracking
	// ============================================

	/**
	 * Track payment/subscription success
	 * @param {Object} params - { plan, price, currency, payment_method }
	 */
	trackPaymentSuccess: (params = {}) => {
		analytics.track('payment_completed', {
			plan: params.plan,
			price: params.price,
			currency: params.currency || 'USD',
			payment_method: params.payment_method
		});
	},

	/**
	 * Track plan change (upgrade/downgrade)
	 * @param {Object} params - { from_plan, to_plan, change_type }
	 */
	trackPlanChange: (params = {}) => {
		analytics.track('plan_changed', {
			from_plan: params.from_plan,
			to_plan: params.to_plan,
			change_type: params.change_type // 'upgrade' or 'downgrade'
		});
	},

	// ============================================
	// Form Tracking
	// ============================================

	/**
	 * Track form submission
	 * @param {Object} params - { form_name, success, page }
	 */
	trackFormSubmit: (params = {}) => {
		analytics.track('form_submitted', {
			form_name: params.form_name,
			success: params.success ?? true,
			page: params.page || window?.location?.pathname
		});
	},

	/**
	 * Track email verification
	 * @param {Object} params - { success, method }
	 */
	trackEmailVerification: (params = {}) => {
		analytics.track('email_verified', {
			success: params.success ?? true,
			method: params.method || 'link'
		});
	},

	/**
	 * Track password reset
	 * @param {Object} params - { step, success }
	 */
	trackPasswordReset: (params = {}) => {
		analytics.track('password_reset', {
			step: params.step, // 'requested' or 'completed'
			success: params.success ?? true
		});
	},

	// ============================================
	// Engagement Tracking
	// ============================================

	/**
	 * Track scroll depth on landing page
	 * @param {Object} params - { depth, page }
	 */
	trackScrollDepth: (params = {}) => {
		analytics.track('scroll_depth', {
			depth: params.depth, // 25, 50, 75, 100
			page: params.page || window?.location?.pathname
		});
	},

	/**
	 * Track outbound link click
	 * @param {Object} params - { url, link_text, location }
	 */
	trackOutboundLink: (params = {}) => {
		analytics.track('outbound_link_clicked', {
			url: params.url,
			link_text: params.link_text,
			location: params.location
		});
	},

	/**
	 * Track navigation click
	 * @param {Object} params - { link_text, destination, location }
	 */
	trackNavClick: (params = {}) => {
		analytics.track('nav_clicked', {
			link_text: params.link_text,
			destination: params.destination,
			location: params.location // 'header', 'footer', 'mobile_menu'
		});
	},

	/**
	 * Track copy action (API key, code, URL)
	 * @param {Object} params - { content_type, context }
	 */
	trackCopy: (params = {}) => {
		analytics.track('content_copied', {
			content_type: params.content_type, // 'api_key', 'code', 'url'
			context: params.context
		});
	},

	/**
	 * Track download action
	 * @param {Object} params - { content_type, format, template_id, tool_name }
	 */
	trackDownload: (params = {}) => {
		analytics.track('content_downloaded', {
			content_type: params.content_type,
			format: params.format,
			template_id: params.template_id,
			tool_name: params.tool_name
		});
	},

	// ============================================
	// Experiment Tracking
	// ============================================

	trackExperimentCreated: (params = {}) => {
		analytics.track('experiment_created', {
			type: params.type,
			variant_count: params.variant_count
		});
	},

	trackExperimentStarted: (params = {}) => {
		analytics.track('experiment_started', {
			type: params.type,
			uid: params.uid
		});
	},

	trackExperimentPaused: (params = {}) => {
		analytics.track('experiment_paused', {
			type: params.type,
			uid: params.uid
		});
	},

	trackExperimentCompleted: (params = {}) => {
		analytics.track('experiment_completed', {
			type: params.type,
			uid: params.uid,
			winner_declared: params.winner_declared
		});
	},

	trackExperimentViewed: (params = {}) => {
		analytics.track('experiment_viewed', {
			type: params.type,
			uid: params.uid
		});
	},

	trackExperimentAnalyticsViewed: (params = {}) => {
		analytics.track('experiment_analytics_viewed', {
			uid: params.uid
		});
	},

	trackExperimentVariantAdded: (params = {}) => {
		analytics.track('experiment_variant_added', {
			type: params.type
		});
	},

	trackExperimentRuleAdded: (params = {}) => {
		analytics.track('experiment_rule_added', {
			rule_type: params.rule_type
		});
	},

	trackExperimentFeatureDiscovered: (params = {}) => {
		analytics.track('experiment_feature_discovered', {
			source: params.source
		});
	},

	trackAutoOptimizeEnabled: (params = {}) => {
		analytics.track('auto_optimize_enabled', {
			uid: params.uid
		});
	},

	trackSmartLinkRuleConfigured: (params = {}) => {
		analytics.track('smart_link_rule_configured', {
			rule_type: params.rule_type
		});
	},

	trackExperimentWizardStep: (params = {}) => {
		analytics.track('experiment_wizard_step', {
			step: params.step,
			type: params.type
		});
	},

	trackExperimentWizardAbandoned: (params = {}) => {
		analytics.track('experiment_wizard_abandoned', {
			step: params.step,
			type: params.type
		});
	},

	trackExperimentWizardCompleted: (params = {}) => {
		analytics.track('experiment_wizard_completed', {
			type: params.type
		});
	}
};

export default analytics;
