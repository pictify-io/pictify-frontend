/**
 * The sample data the campaigns landing page is drawn from. FE-17.
 *
 * ONE fixture for the whole page, because the page's argument is that every
 * card comes from one line of one spreadsheet. If the sheet said 1,284 and the
 * card beside it said 1,290, the page would be demonstrating the opposite of
 * what it claims — and that kind of drift is invisible in review when the two
 * numbers are typed four sections apart.
 *
 * The rows are deliberately awkward. A landing page built on tidy data proves
 * nothing: the interesting cases are the customer with no prior month, the one
 * whose number went DOWN, the seven-digit figure and the long non-Latin name,
 * because those are the four that break a template.
 *
 * Every number here is invented and the page says so wherever it appears.
 */

/** The brand the sample belongs to — the buyer, not the customer. */
export const SENDER = {
	name: 'Northwind',
	period: 'September 1 – 30, 2026',
	periodShort: 'Sep 2026'
};

/**
 * `line` is the spreadsheet line number, kept because the page shows it. Line 1
 * is the header, so the first customer is line 2 — the same rule the CSV
 * validator uses, and the reason these start at 42 rather than 1.
 */
export const ROWS = [
	{
		line: 42,
		accountId: '00042',
		company: 'Contoso Freight',
		contact: 'Dana Whitfield',
		workflows: 1284,
		lastMonth: 1146,
		hoursSaved: 312.4,
		note: null
	},
	{
		line: 43,
		accountId: '00311',
		company: 'Tailspin Toys',
		contact: 'Marco Reyes',
		workflows: 58,
		// No prior month: this customer started in September. The card leaves the
		// comparison out rather than showing a rise from zero.
		lastMonth: null,
		hoursSaved: null,
		note: 'first month'
	},
	{
		line: 388,
		accountId: '00388',
		company: 'Wide World Importers',
		contact: 'Aiko Tanaka',
		workflows: 402,
		lastMonth: 681,
		hoursSaved: 88.0,
		note: 'a dip'
	},
	{
		line: 614,
		accountId: '00614',
		company: '株式会社ファブリカム',
		contact: '田中 彩',
		workflows: 2041,
		lastMonth: 1889,
		hoursSaved: 501.2,
		note: null
	},
	{
		line: 771,
		accountId: '00771',
		company: 'Fabrikam Labs',
		contact: 'Ines Duarte',
		workflows: 1204118,
		lastMonth: 1168722,
		hoursSaved: 29873.5,
		note: null
	},
	{
		line: 519,
		accountId: '00519',
		company: 'Société Générale d’Équipement Industriel',
		contact: 'Camille Roy',
		workflows: 12,
		lastMonth: 20,
		hoursSaved: 3.0,
		note: 'longest name'
	}
];

export const TOTAL_CUSTOMERS = 248;

/** How the sheet and every card render a figure. Grouped, never rounded. */
export const num = (value) =>
	value === null || value === undefined ? '—' : value.toLocaleString('en-US');

/** One decimal for hours, because the source has one. `—` for absent. */
export const decimal = (value) =>
	value === null || value === undefined
		? '—'
		: value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * The month-on-month line, or null.
 *
 * Null when there is no prior figure — NOT "0%" and not "new". The page's third
 * rule is that a blank stays blank, so the function that produces this string
 * has to be the one that refuses, otherwise every caller re-decides it.
 */
export function comparison(row) {
	if (row.lastMonth === null || row.lastMonth === undefined || !row.lastMonth) return null;
	const delta = ((row.workflows - row.lastMonth) / row.lastMonth) * 100;
	const rounded = Math.round(Math.abs(delta));
	if (rounded === 0) return { direction: 'flat', label: 'level with August' };
	return delta > 0
		? { direction: 'up', label: `${rounded}% vs August` }
		: { direction: 'down', label: `${rounded}% vs August` };
}

export const byLine = (line) => ROWS.find((r) => r.line === line) || ROWS[0];
