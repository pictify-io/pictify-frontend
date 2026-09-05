/**
 * The sample set every design is checked against. B03-2.
 *
 * A design that fits "Acme" and clips "Société Générale d'Équipement Industriel"
 * is not a working design — it is one that has not met its hardest row yet. So
 * the studio never shows a single comfortable sample: it shows the ones most
 * likely to break, by name, and the buyer can switch between them.
 *
 * These mirror the adversarial selection the backend uses to choose preview
 * rows (service/campaign-samples.js). The studio and the preview must be
 * looking for the same failures, or a design passes here and clips there.
 */

export const SAMPLE_CASES = [
	{
		id: 'typical',
		label: 'Typical',
		why: 'an ordinary row',
		values: { account_name: 'Contoso Freight', period: 'September 2026' }
	},
	{
		id: 'longest',
		label: 'Longest name',
		why: 'most likely to overflow',
		values: {
			account_name: "Société Générale d'Équipement Industriel et Commercial du Nord",
			period: 'September 2026'
		}
	},
	{
		id: 'unicode',
		label: 'Non-Latin name',
		why: 'different glyph widths and line breaking',
		values: { account_name: '株式会社ファブリカム・ロジスティクス', period: '2026年9月' }
	},
	{
		id: 'largest',
		label: 'Largest figures',
		why: 'most digits to fit',
		values: { account_name: 'Fabrikam Labs', period: 'September 2026' }
	},
	{
		id: 'zero',
		label: 'Zero and blank',
		why: 'checks wording when a figure is small or missing',
		values: { account_name: 'Tailspin Toys', period: 'September 2026' }
	}
];

/** Numeric fills, applied to whatever metric keys the campaign defines. */
const NUMERIC_BY_CASE = {
	typical: 1284,
	longest: 412,
	unicode: 2041,
	largest: 1204118,
	zero: 0
};

/**
 * Build the full value set for one case.
 *
 * Metric keys come from the CAMPAIGN, not from a fixed list — a design that
 * binds a field the campaign does not define should show as unresolved rather
 * than being quietly filled with something plausible.
 */
export function valuesFor(sampleCase, metricKeys = []) {
	const values = { ...sampleCase.values };
	for (const key of metricKeys) {
		// The zero case deliberately leaves the SECOND metric blank, so the
		// suppressed-metric layout is exercised rather than only described.
		const isSecond = metricKeys.indexOf(key) === 1;
		values[key] =
			sampleCase.id === 'zero' && isSecond ? '' : String(NUMERIC_BY_CASE[sampleCase.id] ?? 0);
	}
	return values;
}
