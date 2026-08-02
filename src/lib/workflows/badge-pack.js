/**
 * Badge workflow pack — built-in event badge designs.
 *
 * Each design is a full 600x900 portrait HTML document with inline CSS,
 * Google Fonts via <link>, and Handlebars {{variable}} slots. These are
 * created as regular Pictify templates (engine: 'html') when a run starts.
 */

export const BADGE_VARIABLES = ['attendeeName', 'role', 'company', 'eventName'];

export const BADGE_SAMPLE_ROW = {
	attendeeName: 'Priya Sharma',
	role: 'Product Designer',
	company: 'Luma Labs',
	eventName: 'FutureStack 2026'
};

const MIDNIGHT_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;800&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 600px; height: 900px; }
	body {
		font-family: 'Sora', 'Helvetica Neue', sans-serif;
		background: #0b0d14;
		color: #f5f4ef;
		position: relative;
		overflow: hidden;
	}
	.glow {
		position: absolute;
		top: -220px;
		left: -180px;
		width: 560px;
		height: 560px;
		border-radius: 50%;
		background: radial-gradient(circle at center, rgba(124, 92, 255, 0.55), transparent 65%);
	}
	.glow-2 {
		position: absolute;
		bottom: -260px;
		right: -200px;
		width: 620px;
		height: 620px;
		border-radius: 50%;
		background: radial-gradient(circle at center, rgba(46, 226, 176, 0.28), transparent 65%);
	}
	.grid-dots {
		position: absolute;
		top: 170px;
		right: 44px;
		width: 132px;
		height: 132px;
		background: radial-gradient(circle, rgba(245, 244, 239, 0.35) 2px, transparent 2.5px);
		background-size: 22px 22px;
	}
	.edge {
		position: absolute;
		inset: 26px;
		border: 1px solid rgba(245, 244, 239, 0.16);
		border-radius: 24px;
		pointer-events: none;
	}
	.punch {
		position: absolute;
		top: 46px;
		left: 50%;
		transform: translateX(-50%);
		width: 84px;
		height: 22px;
		border-radius: 11px;
		background: #0b0d14;
		border: 2px solid rgba(245, 244, 239, 0.35);
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
	}
	.content {
		position: relative;
		height: 100%;
		padding: 118px 56px 56px;
		display: flex;
		flex-direction: column;
	}
	.event {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 20px;
		font-weight: 500;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #2ee2b0;
		text-align: center;
	}
	.rule {
		margin: 30px auto 0;
		width: 64px;
		height: 3px;
		background: linear-gradient(90deg, #7c5cff, #2ee2b0);
		border-radius: 2px;
	}
	.hello {
		margin-top: 112px;
		font-size: 19px;
		font-weight: 600;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: rgba(245, 244, 239, 0.5);
	}
	.name {
		margin-top: 22px;
		font-size: 64px;
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.02em;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.role-chip {
		margin-top: 34px;
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 13px 24px;
		border: 2px solid #7c5cff;
		border-radius: 999px;
		font-size: 21px;
		font-weight: 600;
		color: #cdbfff;
	}
	.role-chip::before {
		content: '';
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #7c5cff;
	}
	.company {
		margin-top: 18px;
		font-size: 24px;
		font-weight: 400;
		color: rgba(245, 244, 239, 0.75);
	}
	.footer {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid rgba(245, 244, 239, 0.2);
		padding-top: 26px;
	}
	.footer-label {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: rgba(245, 244, 239, 0.45);
	}
	.mark {
		width: 30px;
		height: 30px;
		background: linear-gradient(135deg, #7c5cff, #2ee2b0);
		clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
	}
</style>
</head>
<body>
	<div class="glow"></div>
	<div class="glow-2"></div>
	<div class="grid-dots"></div>
	<div class="edge"></div>
	<div class="punch"></div>
	<div class="content">
		<div class="event">{{eventName}}</div>
		<div class="rule"></div>
		<div class="hello">Attendee</div>
		<div class="name">{{attendeeName}}</div>
		<div class="role-chip">{{role}}</div>
		<div class="company">{{company}}</div>
		<div class="footer">
			<span class="footer-label">Access &middot; All areas</span>
			<span class="mark"></span>
		</div>
	</div>
</body>
</html>`;

const CRISP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet" />
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 600px; height: 900px; }
	body {
		font-family: 'Manrope', 'Helvetica Neue', sans-serif;
		background: #ffffff;
		color: #14151a;
		position: relative;
		overflow: hidden;
	}
	.band {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 216px;
		background: #ffd23f;
		border-bottom: 4px solid #14151a;
	}
	.band-stripes {
		position: absolute;
		top: 0;
		right: 0;
		width: 190px;
		height: 212px;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 14px,
			rgba(20, 21, 26, 0.14) 14px 18px
		);
	}
	.punch {
		position: absolute;
		top: 42px;
		left: 50%;
		transform: translateX(-50%);
		width: 84px;
		height: 22px;
		border-radius: 11px;
		background: #ffffff;
		border: 3px solid #14151a;
	}
	.content {
		position: relative;
		height: 100%;
		padding: 0 54px 54px;
		display: flex;
		flex-direction: column;
	}
	.event {
		margin-top: 118px;
		font-size: 25px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-align: center;
	}
	.badge-word {
		margin-top: 8px;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.5em;
		text-transform: uppercase;
		text-align: center;
		color: rgba(20, 21, 26, 0.55);
	}
	.hello {
		margin-top: 128px;
		font-size: 17px;
		font-weight: 800;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: #b8860b;
	}
	.name {
		margin-top: 16px;
		font-size: 60px;
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.02em;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.divider {
		margin-top: 30px;
		width: 74px;
		height: 5px;
		background: #14151a;
		border-radius: 3px;
	}
	.role {
		margin-top: 30px;
		font-size: 26px;
		font-weight: 600;
	}
	.company {
		margin-top: 8px;
		font-size: 22px;
		font-weight: 400;
		color: rgba(20, 21, 26, 0.6);
	}
	.footer {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 3px solid #14151a;
		padding-top: 24px;
	}
	.footer-label {
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: rgba(20, 21, 26, 0.55);
	}
	.dots { display: flex; gap: 8px; }
	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 2.5px solid #14151a;
	}
	.dot.fill { background: #ffd23f; }
</style>
</head>
<body>
	<div class="band"></div>
	<div class="band-stripes"></div>
	<div class="punch"></div>
	<div class="content">
		<div class="event">{{eventName}}</div>
		<div class="badge-word">Attendee badge</div>
		<div class="hello">Hello, I'm</div>
		<div class="name">{{attendeeName}}</div>
		<div class="divider"></div>
		<div class="role">{{role}}</div>
		<div class="company">{{company}}</div>
		<div class="footer">
			<span class="footer-label">See you there</span>
			<span class="dots">
				<span class="dot fill"></span>
				<span class="dot"></span>
				<span class="dot fill"></span>
			</span>
		</div>
	</div>
</body>
</html>`;

export const BADGE_DESIGNS = [
	{
		id: 'midnight',
		name: 'Midnight',
		description: 'Dark conference badge with aurora glows and a neon role chip.',
		html: MIDNIGHT_HTML,
		width: 600,
		height: 900,
		variables: BADGE_VARIABLES
	},
	{
		id: 'crisp',
		name: 'Crisp',
		description: 'Clean light badge with a bold yellow header band and heavy type.',
		html: CRISP_HTML,
		width: 600,
		height: 900,
		variables: BADGE_VARIABLES
	}
];
