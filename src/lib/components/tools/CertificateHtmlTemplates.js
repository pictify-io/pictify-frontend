/**
 * HTML certificate templates for the free certificate generator.
 * Each template renders a full 1920x1080 HTML document from the form values —
 * the same HTML the /image API renders in production, so the browser preview
 * is a truthful proxy for the generated PNG.
 */

const esc = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function elegant({ recipientName, organizationName, date, achievementText }) {
	return `<div style="width:1920px;height:1080px;box-sizing:border-box;background:#fefbf0;padding:60px;font-family:${SERIF};">
  <div style="width:100%;height:100%;box-sizing:border-box;background:#ffffff;border:6px solid #c8a76b;border-radius:24px;position:relative;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:24px;border:2px dashed #c8a76b;border-radius:18px;"></div>
    <div style="position:absolute;top:16px;left:16px;width:40px;height:40px;background:#c8a76b;opacity:.3;border-radius:4px;"></div>
    <div style="position:absolute;top:16px;right:16px;width:40px;height:40px;background:#c8a76b;opacity:.3;border-radius:4px;"></div>
    <div style="position:absolute;bottom:16px;left:16px;width:40px;height:40px;background:#c8a76b;opacity:.3;border-radius:4px;"></div>
    <div style="position:absolute;bottom:16px;right:16px;width:40px;height:40px;background:#c8a76b;opacity:.3;border-radius:4px;"></div>
    <div style="text-align:center;max-width:1400px;padding:0 80px;">
      <div style="color:#c8a76b;font-size:30px;letter-spacing:.42em;font-weight:600;">CERTIFICATE</div>
      <div style="color:#9a8459;font-size:24px;letter-spacing:.3em;margin-top:10px;">OF ACHIEVEMENT</div>
      <div style="width:220px;height:2px;background:#c8a76b;margin:36px auto;"></div>
      <div style="color:#6b7280;font-size:26px;font-style:italic;">This certificate is proudly presented to</div>
      <div style="color:#1f2937;font-size:96px;font-weight:700;margin-top:24px;line-height:1.1;">${esc(recipientName)}</div>
      <div style="color:#4b5563;font-size:30px;line-height:1.6;margin-top:32px;max-width:1100px;margin-left:auto;margin-right:auto;">${esc(achievementText)}</div>
      <div style="display:flex;justify-content:center;gap:180px;margin-top:70px;">
        <div style="text-align:center;">
          <div style="color:#1f2937;font-size:28px;font-weight:600;border-top:2px solid #c8a76b;padding-top:14px;min-width:320px;">${esc(organizationName)}</div>
          <div style="color:#9ca3af;font-size:20px;letter-spacing:.2em;margin-top:8px;">ORGANIZATION</div>
        </div>
        <div style="text-align:center;">
          <div style="color:#1f2937;font-size:28px;font-weight:600;border-top:2px solid #c8a76b;padding-top:14px;min-width:320px;">${esc(date)}</div>
          <div style="color:#9ca3af;font-size:20px;letter-spacing:.2em;margin-top:8px;">DATE</div>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

function modernDark({ recipientName, organizationName, date, achievementText }) {
	return `<div style="width:1920px;height:1080px;box-sizing:border-box;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);font-family:${SANS};position:relative;overflow:hidden;display:flex;align-items:center;">
  <div style="position:absolute;left:0;top:0;bottom:0;width:16px;background:linear-gradient(180deg,#22d3ee,#818cf8);"></div>
  <div style="position:absolute;right:-160px;top:-160px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.15),transparent 70%);"></div>
  <div style="position:absolute;right:120px;bottom:80px;width:180px;height:180px;border:2px solid rgba(129,140,248,.35);border-radius:24px;transform:rotate(18deg);"></div>
  <div style="padding:0 160px;position:relative;">
    <div style="display:inline-block;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.5);color:#22d3ee;font-weight:700;font-size:24px;letter-spacing:.28em;padding:12px 32px;border-radius:999px;">CERTIFICATE OF ACHIEVEMENT</div>
    <div style="color:#f8fafc;font-weight:800;font-size:110px;letter-spacing:-.02em;line-height:1.05;margin-top:48px;">${esc(recipientName)}</div>
    <div style="color:#94a3b8;font-weight:500;font-size:32px;line-height:1.6;margin-top:36px;max-width:1100px;">${esc(achievementText)}</div>
    <div style="display:flex;gap:120px;margin-top:80px;">
      <div>
        <div style="color:#e2e8f0;font-weight:700;font-size:30px;">${esc(organizationName)}</div>
        <div style="color:#475569;font-weight:700;font-size:20px;letter-spacing:.24em;margin-top:10px;">ISSUED BY</div>
      </div>
      <div>
        <div style="color:#e2e8f0;font-weight:700;font-size:30px;">${esc(date)}</div>
        <div style="color:#475569;font-weight:700;font-size:20px;letter-spacing:.24em;margin-top:10px;">DATE</div>
      </div>
    </div>
  </div>
</div>`;
}

function corporate({ recipientName, organizationName, date, achievementText }) {
	return `<div style="width:1920px;height:1080px;box-sizing:border-box;background:#ffffff;font-family:${SANS};display:flex;flex-direction:column;">
  <div style="height:180px;background:linear-gradient(90deg,#1e3a8a,#1d4ed8);display:flex;align-items:center;justify-content:space-between;padding:0 120px;">
    <div style="color:#ffffff;font-weight:800;font-size:40px;letter-spacing:.02em;">${esc(organizationName)}</div>
    <div style="color:rgba(255,255,255,.8);font-weight:700;font-size:24px;letter-spacing:.3em;">CERTIFICATE</div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;">
    <div style="position:absolute;bottom:0;left:0;right:0;height:14px;background:linear-gradient(90deg,#1e3a8a,#1d4ed8);"></div>
    <div style="text-align:center;max-width:1400px;padding:0 100px;">
      <div style="color:#1d4ed8;font-weight:700;font-size:28px;letter-spacing:.32em;">CERTIFICATE OF COMPLETION</div>
      <div style="color:#6b7280;font-size:26px;margin-top:40px;">This is to certify that</div>
      <div style="color:#111827;font-weight:800;font-size:96px;margin-top:20px;line-height:1.1;">${esc(recipientName)}</div>
      <div style="width:640px;height:3px;background:#e5e7eb;margin:40px auto;"></div>
      <div style="color:#374151;font-size:30px;line-height:1.6;max-width:1100px;margin:0 auto;">${esc(achievementText)}</div>
      <div style="color:#6b7280;font-weight:600;font-size:26px;margin-top:60px;">Awarded on ${esc(date)}</div>
    </div>
  </div>
</div>`;
}

function minimalist({ recipientName, organizationName, date, achievementText }) {
	return `<div style="width:1920px;height:1080px;box-sizing:border-box;background:#fafafa;padding:100px;font-family:${SANS};">
  <div style="width:100%;height:100%;box-sizing:border-box;background:#ffffff;border:2px solid #111827;display:flex;flex-direction:column;justify-content:space-between;padding:90px 110px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="color:#111827;font-weight:700;font-size:24px;letter-spacing:.4em;">CERTIFICATE</div>
      <div style="width:56px;height:56px;border:2px solid #111827;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#111827;font-weight:700;font-size:24px;">&#10003;</div>
    </div>
    <div>
      <div style="color:#9ca3af;font-size:26px;letter-spacing:.14em;">AWARDED TO</div>
      <div style="color:#111827;font-weight:300;font-size:110px;letter-spacing:-.02em;line-height:1.05;margin-top:24px;">${esc(recipientName)}</div>
      <div style="width:120px;height:4px;background:#111827;margin-top:40px;"></div>
      <div style="color:#4b5563;font-size:30px;line-height:1.6;margin-top:40px;max-width:1200px;">${esc(achievementText)}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e5e7eb;padding-top:36px;">
      <div style="color:#111827;font-weight:600;font-size:26px;">${esc(organizationName)}</div>
      <div style="color:#6b7280;font-size:26px;">${esc(date)}</div>
    </div>
  </div>
</div>`;
}

function creative({ recipientName, organizationName, date, achievementText }) {
	return `<div style="width:1920px;height:1080px;box-sizing:border-box;background:linear-gradient(140deg,#fff7ed 0%,#ffedd5 100%);font-family:${SANS};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;top:-140px;left:-140px;width:460px;height:460px;border-radius:50%;background:#fb923c;opacity:.25;"></div>
  <div style="position:absolute;bottom:-180px;right:-120px;width:520px;height:520px;border-radius:50%;background:#f472b6;opacity:.2;"></div>
  <div style="position:absolute;top:120px;right:200px;width:120px;height:120px;background:#fbbf24;opacity:.35;border-radius:28px;transform:rotate(24deg);"></div>
  <div style="width:1560px;background:#ffffff;border-radius:40px;box-shadow:0 40px 120px rgba(234,88,12,.18);padding:90px 110px;box-sizing:border-box;text-align:center;position:relative;">
    <div style="display:inline-block;background:linear-gradient(90deg,#fb923c,#f472b6);color:#ffffff;font-weight:800;font-size:26px;letter-spacing:.22em;padding:14px 40px;border-radius:999px;">YOU DID IT!</div>
    <div style="color:#9a3412;font-weight:700;font-size:26px;letter-spacing:.3em;margin-top:44px;">CERTIFICATE OF ACHIEVEMENT</div>
    <div style="color:#1c1917;font-weight:800;font-size:100px;line-height:1.1;margin-top:24px;">${esc(recipientName)}</div>
    <div style="color:#57534e;font-size:30px;line-height:1.6;margin-top:32px;max-width:1100px;margin-left:auto;margin-right:auto;">${esc(achievementText)}</div>
    <div style="display:flex;justify-content:center;gap:24px;margin-top:56px;flex-wrap:wrap;">
      <div style="background:#fff7ed;border:2px solid #fdba74;color:#9a3412;font-weight:700;font-size:26px;padding:16px 36px;border-radius:999px;">${esc(organizationName)}</div>
      <div style="background:#fdf2f8;border:2px solid #f9a8d4;color:#9d174d;font-weight:700;font-size:26px;padding:16px 36px;border-radius:999px;">${esc(date)}</div>
    </div>
  </div>
</div>`;
}

export const certificateHtmlTemplates = [
	{
		id: 'elegant',
		name: 'Elegant',
		description: 'Classic formal certificate with gold borders and elegant serif typography',
		thumbnailColor: '#c8a76b',
		width: 1920,
		height: 1080,
		render: elegant
	},
	{
		id: 'modern-dark',
		name: 'Modern Dark',
		description: 'Bold dark design with a cyan accent, built for tech courses and communities',
		thumbnailColor: '#22d3ee',
		width: 1920,
		height: 1080,
		render: modernDark
	},
	{
		id: 'corporate',
		name: 'Corporate',
		description: 'Professional blue-banded layout for trainings and compliance programs',
		thumbnailColor: '#1d4ed8',
		width: 1920,
		height: 1080,
		render: corporate
	},
	{
		id: 'minimalist',
		name: 'Minimalist',
		description: 'Clean monochrome layout with generous whitespace and light typography',
		thumbnailColor: '#111827',
		width: 1920,
		height: 1080,
		render: minimalist
	},
	{
		id: 'creative',
		name: 'Creative',
		description: 'Playful warm gradient card for workshops, bootcamps, and communities',
		thumbnailColor: '#fb923c',
		width: 1920,
		height: 1080,
		render: creative
	}
];
