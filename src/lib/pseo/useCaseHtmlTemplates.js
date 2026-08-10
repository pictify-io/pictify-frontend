// HTML starter templates for the remaining /tools/[usecase] pages.
// Each use case ships a small library of self-contained HTML documents
// (inline CSS, system fonts) that render via POST /image/public — the same
// engine as the /image API, so what users edit here is exactly what they'd
// send in production. Ship with real sample values so every template renders
// a finished-looking example on first paint; users swap values for
// {{variables}} when they automate.

const FONT_STACK =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const templates = {
	badge: [
		{
			id: 'gold-star',
			name: 'Gold Star',
			description: 'Dark ceremonial badge with a glowing gold ring',
			thumbnailColor: '#fbbf24',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%, #1e293b 0%, #0f172a 65%);font-family:${FONT_STACK};">
  <div style="text-align:center;">
    <div style="width:340px;height:340px;margin:0 auto 48px;border-radius:50%;background:conic-gradient(from 210deg, #fbbf24, #f59e0b, #fde68a, #fbbf24);display:flex;align-items:center;justify-content:center;box-shadow:0 0 90px rgba(251,191,36,.35);">
      <div style="width:296px;height:296px;border-radius:50%;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;border:6px solid rgba(251,191,36,.4);">
        <div style="font-size:96px;line-height:1;">&#9733;</div>
        <div style="color:#fbbf24;font-weight:800;font-size:34px;letter-spacing:.14em;margin-top:14px;">LEVEL 10</div>
      </div>
    </div>
    <div style="color:#e2e8f0;font-weight:800;font-size:64px;letter-spacing:-.01em;">Top Contributor</div>
    <div style="color:#94a3b8;font-weight:600;font-size:32px;margin-top:16px;">Awarded to <span style="color:#fbbf24;">Maya Chen</span></div>
    <div style="display:inline-block;margin-top:44px;padding:14px 36px;border:2px solid #334155;border-radius:999px;color:#94a3b8;font-weight:700;font-size:24px;letter-spacing:.1em;">DEVHUB COMMUNITY &middot; 2026</div>
  </div>
</div>`
		},
		{
			id: 'clean-ribbon',
			name: 'Clean Ribbon',
			description: 'Light minimal badge with a ribbon seal',
			thumbnailColor: '#0ea5e9',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;box-sizing:border-box;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};">
  <div style="width:860px;background:#ffffff;border:2px solid #e2e8f0;border-radius:36px;box-shadow:0 24px 70px rgba(2,132,199,.10);padding:80px;box-sizing:border-box;text-align:center;">
    <div style="width:180px;height:180px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#2563eb);display:flex;align-items:center;justify-content:center;box-shadow:0 16px 40px rgba(14,165,233,.35);">
      <div style="width:140px;height:140px;border-radius:50%;border:4px dashed rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:64px;">&#10003;</div>
    </div>
    <div style="display:flex;justify-content:center;margin-top:-16px;"><div style="width:0;height:0;border-left:26px solid transparent;border-right:26px solid transparent;border-top:44px solid #2563eb;transform:translateX(-30px) rotate(14deg);"></div><div style="width:0;height:0;border-left:26px solid transparent;border-right:26px solid transparent;border-top:44px solid #0ea5e9;transform:translateX(30px) rotate(-14deg);"></div></div>
    <div style="color:#0f172a;font-weight:800;font-size:58px;letter-spacing:-.01em;margin-top:36px;">Certified Expert</div>
    <div style="color:#475569;font-weight:600;font-size:30px;margin-top:16px;">Maya Chen</div>
    <div style="color:#94a3b8;font-weight:600;font-size:24px;margin-top:28px;letter-spacing:.12em;">ISSUED MARCH 2026 &middot; ACME ACADEMY</div>
  </div>
</div>`
		},
		{
			id: 'streak-flame',
			name: 'Streak',
			description: 'Bold gradient streak-milestone badge',
			thumbnailColor: '#f97316',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;box-sizing:border-box;background:linear-gradient(160deg,#7c2d12 0%,#431407 100%);display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};position:relative;overflow:hidden;">
  <div style="position:absolute;top:-120px;right:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(251,146,60,.35),transparent 70%);"></div>
  <div style="text-align:center;position:relative;">
    <div style="font-size:170px;line-height:1;">&#128293;</div>
    <div style="color:#ffffff;font-weight:800;font-size:150px;letter-spacing:-.03em;margin-top:10px;">100</div>
    <div style="color:#fdba74;font-weight:800;font-size:44px;letter-spacing:.18em;margin-top:6px;">DAY STREAK</div>
    <div style="color:rgba(255,255,255,.75);font-weight:600;font-size:30px;margin-top:36px;">Maya hasn&rsquo;t missed a day since November.</div>
    <div style="display:inline-block;margin-top:40px;padding:14px 38px;background:rgba(251,146,60,.15);border:2px solid #fb923c;border-radius:999px;color:#fdba74;font-weight:700;font-size:24px;letter-spacing:.1em;">KEEP IT BURNING</div>
  </div>
</div>`
		}
	],

	leaderboard: [
		{
			id: 'midnight',
			name: 'Midnight',
			description: 'Dark ranked list with a gold leader row',
			thumbnailColor: '#818cf8',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);padding:56px 64px;font-family:${FONT_STACK};display:flex;flex-direction:column;">
  <div style="display:flex;align-items:baseline;justify-content:space-between;">
    <div style="color:#f8fafc;font-weight:800;font-size:44px;letter-spacing:-.01em;">Weekly Leaderboard</div>
    <div style="color:#818cf8;font-weight:700;font-size:24px;">Sprint 32 &middot; Mar 3&ndash;9</div>
  </div>
  <div style="margin-top:40px;display:flex;flex-direction:column;gap:18px;">
    <div style="display:flex;align-items:center;gap:24px;background:linear-gradient(90deg,rgba(251,191,36,.16),rgba(251,191,36,.03));border:2px solid rgba(251,191,36,.5);border-radius:16px;padding:20px 28px;">
      <div style="width:56px;height:56px;border-radius:12px;background:#fbbf24;color:#0f172a;font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center;">1</div>
      <div style="color:#f8fafc;font-weight:800;font-size:32px;flex:1;">Maya Chen</div>
      <div style="color:#fbbf24;font-weight:800;font-size:32px;font-variant-numeric:tabular-nums;">2,480 pts</div>
    </div>
    <div style="display:flex;align-items:center;gap:24px;background:rgba(148,163,184,.07);border:2px solid rgba(148,163,184,.25);border-radius:16px;padding:20px 28px;">
      <div style="width:56px;height:56px;border-radius:12px;background:#cbd5e1;color:#0f172a;font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center;">2</div>
      <div style="color:#e2e8f0;font-weight:700;font-size:32px;flex:1;">Jordan Alvarez</div>
      <div style="color:#94a3b8;font-weight:800;font-size:32px;font-variant-numeric:tabular-nums;">2,190 pts</div>
    </div>
    <div style="display:flex;align-items:center;gap:24px;background:rgba(148,163,184,.07);border:2px solid rgba(148,163,184,.25);border-radius:16px;padding:20px 28px;">
      <div style="width:56px;height:56px;border-radius:12px;background:#b45309;color:#fff;font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center;">3</div>
      <div style="color:#e2e8f0;font-weight:700;font-size:32px;flex:1;">Sam Okafor</div>
      <div style="color:#94a3b8;font-weight:800;font-size:32px;font-variant-numeric:tabular-nums;">1,875 pts</div>
    </div>
  </div>
</div>`
		},
		{
			id: 'podium',
			name: 'Podium',
			description: 'Light top-three podium with medal colors',
			thumbnailColor: '#f59e0b',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:#fffbeb;padding:56px 72px;font-family:${FONT_STACK};display:flex;flex-direction:column;">
  <div style="text-align:center;">
    <div style="color:#92400e;font-weight:800;font-size:24px;letter-spacing:.26em;">MARCH CHAMPIONSHIP</div>
    <div style="color:#1c1917;font-weight:800;font-size:48px;letter-spacing:-.01em;margin-top:8px;">Top Performers</div>
  </div>
  <div style="flex:1;display:flex;align-items:flex-end;justify-content:center;gap:28px;margin-top:24px;">
    <div style="width:280px;text-align:center;">
      <div style="color:#44403c;font-weight:800;font-size:28px;">Jordan A.</div>
      <div style="color:#78716c;font-weight:700;font-size:22px;margin:6px 0 14px;font-variant-numeric:tabular-nums;">2,190 pts</div>
      <div style="height:150px;background:linear-gradient(180deg,#e7e5e4,#d6d3d1);border-radius:18px 18px 0 0;display:flex;align-items:center;justify-content:center;color:#57534e;font-weight:800;font-size:56px;">2</div>
    </div>
    <div style="width:300px;text-align:center;">
      <div style="font-size:44px;line-height:1;">&#128081;</div>
      <div style="color:#1c1917;font-weight:800;font-size:32px;margin-top:6px;">Maya Chen</div>
      <div style="color:#b45309;font-weight:800;font-size:24px;margin:6px 0 14px;font-variant-numeric:tabular-nums;">2,480 pts</div>
      <div style="height:210px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:18px 18px 0 0;display:flex;align-items:center;justify-content:center;color:#78350f;font-weight:800;font-size:64px;box-shadow:0 -10px 40px rgba(245,158,11,.35);">1</div>
    </div>
    <div style="width:280px;text-align:center;">
      <div style="color:#44403c;font-weight:800;font-size:28px;">Sam O.</div>
      <div style="color:#78716c;font-weight:700;font-size:22px;margin:6px 0 14px;font-variant-numeric:tabular-nums;">1,875 pts</div>
      <div style="height:110px;background:linear-gradient(180deg,#d97706,#b45309);border-radius:18px 18px 0 0;display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:52px;">3</div>
    </div>
  </div>
</div>`
		},
		{
			id: 'progress-bars',
			name: 'Progress',
			description: 'Clean white ranking with progress bars',
			thumbnailColor: '#10b981',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:#ffffff;padding:60px 72px;font-family:${FONT_STACK};">
  <div style="display:flex;align-items:baseline;justify-content:space-between;border-bottom:3px solid #f1f5f9;padding-bottom:24px;">
    <div style="color:#0f172a;font-weight:800;font-size:42px;">Sales Leaderboard</div>
    <div style="color:#10b981;font-weight:700;font-size:24px;">Q1 &middot; 86% to team goal</div>
  </div>
  <div style="margin-top:36px;display:flex;flex-direction:column;gap:30px;">
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#0f172a;font-weight:800;font-size:28px;">1 &nbsp; Maya Chen</span><span style="color:#059669;font-weight:800;font-size:28px;font-variant-numeric:tabular-nums;">$248k</span></div>
      <div style="height:22px;background:#f1f5f9;border-radius:999px;overflow:hidden;"><div style="width:92%;height:100%;background:linear-gradient(90deg,#10b981,#059669);border-radius:999px;"></div></div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#0f172a;font-weight:800;font-size:28px;">2 &nbsp; Jordan Alvarez</span><span style="color:#334155;font-weight:800;font-size:28px;font-variant-numeric:tabular-nums;">$219k</span></div>
      <div style="height:22px;background:#f1f5f9;border-radius:999px;overflow:hidden;"><div style="width:81%;height:100%;background:#94a3b8;border-radius:999px;"></div></div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#0f172a;font-weight:800;font-size:28px;">3 &nbsp; Sam Okafor</span><span style="color:#334155;font-weight:800;font-size:28px;font-variant-numeric:tabular-nums;">$187k</span></div>
      <div style="height:22px;background:#f1f5f9;border-radius:999px;overflow:hidden;"><div style="width:69%;height:100%;background:#cbd5e1;border-radius:999px;"></div></div>
    </div>
  </div>
</div>`
		}
	],

	'email-header': [
		{
			id: 'aurora',
			name: 'Aurora',
			description: 'Vivid violet gradient announcement banner',
			thumbnailColor: '#7c3aed',
			width: 1200,
			height: 400,
			html: `<div style="width:1200px;height:400px;box-sizing:border-box;background:linear-gradient(120deg,#4f46e5 0%,#7c3aed 55%,#db2777 100%);display:flex;align-items:center;padding:0 80px;font-family:${FONT_STACK};position:relative;overflow:hidden;">
  <div style="position:absolute;right:-120px;top:-140px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.12);"></div>
  <div style="position:absolute;right:60px;bottom:-180px;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,.08);"></div>
  <div style="position:relative;">
    <div style="display:inline-block;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);color:#fff;font-weight:700;font-size:22px;letter-spacing:.12em;padding:10px 26px;border-radius:999px;">MARCH NEWSLETTER</div>
    <div style="color:#fff;font-weight:800;font-size:64px;letter-spacing:-.02em;margin-top:24px;line-height:1.1;">What shipped this month</div>
    <div style="color:rgba(255,255,255,.85);font-weight:600;font-size:28px;margin-top:14px;">Product updates, roadmap notes, and one big announcement.</div>
  </div>
</div>`
		},
		{
			id: 'paper',
			name: 'Paper',
			description: 'Quiet editorial masthead with a serif title',
			thumbnailColor: '#a8a29e',
			width: 1200,
			height: 400,
			html: `<div style="width:1200px;height:400px;box-sizing:border-box;background:#faf9f7;display:flex;flex-direction:column;justify-content:center;padding:0 90px;font-family:${SERIF};border-bottom:6px solid #1c1917;">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #d6d3d1;padding-bottom:20px;font-family:${FONT_STACK};">
    <div style="color:#78716c;font-weight:700;font-size:22px;letter-spacing:.24em;">THE WEEKLY DISPATCH</div>
    <div style="color:#a8a29e;font-weight:600;font-size:22px;">Issue No. 42 &middot; March 2026</div>
  </div>
  <div style="color:#1c1917;font-weight:700;font-size:76px;letter-spacing:-.01em;line-height:1.1;margin-top:34px;">Notes on building calmly</div>
  <div style="color:#57534e;font-size:28px;font-style:italic;margin-top:16px;">Five ideas worth your Sunday coffee.</div>
</div>`
		},
		{
			id: 'launch-dark',
			name: 'Launch',
			description: 'Dark product-launch banner with accent glow',
			thumbnailColor: '#22d3ee',
			width: 1200,
			height: 400,
			html: `<div style="width:1200px;height:400px;box-sizing:border-box;background:#09090b;display:flex;align-items:center;justify-content:space-between;padding:0 90px;font-family:${FONT_STACK};position:relative;overflow:hidden;">
  <div style="position:absolute;left:40%;top:-220px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.25),transparent 65%);"></div>
  <div style="position:relative;">
    <div style="color:#22d3ee;font-weight:800;font-size:22px;letter-spacing:.3em;">LAUNCH DAY</div>
    <div style="color:#fafafa;font-weight:800;font-size:68px;letter-spacing:-.02em;margin-top:16px;line-height:1.05;">Workflows 2.0 is here</div>
    <div style="color:#a1a1aa;font-weight:600;font-size:26px;margin-top:14px;">Render, deliver, and prove it in one run.</div>
  </div>
  <div style="position:relative;width:150px;height:150px;border-radius:36px;background:linear-gradient(135deg,#22d3ee,#6366f1);display:flex;align-items:center;justify-content:center;color:#09090b;font-weight:800;font-size:64px;box-shadow:0 20px 60px rgba(34,211,238,.35);flex-shrink:0;">2.0</div>
</div>`
		}
	],

	'membership-card': [
		{
			id: 'gold-noir',
			name: 'Gold Noir',
			description: 'Dark luxury card with gold accents',
			thumbnailColor: '#d4af37',
			width: 1050,
			height: 600,
			html: `<div style="width:1050px;height:600px;display:flex;align-items:center;justify-content:center;background:#0b0f1a;font-family:${FONT_STACK};">
  <div style="width:920px;height:520px;border-radius:28px;background:linear-gradient(135deg,#111827 0%,#1f2937 60%,#111827 100%);border:1px solid rgba(212,175,55,.5);box-shadow:0 30px 80px rgba(0,0,0,.6);padding:56px 64px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,.15),transparent 70%);"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="color:#d4af37;font-weight:800;font-size:26px;letter-spacing:.22em;">SUMMIT CLUB</div>
        <div style="color:#6b7280;font-weight:600;font-size:20px;letter-spacing:.12em;margin-top:8px;">FOUNDING MEMBER</div>
      </div>
      <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#d4af37,#f5e08c);display:flex;align-items:center;justify-content:center;color:#111827;font-weight:800;font-size:30px;">S</div>
    </div>
    <div>
      <div style="color:#f9fafb;font-weight:800;font-size:52px;letter-spacing:-.01em;">Maya Chen</div>
      <div style="display:flex;gap:64px;margin-top:28px;">
        <div><div style="color:#6b7280;font-weight:700;font-size:18px;letter-spacing:.14em;">MEMBER NO.</div><div style="color:#d1d5db;font-weight:700;font-size:28px;margin-top:6px;font-variant-numeric:tabular-nums;">0042</div></div>
        <div><div style="color:#6b7280;font-weight:700;font-size:18px;letter-spacing:.14em;">TIER</div><div style="color:#d4af37;font-weight:700;font-size:28px;margin-top:6px;">Gold</div></div>
        <div><div style="color:#6b7280;font-weight:700;font-size:18px;letter-spacing:.14em;">VALID THRU</div><div style="color:#d1d5db;font-weight:700;font-size:28px;margin-top:6px;font-variant-numeric:tabular-nums;">12 / 2026</div></div>
      </div>
    </div>
  </div>
</div>`
		},
		{
			id: 'fitness-pass',
			name: 'Fitness Pass',
			description: 'Energetic gym pass with a diagonal accent',
			thumbnailColor: '#84cc16',
			width: 1050,
			height: 600,
			html: `<div style="width:1050px;height:600px;display:flex;align-items:center;justify-content:center;background:#18181b;font-family:${FONT_STACK};">
  <div style="width:920px;height:520px;border-radius:28px;background:#27272a;box-shadow:0 30px 80px rgba(0,0,0,.55);box-sizing:border-box;display:flex;overflow:hidden;position:relative;">
    <div style="position:absolute;left:-60px;top:0;bottom:0;width:340px;background:linear-gradient(135deg,#84cc16,#4d7c0f);transform:skewX(-12deg);"></div>
    <div style="position:relative;width:300px;display:flex;flex-direction:column;justify-content:space-between;padding:48px 20px 48px 44px;">
      <div style="color:#18181b;font-weight:800;font-size:34px;letter-spacing:-.01em;line-height:1.1;">IRON<br/>WORKS</div>
      <div style="color:#18181b;font-weight:800;font-size:96px;line-height:1;">&#9889;</div>
      <div style="color:#1a2e05;font-weight:800;font-size:20px;letter-spacing:.2em;">ALL-ACCESS</div>
    </div>
    <div style="position:relative;flex:1;padding:48px 52px;display:flex;flex-direction:column;justify-content:space-between;">
      <div style="display:flex;justify-content:flex-end;"><div style="background:rgba(132,204,22,.15);border:2px solid #84cc16;color:#a3e635;font-weight:800;font-size:20px;letter-spacing:.14em;padding:10px 24px;border-radius:999px;">ACTIVE</div></div>
      <div>
        <div style="color:#a1a1aa;font-weight:700;font-size:20px;letter-spacing:.2em;">MEMBER</div>
        <div style="color:#fafafa;font-weight:800;font-size:52px;margin-top:8px;">Maya Chen</div>
      </div>
      <div style="display:flex;gap:56px;">
        <div><div style="color:#71717a;font-weight:700;font-size:17px;letter-spacing:.14em;">ID</div><div style="color:#e4e4e7;font-weight:700;font-size:26px;margin-top:4px;font-variant-numeric:tabular-nums;">IW-2201</div></div>
        <div><div style="color:#71717a;font-weight:700;font-size:17px;letter-spacing:.14em;">PLAN</div><div style="color:#a3e635;font-weight:700;font-size:26px;margin-top:4px;">Annual</div></div>
        <div><div style="color:#71717a;font-weight:700;font-size:17px;letter-spacing:.14em;">EXPIRES</div><div style="color:#e4e4e7;font-weight:700;font-size:26px;margin-top:4px;font-variant-numeric:tabular-nums;">01 / 2027</div></div>
      </div>
    </div>
  </div>
</div>`
		},
		{
			id: 'community-light',
			name: 'Community',
			description: 'Friendly light card for clubs and associations',
			thumbnailColor: '#6366f1',
			width: 1050,
			height: 600,
			html: `<div style="width:1050px;height:600px;display:flex;align-items:center;justify-content:center;background:#eef2ff;font-family:${FONT_STACK};">
  <div style="width:920px;height:520px;border-radius:28px;background:#ffffff;border:2px solid #e0e7ff;box-shadow:0 30px 80px rgba(99,102,241,.18);padding:52px 60px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-70px;bottom:-70px;width:280px;height:280px;border-radius:50%;background:#eef2ff;"></div>
    <div style="position:absolute;right:40px;bottom:40px;width:120px;height:120px;border-radius:50%;background:#c7d2fe;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:18px;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:28px;">M</div>
        <div>
          <div style="color:#1e1b4b;font-weight:800;font-size:28px;">Makers Guild</div>
          <div style="color:#6d28d9;font-weight:700;font-size:18px;letter-spacing:.16em;">MEMBER CARD &middot; 2026</div>
        </div>
      </div>
      <div style="background:#f5f3ff;border:2px solid #ddd6fe;color:#6d28d9;font-weight:800;font-size:19px;letter-spacing:.1em;padding:10px 24px;border-radius:999px;">PRO MEMBER</div>
    </div>
    <div style="position:relative;">
      <div style="color:#0f172a;font-weight:800;font-size:56px;">Maya Chen</div>
      <div style="color:#64748b;font-weight:600;font-size:24px;margin-top:8px;">maya@makersguild.co</div>
      <div style="display:flex;gap:52px;margin-top:32px;">
        <div><div style="color:#94a3b8;font-weight:700;font-size:17px;letter-spacing:.14em;">SINCE</div><div style="color:#1e293b;font-weight:700;font-size:25px;margin-top:4px;">2023</div></div>
        <div><div style="color:#94a3b8;font-weight:700;font-size:17px;letter-spacing:.14em;">MEMBER NO.</div><div style="color:#1e293b;font-weight:700;font-size:25px;margin-top:4px;font-variant-numeric:tabular-nums;">0517</div></div>
        <div><div style="color:#94a3b8;font-weight:700;font-size:17px;letter-spacing:.14em;">RENEWS</div><div style="color:#1e293b;font-weight:700;font-size:25px;margin-top:4px;font-variant-numeric:tabular-nums;">03 / 2027</div></div>
      </div>
    </div>
  </div>
</div>`
		}
	],

	'portfolio-card': [
		{
			id: 'studio-split',
			name: 'Studio Split',
			description: 'Warm editorial split with monogram panel',
			thumbnailColor: '#f97316',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:#faf7f2;display:flex;font-family:${FONT_STACK};">
  <div style="flex:1;padding:72px 24px 72px 72px;display:flex;flex-direction:column;justify-content:center;">
    <div style="color:#c2410c;font-weight:800;font-size:22px;letter-spacing:.18em;">PRODUCT DESIGNER</div>
    <div style="color:#1c1917;font-weight:800;font-size:72px;letter-spacing:-.02em;line-height:1.05;margin-top:18px;">Maya Chen</div>
    <div style="color:#57534e;font-weight:600;font-size:28px;line-height:1.5;margin-top:22px;max-width:520px;">Design systems, mobile products, and the occasional typeface. Previously at Linear and Figma.</div>
    <div style="display:flex;gap:14px;margin-top:36px;">
      <span style="background:#1c1917;color:#faf7f2;font-weight:700;font-size:22px;padding:12px 26px;border-radius:999px;">mayachen.design</span>
      <span style="border:2px solid #d6d3d1;color:#57534e;font-weight:700;font-size:22px;padding:12px 26px;border-radius:999px;">@mayabuilds</span>
    </div>
  </div>
  <div style="width:420px;background:linear-gradient(160deg,#f97316 0%,#c2410c 100%);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
    <div style="position:absolute;top:60px;left:-60px;width:220px;height:220px;border-radius:50%;border:24px solid rgba(255,255,255,.25);"></div>
    <div style="position:absolute;bottom:-40px;right:-40px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.15);"></div>
    <div style="width:200px;height:200px;border-radius:50%;background:#faf7f2;display:flex;align-items:center;justify-content:center;color:#c2410c;font-weight:800;font-size:84px;box-shadow:0 20px 60px rgba(0,0,0,.25);">MC</div>
  </div>
</div>`
		},
		{
			id: 'terminal',
			name: 'Terminal',
			description: 'Developer card styled as a code window',
			thumbnailColor: '#34d399',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:#0a0f0d;display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};">
  <div style="width:1000px;background:#111917;border:1px solid #1f2e29;border-radius:20px;box-shadow:0 30px 90px rgba(52,211,153,.12);overflow:hidden;">
    <div style="background:#0d1512;border-bottom:1px solid #1f2e29;padding:18px 28px;display:flex;align-items:center;gap:10px;">
      <div style="width:14px;height:14px;border-radius:50%;background:#f87171;"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:#fbbf24;"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:#34d399;"></div>
      <div style="color:#3f5a51;font-family:ui-monospace,monospace;font-size:20px;margin-left:16px;">maya@dev ~ whoami</div>
    </div>
    <div style="padding:52px 60px;font-family:ui-monospace,SFMono-Regular,monospace;">
      <div style="color:#34d399;font-size:24px;">$ cat profile.json</div>
      <div style="color:#e2e8f0;font-weight:700;font-size:60px;margin-top:22px;letter-spacing:-.01em;">Maya Chen</div>
      <div style="color:#5eead4;font-size:28px;margin-top:10px;">Senior Backend Engineer &middot; Go / Rust / Postgres</div>
      <div style="margin-top:34px;display:flex;flex-direction:column;gap:12px;font-size:24px;">
        <div><span style="color:#64748b;">"github":</span> <span style="color:#fbbf24;">"@mayabuilds"</span></div>
        <div><span style="color:#64748b;">"site":</span> <span style="color:#fbbf24;">"mayachen.dev"</span></div>
        <div><span style="color:#64748b;">"status":</span> <span style="color:#34d399;">"open to interesting problems"</span></div>
      </div>
    </div>
  </div>
</div>`
		},
		{
			id: 'gallery-serif',
			name: 'Gallery',
			description: 'Minimal serif card with a photography feel',
			thumbnailColor: '#292524',
			width: 1200,
			height: 630,
			html: `<div style="width:1200px;height:630px;box-sizing:border-box;background:#f5f5f4;display:flex;align-items:center;justify-content:center;font-family:${SERIF};position:relative;overflow:hidden;">
  <div style="position:absolute;left:80px;top:70px;bottom:70px;width:4px;background:#292524;"></div>
  <div style="max-width:860px;padding-left:60px;">
    <div style="color:#78716c;font-family:${FONT_STACK};font-weight:700;font-size:21px;letter-spacing:.34em;">PHOTOGRAPHER &amp; DIRECTOR</div>
    <div style="color:#1c1917;font-weight:400;font-size:104px;letter-spacing:-.02em;line-height:1.02;margin-top:22px;">Maya Chen</div>
    <div style="color:#57534e;font-size:30px;font-style:italic;margin-top:24px;line-height:1.5;">Portraits, small towns, and available light.<br/>Selected work at <span style="border-bottom:2px solid #1c1917;font-style:normal;">mayachen.gallery</span></div>
    <div style="display:flex;gap:40px;margin-top:44px;font-family:${FONT_STACK};color:#78716c;font-weight:700;font-size:22px;letter-spacing:.08em;">
      <span>EST. 2016</span><span>&middot;</span><span>LISBON</span><span>&middot;</span><span>AVAILABLE WORLDWIDE</span>
    </div>
  </div>
</div>`
		}
	],

	'social-proof-card': [
		{
			id: 'five-star',
			name: 'Five Star',
			description: 'Bright review card with a star rating',
			thumbnailColor: '#14b8a6',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;box-sizing:border-box;background:linear-gradient(160deg,#ecfeff 0%,#f0fdfa 100%);display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};">
  <div style="width:880px;background:#ffffff;border-radius:32px;box-shadow:0 30px 90px rgba(13,148,136,.18);padding:72px;box-sizing:border-box;border:1px solid #ccfbf1;">
    <div style="color:#f59e0b;font-size:44px;letter-spacing:.1em;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
    <div style="color:#134e4a;font-weight:700;font-size:44px;line-height:1.35;margin-top:32px;">&ldquo;We swapped three internal scripts for one API call. Renders that took our team a day now happen on every webhook.&rdquo;</div>
    <div style="display:flex;align-items:center;gap:24px;margin-top:48px;">
      <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#14b8a6,#0f766e);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:36px;">JA</div>
      <div>
        <div style="color:#0f172a;font-weight:800;font-size:32px;">Jordan Alvarez</div>
        <div style="color:#64748b;font-weight:600;font-size:26px;margin-top:4px;">Head of Engineering, Northwind</div>
      </div>
    </div>
    <div style="margin-top:44px;padding-top:36px;border-top:2px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
      <div style="color:#0d9488;font-weight:800;font-size:26px;letter-spacing:.08em;">NORTHWIND &times; PICTIFY</div>
      <div style="color:#94a3b8;font-weight:700;font-size:24px;">Case study &rarr;</div>
    </div>
  </div>
</div>`
		},
		{
			id: 'dark-quote',
			name: 'Dark Quote',
			description: 'Dramatic dark testimonial with oversized quote mark',
			thumbnailColor: '#1e293b',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;box-sizing:border-box;background:#0f172a;display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};position:relative;overflow:hidden;">
  <div style="position:absolute;top:40px;left:70px;color:#1e293b;font-family:${SERIF};font-size:420px;line-height:1;">&ldquo;</div>
  <div style="position:relative;max-width:820px;padding:0 90px;">
    <div style="color:#f8fafc;font-weight:700;font-size:52px;line-height:1.35;">The certificates went out to 900 attendees before the closing keynote finished. Nobody on my team touched a zip file.</div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:56px;">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:32px;">PS</div>
      <div>
        <div style="color:#f1f5f9;font-weight:800;font-size:30px;">Priya Sharma</div>
        <div style="color:#64748b;font-weight:600;font-size:24px;margin-top:4px;">Events Lead, DevSummit</div>
      </div>
      <div style="margin-left:auto;color:#f59e0b;font-size:30px;letter-spacing:.08em;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
    </div>
  </div>
</div>`
		},
		{
			id: 'metric-pop',
			name: 'Metric Pop',
			description: 'Stat-led proof card with a big number',
			thumbnailColor: '#8b5cf6',
			width: 1080,
			height: 1080,
			html: `<div style="width:1080px;height:1080px;box-sizing:border-box;background:linear-gradient(160deg,#faf5ff 0%,#f3e8ff 100%);display:flex;align-items:center;justify-content:center;font-family:${FONT_STACK};">
  <div style="width:880px;text-align:center;">
    <div style="display:inline-block;background:#ffffff;border:2px solid #e9d5ff;color:#7c3aed;font-weight:800;font-size:24px;letter-spacing:.18em;padding:14px 34px;border-radius:999px;box-shadow:0 10px 30px rgba(139,92,246,.15);">CUSTOMER RESULTS</div>
    <div style="color:#6d28d9;font-weight:800;font-size:220px;letter-spacing:-.04em;line-height:1;margin-top:44px;">14h</div>
    <div style="color:#1e1b4b;font-weight:800;font-size:44px;margin-top:10px;">saved every single week</div>
    <div style="color:#6b7280;font-weight:600;font-size:30px;line-height:1.55;margin-top:30px;max-width:720px;margin-left:auto;margin-right:auto;">&ldquo;Reporting images used to be a Friday-afternoon job. Now the webhook does it before standup.&rdquo;</div>
    <div style="color:#7c3aed;font-weight:800;font-size:27px;margin-top:36px;">Jordan Alvarez &middot; Northwind Analytics</div>
  </div>
</div>`
		}
	]
};

/** All templates for a use case (empty array if none). */
export function getHtmlTemplatesForUseCase(useCaseId) {
	return templates[useCaseId] || [];
}

export const htmlTemplateIds = Object.keys(templates);
