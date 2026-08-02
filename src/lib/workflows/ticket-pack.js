/**
 * Ticket workflow pack — built-in numbered event ticket designs.
 *
 * Each design is a full 1600x550 landscape HTML document with inline CSS,
 * Google Fonts via <link>, and Handlebars {{variable}} slots. These are
 * created as regular Pictify templates (engine: 'html') when a run starts.
 */

export const TICKET_VARIABLES = ['eventName', 'attendeeName', 'ticketNumber', 'date', 'venue'];

export const TICKET_SAMPLE_ROW = {
	eventName: 'Aurora Sound Festival',
	attendeeName: 'Marcus Chen',
	ticketNumber: 'A-04217',
	date: 'August 22, 2026',
	venue: 'Harborfront Park, Seattle'
};

const FESTIVAL_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1600px; height: 550px; }
	body {
		font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
		background: #ff4d2e;
		color: #16130f;
		position: relative;
		overflow: hidden;
	}
	.sun {
		position: absolute;
		top: -190px;
		left: 420px;
		width: 460px;
		height: 460px;
		border-radius: 50%;
		background: #ffc531;
		border: 5px solid #16130f;
	}
	.wave {
		position: absolute;
		bottom: -70px;
		left: -40px;
		width: 1300px;
		height: 190px;
		background: #ff8fab;
		border: 5px solid #16130f;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
	}
	.main {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 420px;
		border-right: 5px dashed #16130f;
		padding: 56px 70px 48px;
		display: flex;
		flex-direction: column;
	}
	.topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.admit {
		display: inline-flex;
		padding: 10px 22px;
		background: #16130f;
		color: #ffc531;
		font-size: 19px;
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		border-radius: 999px;
	}
	.date-top {
		font-size: 22px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.event {
		position: relative;
		margin-top: 44px;
		font-family: 'Archivo Black', 'Space Grotesk', sans-serif;
		font-size: 96px;
		line-height: 0.98;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		max-width: 1020px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		text-shadow: 5px 5px 0 #ffc531;
	}
	.meta {
		position: relative;
		margin-top: auto;
		display: flex;
		gap: 70px;
	}
	.meta-label {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: rgba(22, 19, 15, 0.6);
	}
	.meta-value {
		margin-top: 8px;
		font-size: 27px;
		font-weight: 700;
	}
	.stub {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 420px;
		background: #16130f;
		color: #fdf6ec;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		padding: 52px 40px 44px;
	}
	.stub-label {
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.42em;
		text-indent: 0.42em;
		text-transform: uppercase;
		color: #ff8fab;
	}
	.stub-number {
		font-family: 'Archivo Black', 'Space Grotesk', sans-serif;
		font-size: 58px;
		color: #ffc531;
		text-align: center;
		max-width: 340px;
		overflow: hidden;
		white-space: nowrap;
	}
	.barcode {
		width: 300px;
		height: 78px;
		background:
			repeating-linear-gradient(90deg, #fdf6ec 0 4px, transparent 4px 9px),
			repeating-linear-gradient(90deg, #fdf6ec 0 2px, transparent 2px 15px);
	}
</style>
</head>
<body>
	<div class="sun"></div>
	<div class="wave"></div>
	<div class="main">
		<div class="topline">
			<span class="admit">Admit one</span>
			<span class="date-top">{{date}}</span>
		</div>
		<div class="event">{{eventName}}</div>
		<div class="meta">
			<div>
				<div class="meta-label">Guest</div>
				<div class="meta-value">{{attendeeName}}</div>
			</div>
			<div>
				<div class="meta-label">Venue</div>
				<div class="meta-value">{{venue}}</div>
			</div>
		</div>
	</div>
	<div class="stub">
		<div class="stub-label">Ticket No.</div>
		<div class="stub-number">{{ticketNumber}}</div>
		<div class="barcode"></div>
	</div>
</body>
</html>`;

const GALA_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@400;500&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 1600px; height: 550px; }
	body {
		font-family: 'Cormorant Garamond', Georgia, serif;
		background: #14161c;
		color: #ece7da;
		position: relative;
		overflow: hidden;
	}
	.frame {
		position: absolute;
		inset: 26px;
		border: 1px solid rgba(201, 168, 90, 0.55);
	}
	.frame-inner {
		position: absolute;
		inset: 36px;
		border: 1px solid rgba(201, 168, 90, 0.25);
	}
	.main {
		position: absolute;
		top: 36px;
		left: 36px;
		bottom: 36px;
		right: 436px;
		padding: 48px 70px 42px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.presents {
		font-family: 'Jost', sans-serif;
		font-size: 17px;
		font-weight: 500;
		letter-spacing: 0.55em;
		text-indent: 0.55em;
		text-transform: uppercase;
		color: #c9a85a;
	}
	.event {
		margin-top: 26px;
		font-size: 86px;
		font-weight: 500;
		line-height: 1.04;
		letter-spacing: 0.02em;
		max-width: 980px;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.flourish {
		margin-top: 26px;
		width: 380px;
		height: 14px;
		background:
			radial-gradient(circle at center, #c9a85a 0 3px, transparent 4px) center / 14px 14px no-repeat,
			linear-gradient(#c9a85a, #c9a85a) left center / 168px 1px no-repeat,
			linear-gradient(#c9a85a, #c9a85a) right center / 168px 1px no-repeat;
	}
	.meta {
		margin-top: auto;
		width: 100%;
		display: flex;
		justify-content: center;
		gap: 90px;
	}
	.meta-label {
		font-family: 'Jost', sans-serif;
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.4em;
		text-indent: 0.4em;
		text-transform: uppercase;
		color: rgba(236, 231, 218, 0.5);
	}
	.meta-value {
		margin-top: 10px;
		font-size: 28px;
		font-weight: 500;
	}
	.stub {
		position: absolute;
		top: 36px;
		right: 36px;
		bottom: 36px;
		width: 400px;
		border-left: 1px dashed rgba(201, 168, 90, 0.6);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		padding: 52px 40px 46px;
	}
	.stub-label {
		font-family: 'Jost', sans-serif;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: 0.5em;
		text-indent: 0.5em;
		text-transform: uppercase;
		color: #c9a85a;
	}
	.stub-number {
		font-size: 62px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: #ece7da;
		max-width: 320px;
		overflow: hidden;
		white-space: nowrap;
	}
	.stub-admit {
		font-family: 'Jost', sans-serif;
		font-size: 16px;
		font-weight: 500;
		letter-spacing: 0.4em;
		text-indent: 0.4em;
		text-transform: uppercase;
		border: 1px solid rgba(201, 168, 90, 0.7);
		padding: 14px 30px;
		color: rgba(236, 231, 218, 0.85);
	}
</style>
</head>
<body>
	<div class="frame"></div>
	<div class="frame-inner"></div>
	<div class="main">
		<div class="presents">You are cordially invited</div>
		<div class="event">{{eventName}}</div>
		<div class="flourish"></div>
		<div class="meta">
			<div>
				<div class="meta-label">Guest</div>
				<div class="meta-value">{{attendeeName}}</div>
			</div>
			<div>
				<div class="meta-label">Date</div>
				<div class="meta-value">{{date}}</div>
			</div>
			<div>
				<div class="meta-label">Venue</div>
				<div class="meta-value">{{venue}}</div>
			</div>
		</div>
	</div>
	<div class="stub">
		<div class="stub-label">Ticket</div>
		<div class="stub-number">{{ticketNumber}}</div>
		<div class="stub-admit">Admit One</div>
	</div>
</body>
</html>`;

export const TICKET_DESIGNS = [
	{
		id: 'festival',
		name: 'Festival',
		description: 'Loud color-block ticket with a tear-off stub and CSS barcode.',
		html: FESTIVAL_HTML,
		width: 1600,
		height: 550,
		variables: TICKET_VARIABLES
	},
	{
		id: 'gala',
		name: 'Gala',
		description: 'Elegant dark ticket with gold rules and a dashed stub divider.',
		html: GALA_HTML,
		width: 1600,
		height: 550,
		variables: TICKET_VARIABLES
	}
];
