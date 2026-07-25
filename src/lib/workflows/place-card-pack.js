/**
 * Place card workflow pack — built-in wedding place card designs.
 *
 * Each design is a full 1050x600 HTML document with inline CSS,
 * Google Fonts via <link>, and Handlebars {{variable}} slots. These are
 * created as regular Pictify templates (engine: 'html') when a run starts.
 */

export const PLACE_CARD_VARIABLES = ['guestName', 'tableNumber'];

export const PLACE_CARD_SAMPLE_ROW = {
	guestName: 'Eleanor Whitmore',
	tableNumber: '12'
};

const HEIRLOOM_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Great+Vibes&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1050px; height: 600px; }
	body {
		font-family: 'Cormorant Garamond', Georgia, serif;
		background: #fdfaf3;
		color: #2b2620;
		position: relative;
		overflow: hidden;
	}
	.frame-outer {
		position: absolute;
		inset: 30px;
		border: 1.5px solid #b8963f;
	}
	.frame-inner {
		position: absolute;
		inset: 42px;
		border: 1px solid rgba(184, 150, 63, 0.45);
	}
	.corner {
		position: absolute;
		width: 40px;
		height: 40px;
		border-color: #b8963f;
		border-style: solid;
		border-width: 0;
	}
	.corner.tl { top: 24px; left: 24px; border-top-width: 2.5px; border-left-width: 2.5px; }
	.corner.tr { top: 24px; right: 24px; border-top-width: 2.5px; border-right-width: 2.5px; }
	.corner.bl { bottom: 24px; left: 24px; border-bottom-width: 2.5px; border-left-width: 2.5px; }
	.corner.br { bottom: 24px; right: 24px; border-bottom-width: 2.5px; border-right-width: 2.5px; }
	.content {
		position: absolute;
		inset: 42px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 52px 80px 46px;
	}
	.ornament {
		font-size: 26px;
		color: #b8963f;
		letter-spacing: 0.6em;
		text-indent: 0.6em;
	}
	.name {
		margin-top: 34px;
		font-family: 'Great Vibes', cursive;
		font-size: 118px;
		line-height: 1.1;
		color: #2b2620;
		white-space: nowrap;
		max-width: 860px;
		overflow: hidden;
	}
	.flourish {
		margin-top: 26px;
		width: 420px;
		height: 16px;
		background:
			radial-gradient(circle at center, #b8963f 0 3px, transparent 4px) center / 16px 16px no-repeat,
			linear-gradient(#b8963f, #b8963f) left center / 185px 1px no-repeat,
			linear-gradient(#b8963f, #b8963f) right center / 185px 1px no-repeat;
	}
	.table {
		margin-top: auto;
		font-size: 27px;
		font-weight: 500;
		letter-spacing: 0.46em;
		text-indent: 0.46em;
		text-transform: uppercase;
		color: #8a713a;
	}
	.table em {
		font-style: italic;
		text-transform: none;
		letter-spacing: 0.1em;
	}
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
		<div class="ornament">&#10047;</div>
		<div class="name">{{guestName}}</div>
		<div class="flourish"></div>
		<div class="table">Table {{tableNumber}}</div>
	</div>
</body>
</html>`;

const GALLERY_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Jost:wght@400;500&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1050px; height: 600px; }
	body {
		font-family: 'Jost', 'Helvetica Neue', sans-serif;
		background: #f7f5f1;
		color: #1d1b18;
		position: relative;
		overflow: hidden;
	}
	.panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 300px;
		background: #1d1b18;
		color: #f7f5f1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.panel-label {
		font-size: 17px;
		font-weight: 500;
		letter-spacing: 0.5em;
		text-indent: 0.5em;
		text-transform: uppercase;
		color: rgba(247, 245, 241, 0.6);
	}
	.panel-number {
		margin-top: 14px;
		font-family: 'Fraunces', Georgia, serif;
		font-size: 168px;
		font-weight: 300;
		line-height: 1;
	}
	.panel-rule {
		margin-top: 30px;
		width: 44px;
		height: 1px;
		background: rgba(247, 245, 241, 0.5);
	}
	.main {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 300px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0 90px;
	}
	.kicker {
		font-size: 17px;
		font-weight: 500;
		letter-spacing: 0.55em;
		text-transform: uppercase;
		color: #98917f;
	}
	.name {
		margin-top: 30px;
		font-family: 'Fraunces', Georgia, serif;
		font-size: 88px;
		font-weight: 300;
		font-style: italic;
		line-height: 1.08;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.rule {
		margin-top: 40px;
		width: 72px;
		height: 1.5px;
		background: #1d1b18;
	}
	.note {
		margin-top: 26px;
		font-size: 20px;
		font-weight: 400;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #7d766a;
	}
</style>
</head>
<body>
	<div class="main">
		<div class="kicker">Reserved for</div>
		<div class="name">{{guestName}}</div>
		<div class="rule"></div>
		<div class="note">With love &amp; gratitude</div>
	</div>
	<div class="panel">
		<div class="panel-label">Table</div>
		<div class="panel-number">{{tableNumber}}</div>
		<div class="panel-rule"></div>
	</div>
</body>
</html>`;

export const PLACE_CARD_DESIGNS = [
	{
		id: 'heirloom',
		name: 'Heirloom',
		description: 'Classic cream card with gold frames and a flowing script name.',
		html: HEIRLOOM_HTML,
		width: 1050,
		height: 600,
		variables: PLACE_CARD_VARIABLES
	},
	{
		id: 'gallery',
		name: 'Gallery',
		description: 'Modern minimal split layout with an oversized table numeral.',
		html: GALLERY_HTML,
		width: 1050,
		height: 600,
		variables: PLACE_CARD_VARIABLES
	}
];
