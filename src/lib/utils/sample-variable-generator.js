/**
 * Infer realistic sample values for template variables by name heuristic.
 *
 * Used by the "Randomize" button in HtmlVariablesPanel. Writes into the
 * ephemeral `testValues` overlay — NOT the persisted `defaultValue` — so
 * exploration doesn't corrupt the template's intentional defaults (design
 * spec + plan D11).
 *
 *   sampleFor({ name: 'email', type: 'text' })  → 'ada@example.com'
 *   sampleFor({ name: 'price', type: 'text' })  → '$42.00'
 *   sampleFor({ name: 'items', type: 'text' })  → [{...}, {...}, {...}]
 *
 * If a variable name doesn't match any heuristic we fall back to a typed
 * placeholder. Faker is only imported on demand so dashboard pages that
 * never open the HTML editor don't pay the bundle cost.
 */

let _faker = null
const getFaker = async () => {
	if (!_faker) {
		const mod = await import('@faker-js/faker')
		_faker = mod.faker
	}
	return _faker
}

// Each entry: [name-matcher regex, generator(faker) → value]
const NAME_HEURISTICS = [
	[/^(full[_-]?)?name$|first[_-]?name$|user[_-]?name$/i, (f) => f.person.fullName()],
	[/^last[_-]?name$|surname$/i, (f) => f.person.lastName()],
	[/email/i, (f) => f.internet.email()],
	[/phone/i, (f) => f.phone.number()],
	[/title|heading/i, (f) => f.company.catchPhrase()],
	[/subtitle|tagline/i, (f) => f.company.buzzPhrase()],
	[/description|summary|body|content/i, (f) => f.lorem.sentences(2)],
	[/price|amount|total|cost/i, (f) => `$${f.commerce.price({ min: 9, max: 999 })}`],
	[/quantity|qty|count/i, (f) => f.number.int({ min: 1, max: 20 }).toString()],
	[/currency/i, () => 'USD'],
	[/date|updated|created/i, (f) => f.date.recent().toISOString().slice(0, 10)],
	[/url|link|href/i, (f) => f.internet.url()],
	[/avatar|photo|image|logo|src/i, (f) => f.image.avatar()],
	[/company|org|organization/i, (f) => f.company.name()],
	[/city/i, (f) => f.location.city()],
	[/country/i, (f) => f.location.country()],
	[/address/i, (f) => f.location.streetAddress()],
	[/id$|uid$/i, (f) => f.string.alphanumeric(8)],
	[/items|list|rows|products/i, (f) => [
		{ name: f.commerce.productName(), price: `$${f.commerce.price()}` },
		{ name: f.commerce.productName(), price: `$${f.commerce.price()}` },
		{ name: f.commerce.productName(), price: `$${f.commerce.price()}` }
	]]
]

/**
 * Infer a single sample value for a variable definition.
 * Exported as async because faker is dynamically imported.
 */
export const sampleFor = async (variableDef) => {
	if (!variableDef || !variableDef.name) return ''
	const faker = await getFaker()
	for (const [re, gen] of NAME_HEURISTICS) {
		if (re.test(variableDef.name)) {
			try {
				return gen(faker)
			} catch {
				// Faker throws if a method is missing; fall through to placeholder
			}
		}
	}
	// Fallback by declared type
	switch (variableDef.type) {
		case 'image':
			return faker.image.avatar()
		case 'color':
			return faker.color.rgb()
		case 'array':
			// Prefer the user's default if it's an array — randomize is
			// usually "give me realistic placeholder data", and overwriting
			// their typed-out fixtures would destroy intent. Fall back to a
			// three-item skeleton if they haven't set one.
			if (Array.isArray(variableDef.defaultValue) && variableDef.defaultValue.length > 0) {
				return variableDef.defaultValue
			}
			return [
				{ name: faker.person.firstName(), value: faker.number.int({ min: 1, max: 100 }) },
				{ name: faker.person.firstName(), value: faker.number.int({ min: 1, max: 100 }) },
				{ name: faker.person.firstName(), value: faker.number.int({ min: 1, max: 100 }) }
			]
		case 'object':
			if (
				variableDef.defaultValue &&
				typeof variableDef.defaultValue === 'object' &&
				!Array.isArray(variableDef.defaultValue)
			) {
				return variableDef.defaultValue
			}
			return {
				title: faker.lorem.words(3),
				subtitle: faker.lorem.sentence(),
				count: faker.number.int({ min: 1, max: 100 })
			}
		default:
			return faker.lorem.words(3)
	}
}

/**
 * Produce a sample-value map for an entire variableDefinitions array.
 * Returns { [name]: value }.
 */
export const sampleAll = async (variableDefinitions = []) => {
	const out = {}
	for (const def of variableDefinitions) {
		if (!def || !def.name) continue
		out[def.name] = await sampleFor(def)
	}
	return out
}
