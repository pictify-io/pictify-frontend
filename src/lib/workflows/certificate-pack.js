/**
 * Certificate workflow pack — built-in certificate designs.
 *
 * Each design is a full 1600x1200 HTML document with inline CSS,
 * Google Fonts via <link>, and Handlebars {{variable}} slots. These are
 * created as regular Pictify templates (engine: 'html') when a run starts.
 */

export const CERTIFICATE_VARIABLES = [
	'recipientName',
	'courseName',
	'date',
	'organizationName',
	'signatoryName'
];

export const SAMPLE_ROW = {
	recipientName: 'Amelia Hart',
	courseName: 'Advanced Product Design',
	date: 'June 12, 2026',
	organizationName: 'Northwind Academy',
	signatoryName: 'Dr. Evelyn Reed'
};

const CLASSIC_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Pinyon+Script&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1600px; height: 1200px; }
	body {
		font-family: 'Cormorant Garamond', Georgia, serif;
		background: #fbf7ee;
		color: #1c2434;
		position: relative;
		overflow: hidden;
	}
	.frame-outer {
		position: absolute;
		inset: 44px;
		border: 3px solid #1c2434;
	}
	.frame-inner {
		position: absolute;
		inset: 60px;
		border: 1px solid #b28a3e;
	}
	.corner {
		position: absolute;
		width: 56px;
		height: 56px;
		border-color: #b28a3e;
		border-style: solid;
		border-width: 0;
	}
	.corner.tl { top: 74px; left: 74px; border-top-width: 3px; border-left-width: 3px; }
	.corner.tr { top: 74px; right: 74px; border-top-width: 3px; border-right-width: 3px; }
	.corner.bl { bottom: 74px; left: 74px; border-bottom-width: 3px; border-left-width: 3px; }
	.corner.br { bottom: 74px; right: 74px; border-bottom-width: 3px; border-right-width: 3px; }
	.content {
		position: absolute;
		inset: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 96px 140px 84px;
	}
	.org {
		font-size: 30px;
		font-weight: 600;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: #8a6a2a;
	}
	.title {
		margin-top: 52px;
		font-size: 88px;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		line-height: 1;
	}
	.subtitle {
		margin-top: 14px;
		font-size: 30px;
		font-weight: 500;
		letter-spacing: 0.5em;
		text-transform: uppercase;
		color: #7a7160;
	}
	.presented {
		margin-top: 66px;
		font-size: 30px;
		font-style: italic;
		color: #5c5648;
	}
	.name {
		margin-top: 18px;
		font-family: 'Pinyon Script', cursive;
		font-size: 118px;
		line-height: 1.15;
		color: #1c2434;
		white-space: nowrap;
		max-width: 1240px;
		overflow: hidden;
	}
	.rule {
		margin-top: 6px;
		width: 620px;
		height: 22px;
		background:
			radial-gradient(circle at center, #b28a3e 0 4px, transparent 5px) center / 22px 22px no-repeat,
			linear-gradient(#b28a3e, #b28a3e) left center / 280px 1.5px no-repeat,
			linear-gradient(#b28a3e, #b28a3e) right center / 280px 1.5px no-repeat;
	}
	.reason {
		margin-top: 40px;
		font-size: 31px;
		line-height: 1.6;
		color: #4c4638;
		max-width: 1000px;
	}
	.reason strong {
		font-weight: 600;
		color: #1c2434;
	}
	.footer {
		margin-top: auto;
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}
	.sig-block {
		width: 360px;
		text-align: center;
	}
	.sig-line {
		border-top: 1.5px solid #1c2434;
		padding-top: 14px;
		font-size: 27px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.sig-label {
		margin-top: 6px;
		font-size: 19px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #8b8474;
	}
	.seal {
		width: 168px;
		height: 168px;
		border-radius: 50%;
		background: radial-gradient(circle at 34% 30%, #d4b26a, #b28a3e 58%, #8a6a2a);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(138, 106, 42, 0.35);
	}
	.seal-inner {
		width: 128px;
		height: 128px;
		border-radius: 50%;
		border: 2px solid rgba(251, 247, 238, 0.85);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #fbf7ee;
		font-size: 17px;
		font-weight: 600;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		line-height: 1.7;
	}
	.seal-star { font-size: 26px; letter-spacing: 0; }
</style>
</head>
<body>
	<div class="frame-outer"></div>
	<div class="frame-inner"></div>
	<div class="corner tl"></div>
	<div class="corner tr"></div>
	<div class="corner bl"></div>
	<div class="corner br"></div>
	<div class="content">
		<div class="org">{{organizationName}}</div>
		<div class="title">Certificate</div>
		<div class="subtitle">of Achievement</div>
		<div class="presented">This certificate is proudly presented to</div>
		<div class="name">{{recipientName}}</div>
		<div class="rule"></div>
		<div class="reason">
			for successfully completing <strong>{{courseName}}</strong><br />
			with distinction and dedication
		</div>
		<div class="footer">
			<div class="sig-block">
				<div class="sig-line">{{date}}</div>
				<div class="sig-label">Date</div>
			</div>
			<div class="seal">
				<div class="seal-inner">
					<span class="seal-star">&#10038;</span>
					<span>Certified</span>
				</div>
			</div>
			<div class="sig-block">
				<div class="sig-line">{{signatoryName}}</div>
				<div class="sig-label">Signature</div>
			</div>
		</div>
	</div>
</body>
</html>`;

const MODERN_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Archivo+Black&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1600px; height: 1200px; }
	body {
		font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
		background: #0e1116;
		color: #f4f2ec;
		position: relative;
		overflow: hidden;
	}
	.shape-circle {
		position: absolute;
		top: -280px;
		right: -280px;
		width: 760px;
		height: 760px;
		border-radius: 50%;
		border: 2px solid rgba(232, 255, 90, 0.35);
	}
	.shape-circle-2 {
		position: absolute;
		top: -200px;
		right: -200px;
		width: 600px;
		height: 600px;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 40%, rgba(232, 255, 90, 0.16), transparent 70%);
	}
	.shape-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 14px;
		background: #e8ff5a;
	}
	.shape-grid {
		position: absolute;
		bottom: 90px;
		right: 90px;
		width: 220px;
		height: 220px;
		background:
			radial-gradient(circle, rgba(244, 242, 236, 0.35) 2.5px, transparent 3px);
		background-size: 28px 28px;
	}
	.edge {
		position: absolute;
		inset: 56px;
		border: 1px solid rgba(244, 242, 236, 0.18);
		pointer-events: none;
	}
	.content {
		position: relative;
		height: 100%;
		padding: 128px 150px 110px;
		display: flex;
		flex-direction: column;
	}
	.topline {
		display: flex;
		align-items: center;
		gap: 26px;
	}
	.mark {
		width: 54px;
		height: 54px;
		background: #e8ff5a;
		clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
	}
	.org {
		font-size: 27px;
		font-weight: 700;
		letter-spacing: 0.34em;
		text-transform: uppercase;
	}
	.headline {
		margin-top: 84px;
		font-family: 'Archivo Black', 'Space Grotesk', sans-serif;
		font-size: 128px;
		line-height: 0.94;
		text-transform: uppercase;
		letter-spacing: -0.01em;
	}
	.headline .accent { color: #e8ff5a; }
	.awarded {
		margin-top: 64px;
		font-size: 26px;
		font-weight: 500;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: rgba(244, 242, 236, 0.55);
	}
	.name {
		margin-top: 20px;
		font-size: 86px;
		font-weight: 700;
		letter-spacing: -0.015em;
		white-space: nowrap;
		max-width: 1300px;
		overflow: hidden;
	}
	.course-chip {
		margin-top: 34px;
		display: inline-flex;
		align-self: flex-start;
		align-items: center;
		gap: 18px;
		border: 2px solid #e8ff5a;
		padding: 18px 34px;
		font-size: 29px;
		font-weight: 500;
		color: #e8ff5a;
	}
	.course-chip::before {
		content: '';
		width: 12px;
		height: 12px;
		background: #e8ff5a;
		border-radius: 50%;
	}
	.footer {
		margin-top: auto;
		display: flex;
		gap: 100px;
		border-top: 1px solid rgba(244, 242, 236, 0.25);
		padding-top: 36px;
	}
	.meta-label {
		font-size: 19px;
		font-weight: 700;
		letter-spacing: 0.32em;
		text-transform: uppercase;
		color: rgba(244, 242, 236, 0.45);
	}
	.meta-value {
		margin-top: 12px;
		font-size: 30px;
		font-weight: 500;
	}
</style>
</head>
<body>
	<div class="shape-circle"></div>
	<div class="shape-circle-2"></div>
	<div class="shape-grid"></div>
	<div class="shape-bar"></div>
	<div class="edge"></div>
	<div class="content">
		<div class="topline">
			<div class="mark"></div>
			<div class="org">{{organizationName}}</div>
		</div>
		<div class="headline">Certificate<br /><span class="accent">of Completion</span></div>
		<div class="awarded">Awarded to</div>
		<div class="name">{{recipientName}}</div>
		<div class="course-chip">{{courseName}}</div>
		<div class="footer">
			<div>
				<div class="meta-label">Date</div>
				<div class="meta-value">{{date}}</div>
			</div>
			<div>
				<div class="meta-label">Signed</div>
				<div class="meta-value">{{signatoryName}}</div>
			</div>
			<div>
				<div class="meta-label">Issued by</div>
				<div class="meta-value">{{organizationName}}</div>
			</div>
		</div>
	</div>
</body>
</html>`;

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1600px; height: 1200px; }
	body {
		font-family: 'Inter', 'Helvetica Neue', sans-serif;
		background: #ffffff;
		color: #17150f;
		position: relative;
		overflow: hidden;
	}
	.content {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 130px 170px 110px;
	}
	.emblem {
		width: 68px;
		height: 68px;
		border: 1px solid #17150f;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Fraunces', serif;
		font-size: 30px;
		font-weight: 300;
	}
	.org {
		margin-top: 34px;
		font-size: 21px;
		font-weight: 500;
		letter-spacing: 0.5em;
		text-transform: uppercase;
		color: #17150f;
	}
	.kicker {
		margin-top: 108px;
		font-size: 19px;
		font-weight: 400;
		letter-spacing: 0.55em;
		text-transform: uppercase;
		color: #9a958a;
	}
	.name {
		margin-top: 44px;
		font-family: 'Fraunces', Georgia, serif;
		font-size: 124px;
		font-weight: 300;
		letter-spacing: 0.005em;
		line-height: 1.05;
		white-space: nowrap;
		max-width: 1280px;
		overflow: hidden;
	}
	.divider {
		margin-top: 56px;
		width: 72px;
		height: 1px;
		background: #17150f;
	}
	.reason {
		margin-top: 52px;
		font-size: 25px;
		font-weight: 400;
		line-height: 1.8;
		color: #57534a;
		max-width: 900px;
	}
	.course {
		font-family: 'Fraunces', Georgia, serif;
		font-style: italic;
		font-weight: 300;
		font-size: 29px;
		color: #17150f;
	}
	.footer {
		margin-top: auto;
		width: 100%;
		display: flex;
		justify-content: center;
		gap: 150px;
	}
	.col {
		width: 330px;
		border-top: 1px solid #d8d4cc;
		padding-top: 26px;
	}
	.col-value {
		font-size: 24px;
		font-weight: 500;
		color: #17150f;
	}
	.col-label {
		margin-top: 10px;
		font-size: 15px;
		font-weight: 400;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: #9a958a;
	}
</style>
</head>
<body>
	<div class="content">
		<div class="emblem">&#10038;</div>
		<div class="org">{{organizationName}}</div>
		<div class="kicker">Certificate of Completion</div>
		<div class="name">{{recipientName}}</div>
		<div class="divider"></div>
		<div class="reason">
			has successfully completed<br />
			<span class="course">{{courseName}}</span>
		</div>
		<div class="footer">
			<div class="col">
				<div class="col-value">{{date}}</div>
				<div class="col-label">Date</div>
			</div>
			<div class="col">
				<div class="col-value">{{signatoryName}}</div>
				<div class="col-label">Signatory</div>
			</div>
		</div>
	</div>
</body>
</html>`;

export const CERTIFICATE_DESIGNS = [
	{
		id: 'classic',
		name: 'Classic',
		description: 'Elegant serif with a double frame, gold seal and script name.',
		html: CLASSIC_HTML,
		width: 1600,
		height: 1200,
		variables: CERTIFICATE_VARIABLES
	},
	{
		id: 'modern',
		name: 'Modern',
		description: 'Bold geometric layout on dark ground with an electric accent.',
		html: MODERN_HTML,
		width: 1600,
		height: 1200,
		variables: CERTIFICATE_VARIABLES
	},
	{
		id: 'minimal',
		name: 'Minimal',
		description: 'Quiet whitespace, thin rules and a light editorial serif.',
		html: MINIMAL_HTML,
		width: 1600,
		height: 1200,
		variables: CERTIFICATE_VARIABLES
	}
];

/**
 * Fill {{variable}} slots in a design's HTML with values (for thumbnails).
 */
export function fillDesignHtml(html, values = {}) {
	return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) =>
		values[key] !== undefined && values[key] !== '' ? String(values[key]) : match
	);
}
