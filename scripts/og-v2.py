import json, sys, html

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
#og{position:absolute;left:0;top:0;width:1200px;height:630px;overflow:hidden;background:#D8F34A;color:#000;-webkit-font-smoothing:antialiased}
.copy{position:absolute;left:80px;top:104px;width:820px;display:flex;flex-direction:column;gap:22px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.08em;line-height:18px;text-transform:uppercase}
.h{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:%(hsize)spx;line-height:%(hline)spx;letter-spacing:-.035em;font-variation-settings:'opsz' 96}
.sub{font-family:Inter,sans-serif;font-size:24px;line-height:34px;max-width:640px}
.glyph{position:absolute;right:-68px;top:96px}
.strip{position:absolute;left:520px;bottom:-25px}
.logo{position:absolute;left:80px;bottom:56px;display:flex;align-items:center;gap:12px}
.logo span{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:30px;line-height:34px;letter-spacing:-.02em;font-variation-settings:'opsz' 96}
.url{position:absolute;right:80px;bottom:60px;font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.06em;line-height:20px}
</style></head><body><div id="og">
<div class="copy"><div class="eyebrow">%(eyebrow)s</div><div class="h">%(headline)s</div><div class="sub">%(sub)s</div></div>
<svg class="glyph" width="340" height="272" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
<rect x="20" y="60" width="20" height="20" fill="#0078BF"/><rect x="40" y="20" width="20" height="20" fill="#0078BF"/><rect x="40" y="100" width="20" height="20" fill="#FFD3E8"/><rect x="60" y="0" width="20" height="20" fill="#0078BF"/><rect x="60" y="60" width="20" height="20" fill="#0078BF"/><rect x="60" y="120" width="20" height="20" fill="#A9D7F2"/><rect x="80" y="20" width="20" height="20" fill="#0078BF"/><rect x="80" y="40" width="20" height="20" fill="#FFD3E8"/><rect x="80" y="80" width="20" height="20" fill="#0078BF"/><rect x="80" y="140" width="20" height="20" fill="#0078BF"/><rect x="100" y="0" width="20" height="20" fill="#0078BF"/><rect x="100" y="40" width="20" height="20" fill="#A9D7F2"/><rect x="100" y="60" width="20" height="20" fill="#0078BF"/><rect x="100" y="100" width="20" height="20" fill="#0078BF"/><rect x="100" y="120" width="20" height="20" fill="#FFD3E8"/><rect x="120" y="20" width="20" height="20" fill="#0078BF"/><rect x="120" y="40" width="20" height="20" fill="#0078BF"/><rect x="120" y="60" width="20" height="20" fill="#0078BF"/><rect x="120" y="80" width="20" height="20" fill="#A9D7F2"/><rect x="120" y="120" width="20" height="20" fill="#0078BF"/><rect x="120" y="140" width="20" height="20" fill="#0078BF"/><rect x="140" y="0" width="20" height="20" fill="#0078BF"/><rect x="140" y="20" width="20" height="20" fill="#000"/><rect x="140" y="40" width="20" height="20" fill="#0078BF"/><rect x="140" y="60" width="20" height="20" fill="#FFD3E8"/><rect x="140" y="80" width="20" height="20" fill="#0078BF"/><rect x="140" y="100" width="20" height="20" fill="#000"/><rect x="140" y="140" width="20" height="20" fill="#0078BF"/><rect x="160" y="0" width="20" height="20" fill="#000"/><rect x="160" y="20" width="20" height="20" fill="#0078BF"/><rect x="160" y="40" width="20" height="20" fill="#000"/><rect x="160" y="60" width="20" height="20" fill="#000"/><rect x="160" y="80" width="20" height="20" fill="#A9D7F2"/><rect x="160" y="100" width="20" height="20" fill="#000"/><rect x="160" y="120" width="20" height="20" fill="#0078BF"/><rect x="160" y="140" width="20" height="20" fill="#000"/><rect x="180" y="0" width="20" height="20" fill="#000"/><rect x="180" y="20" width="20" height="20" fill="#000"/><rect x="180" y="40" width="20" height="20" fill="#000"/><rect x="180" y="60" width="20" height="20" fill="#0078BF"/><rect x="180" y="80" width="20" height="20" fill="#000"/><rect x="180" y="100" width="20" height="20" fill="#000"/><rect x="180" y="120" width="20" height="20" fill="#000"/><rect x="180" y="140" width="20" height="20" fill="#000"/>
</svg>
<svg class="strip" width="300" height="50" viewBox="0 0 300 50" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="25" height="25" fill="#0078BF"/><rect x="50" y="0" width="25" height="25" fill="#000"/><rect x="75" y="25" width="25" height="25" fill="#0078BF"/><rect x="125" y="0" width="25" height="25" fill="#FFD3E8"/><rect x="150" y="25" width="25" height="25" fill="#0078BF"/><rect x="200" y="0" width="25" height="25" fill="#A9D7F2"/><rect x="225" y="25" width="25" height="25" fill="#0078BF"/><rect x="275" y="0" width="25" height="25" fill="#000"/></svg>
<div class="logo"><svg width="36" height="36" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="#000"/><rect x="7" y="7" width="7" height="7" fill="#FF48B0"/><rect x="14" y="14" width="7" height="7" fill="#8A8A85"/></svg><span>Pictify</span></div>
<div class="url">pictify.io%(path)s</div>
</div></body></html>"""

PAGES = {
  "home":        dict(eyebrow="HTML template in · PNG · JPG · PDF · GIF · MP4 out", headline="Templated media for developers.", sub="Write one template. Let your code, a spreadsheet, a webhook or an agent fill it.", path=""),
  "tools":       dict(eyebrow="Free tools · no sign-up", headline="Turn HTML into anything.", sub="Screenshots, PDFs, OG images, certificates. Paste HTML, download a file.", path="/tools"),
  "pricing":     dict(eyebrow="Pricing · free to start", headline="Pay for renders, not seats.", sub="A free tier, then simple monthly plans. API, templates and workflows on every plan.", path="/pricing"),
  "integrations":dict(eyebrow="Integrations · Zapier · Make · n8n · MCP", headline="Plugs into what you already run.", sub="Trigger a render from a spreadsheet, a webhook or an agent.", path="/integrations"),
  "alternatives":dict(eyebrow="Compare · HCTI · Bannerbear · Placid · Vercel OG", headline="The HTML-first alternative.", sub="How Pictify compares on formats, price and the API, side by side.", path="/alternatives"),
  "solutions":   dict(eyebrow="Solutions", headline="Images and PDFs from your data.", sub="One template, every row. Certificates, reports, cards and banners.", path="/solutions"),
  "campaigns":   dict(eyebrow="Campaigns · customer value updates · private pilot", headline="Show customers what they got.", sub="A spreadsheet in, one branded card per customer out. Your tool sends.", path="/campaigns", hsize=84, hline=86),
  "free-account":dict(eyebrow="Free account", headline="Start free. No card.", sub="Renders, templates and the API from day one. Upgrade when you outgrow it.", path="/free-account"),
}

name = sys.argv[1]
p = {"hsize": 92, "hline": 92}; p.update(PAGES[name])
p = {k: (html.escape(v) if isinstance(v, str) else v) for k, v in p.items()}
print(TEMPLATE % p)
