/**
 * FAQ Schema Builder
 * Generates FAQPage schema for FAQ sections
 */

/**
 * @typedef {Object} FAQItem
 * @property {string} q - Question text
 * @property {string} a - Answer text
 */

/**
 * Build FAQPage schema from FAQ items
 * @param {FAQItem[]} faqs - Array of FAQ items with q (question) and a (answer)
 * @returns {Object|null} FAQPage schema or null if no valid FAQs
 */
export function buildFAQSchema(faqs) {
	if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
		return null;
	}

	const validFaqs = faqs.filter((faq) => faq.q && faq.a);
	if (validFaqs.length === 0) return null;

	return {
		'@type': 'FAQPage',
		mainEntity: validFaqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.a
			}
		}))
	};
}

/**
 * Build a single Question schema (for embedding in other schemas)
 * @param {string} question - Question text
 * @param {string} answer - Answer text
 * @returns {Object} Question schema
 */
export function buildQuestionSchema(question, answer) {
	return {
		'@type': 'Question',
		name: question,
		acceptedAnswer: {
			'@type': 'Answer',
			text: answer
		}
	};
}
