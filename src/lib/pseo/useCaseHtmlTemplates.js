// HTML starter templates for the remaining /tools/[usecase] pages.
// Each template is a self-contained HTML document (inline CSS, system fonts)
// that renders via POST /image/public — the same engine as the API, so what
// users edit here is exactly what they'd send to /image in production.
// Variables use {{handlebars}} placeholders in the copy to teach the
// template-variable mental model, but ship with real sample values so the
// page renders a finished-looking example on first paint.

const FONT_STACK =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const templates = {
	badge: {
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
    <div style="display:inline-block;margin-top:44px;padding:14px 36px;border:2px solid #334155;border-radius:999px;color:#64748b;font-weight:700;font-size:24px;letter-spacing:.1em;">DEVHUB COMMUNITY &middot; 2026</div>
  </div>
</div>`
	},

	leaderboard: {
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

	'email-header': {
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

	'membership-card': {
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

	'portfolio-card': {
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

	'social-proof-card': {
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
	}
};

export function getHtmlTemplateForUseCase(useCaseId) {
	return templates[useCaseId] || null;
}

export const htmlTemplateIds = Object.keys(templates);
