/**
 * Generate API snippets for rendering an HTML template.
 *
 * Two languages in v1 (curl, JS fetch). Multi-language expansion is a
 * follow-up — the generator is a pure function so adding a language is
 * one case statement.
 *
 * Contract:
 *   generateSnippet(language, { uid, host, variables, format, apiToken? })
 *     → snippet string
 *
 * The token is always rendered as `YOUR_API_TOKEN` placeholder — the UI
 * never embeds a real token into a shareable snippet.
 *
 * Uses the latest SAVED template uid + the current sample variable values
 * (matches the lesson from commit 0fe1c32: "API snippet must use the edited
 * data, not stored placeholders").
 */

const API_TOKEN_PLACEHOLDER = 'YOUR_API_TOKEN'

const defaultHost = () => {
	if (typeof window !== 'undefined' && window.location) {
		const u = new URL(window.location.href)
		// Dashboard host → API host swap. Production deploys expose the API
		// at the same origin, so we default to /api for same-origin; users
		// on custom domains can substitute at copy time.
		return 'https://api.pictify.io'
	}
	return 'https://api.pictify.io'
}

const jsonLines = (obj, indent = 2) =>
	JSON.stringify(obj, null, indent)
		.split('\n')
		.join('\n')

/**
 * Produce a curl snippet targeting POST /image.
 */
const curlSnippet = ({ uid, host, variables, format }) => {
	const body = { template: uid, variables, format }
	return `curl -X POST ${host}/image \\
  -H "Authorization: Bearer ${API_TOKEN_PLACEHOLDER}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonLines(body)}'`
}

/**
 * Produce a JavaScript fetch() snippet.
 */
const jsFetchSnippet = ({ uid, host, variables, format }) => {
	return `const res = await fetch('${host}/image', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ${API_TOKEN_PLACEHOLDER}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template: '${uid}',
    format: '${format}',
    variables: ${jsonLines(variables, 2).replace(/\n/g, '\n    ')}
  })
})
const { url } = await res.json()`
}

/**
 * @param {'curl'|'js'} language
 * @param {object} opts
 * @param {string} opts.uid          saved template uid
 * @param {object} [opts.variables]  current sample variable values
 * @param {string} [opts.format]     'png' | 'jpeg' | 'pdf' — default 'png'
 * @param {string} [opts.host]       API host override (test harness)
 */
export const generateSnippet = (language, opts = {}) => {
	const ctx = {
		uid: opts.uid || 'YOUR_TEMPLATE_ID',
		host: opts.host || defaultHost(),
		variables: opts.variables || {},
		format: opts.format || 'png'
	}
	switch (language) {
		case 'curl':
			return curlSnippet(ctx)
		case 'js':
			return jsFetchSnippet(ctx)
		default:
			throw new Error(`Unsupported language: ${language}`)
	}
}

export const SUPPORTED_LANGUAGES = [
	{ key: 'curl', label: 'curl' },
	{ key: 'js', label: 'JS fetch' }
]

export { API_TOKEN_PLACEHOLDER }
