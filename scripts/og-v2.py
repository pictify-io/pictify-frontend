"""
The 1200x630 share card, in the Repro Shop brand (Paper board BIM-0).

Prints ONE card's HTML to stdout; rasterise it at 1200x630 with any headless
Chrome (the gstack `browse` binary was used for the committed PNGs):

    python3 scripts/og-v2.py home > /tmp/og.html      # a named page
    python3 scripts/og-v2.py tool:csv-to-pdf          # any registry tool
    python3 scripts/og-v2.py alt:cloudinary           # any competitor page
    python3 scripts/og-v2.py --list tool              # slugs, one per line

TOOLS AND ALTERNATIVES ARE NOT LISTED HERE. They are read from
`src/lib/pseo/tool-cards.js` and `src/lib/pseo/comparisons.js` through node, so
a new tool or competitor gets a card without an edit to this file — the same
rule the /tools ledger follows.

Headlines can be overridden per slug in HEADLINES below, for the few routes
whose H1 is not the registry title.
"""
import json, sys, html, subprocess, os

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8">
<style>
%(fonts)s
*{box-sizing:border-box;margin:0;padding:0}
#og{position:absolute;left:0;top:0;width:1200px;height:630px;overflow:hidden;background:#D8F34A;color:#000;-webkit-font-smoothing:antialiased}
.copy{position:absolute;left:80px;top:104px;width:820px;display:flex;flex-direction:column;gap:22px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.08em;line-height:18px;text-transform:uppercase}
.h{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:%(hsize)spx;line-height:%(hline)spx;letter-spacing:-.035em}
.sub{font-family:Inter,sans-serif;font-size:24px;line-height:34px;max-width:640px}
.glyph{position:absolute;right:-68px;top:96px}
.strip{position:absolute;left:520px;bottom:-25px}
.logo{position:absolute;left:80px;bottom:56px;display:flex;align-items:center;gap:12px}
.logo span{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:30px;line-height:34px;letter-spacing:-.02em}
.url{position:absolute;right:80px;bottom:60px;font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.06em;line-height:20px}
</style></head><body><div id="og">
<div class="copy"><div class="eyebrow">%(eyebrow)s</div><div class="h">%(headline)s</div><div class="sub">%(sub)s</div></div>
<svg class="glyph" width="340" height="272" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
<rect x="20" y="60" width="20" height="20" fill="#0078BF"/><rect x="40" y="20" width="20" height="20" fill="#0078BF"/><rect x="40" y="100" width="20" height="20" fill="#FFD3E8"/><rect x="60" y="0" width="20" height="20" fill="#0078BF"/><rect x="60" y="60" width="20" height="20" fill="#0078BF"/><rect x="60" y="120" width="20" height="20" fill="#A9D7F2"/><rect x="80" y="20" width="20" height="20" fill="#0078BF"/><rect x="80" y="40" width="20" height="20" fill="#FFD3E8"/><rect x="80" y="80" width="20" height="20" fill="#0078BF"/><rect x="80" y="140" width="20" height="20" fill="#0078BF"/><rect x="100" y="0" width="20" height="20" fill="#0078BF"/><rect x="100" y="40" width="20" height="20" fill="#A9D7F2"/><rect x="100" y="60" width="20" height="20" fill="#0078BF"/><rect x="100" y="100" width="20" height="20" fill="#0078BF"/><rect x="100" y="120" width="20" height="20" fill="#FFD3E8"/><rect x="120" y="20" width="20" height="20" fill="#0078BF"/><rect x="120" y="40" width="20" height="20" fill="#0078BF"/><rect x="120" y="60" width="20" height="20" fill="#0078BF"/><rect x="120" y="80" width="20" height="20" fill="#A9D7F2"/><rect x="120" y="120" width="20" height="20" fill="#0078BF"/><rect x="120" y="140" width="20" height="20" fill="#0078BF"/><rect x="140" y="0" width="20" height="20" fill="#0078BF"/><rect x="140" y="20" width="20" height="20" fill="#000"/><rect x="140" y="40" width="20" height="20" fill="#0078BF"/><rect x="140" y="60" width="20" height="20" fill="#FFD3E8"/><rect x="140" y="80" width="20" height="20" fill="#0078BF"/><rect x="140" y="100" width="20" height="20" fill="#000"/><rect x="140" y="140" width="20" height="20" fill="#0078BF"/><rect x="160" y="0" width="20" height="20" fill="#000"/><rect x="160" y="20" width="20" height="20" fill="#0078BF"/><rect x="160" y="40" width="20" height="20" fill="#000"/><rect x="160" y="60" width="20" height="20" fill="#000"/><rect x="160" y="80" width="20" height="20" fill="#A9D7F2"/><rect x="160" y="100" width="20" height="20" fill="#000"/><rect x="160" y="120" width="20" height="20" fill="#0078BF"/><rect x="160" y="140" width="20" height="20" fill="#000"/><rect x="180" y="0" width="20" height="20" fill="#000"/><rect x="180" y="20" width="20" height="20" fill="#000"/><rect x="180" y="40" width="20" height="20" fill="#000"/><rect x="180" y="60" width="20" height="20" fill="#0078BF"/><rect x="180" y="80" width="20" height="20" fill="#000"/><rect x="180" y="100" width="20" height="20" fill="#000"/><rect x="180" y="120" width="20" height="20" fill="#000"/><rect x="180" y="140" width="20" height="20" fill="#000"/>
</svg>
<svg class="strip" width="300" height="50" viewBox="0 0 300 50" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="25" height="25" fill="#0078BF"/><rect x="50" y="0" width="25" height="25" fill="#000"/><rect x="75" y="25" width="25" height="25" fill="#0078BF"/><rect x="125" y="0" width="25" height="25" fill="#FFD3E8"/><rect x="150" y="25" width="25" height="25" fill="#0078BF"/><rect x="200" y="0" width="25" height="25" fill="#A9D7F2"/><rect x="225" y="25" width="25" height="25" fill="#0078BF"/><rect x="275" y="0" width="25" height="25" fill="#000"/></svg>
<div class="logo"><svg width="36" height="36" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="#000"/><g transform="translate(5,5) scale(0.75)"><path d="M13 10V3L4 14h7v7l9-11h-7z" fill="#D8F34A"/></g></svg><span>Pictify</span></div>
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
  "blog":        dict(eyebrow="Pictify blog", headline="Notes from the press.", sub="How templated media gets built, shipped and automated.", path="/blogs"),
  "free-account":dict(eyebrow="Free account", headline="Start free. No card.", sub="Renders, templates and the API from day one. Upgrade when you outgrow it.", path="/free-account"),
}

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def registry(module, expr):
    """Read a JS module's data through node, so this file holds no copy of it."""
    out = subprocess.run(
        ["node", "--input-type=module", "-e",
         "import('%s').then(m=>console.log(JSON.stringify(%s)))" % (module, expr)],
        cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)

def tools():
    return registry("./src/lib/pseo/tool-cards.js",
                    "Object.entries(m.TOOL_CARDS).map(([slug,t])=>({slug,...t}))")

def alternatives():
    return registry("./src/lib/pseo/comparisons.js", "m.alternatives")

# Per-slug headline overrides, for a route whose card should not say what the
# registry says. Empty today: the dedicated routes' H1s are the registry titles
# in caps, and the nine use-case routes say "Generate Badge Generator" and
# "Generate Membership Card Generator" — a copy bug worth fixing on the pages
# rather than reprinting on a share card.
HEADLINES = {}

def card_for_tool(slug):
    tool = next((t for t in tools() if t["slug"] == slug), None)
    if not tool:
        sys.exit("unknown tool: %s" % slug)
    headline = HEADLINES.get(slug, tool["title"])
    # A long headline gets the smaller of the two sizes the board allows,
    # so it cannot run past three lines in a LinkedIn preview.
    size = (76, 78) if len(headline) > 22 else (92, 92)
    return dict(eyebrow="Free tool · " + tool["meta"], headline=headline,
                sub=tool["desc"], path="/tools/" + slug,
                hsize=size[0], hline=size[1])

# /tools/html-to-png|jpg|webp are separate ranking pages sharing one registry
# entry, so they get their own cards: a card headlined "HTML to image" under a
# link that says PNG is a worse preview than the page deserves.
FORMATS = {"png": "PNG", "jpg": "JPG", "webp": "WebP"}

def card_for_format(fmt):
    base = next(t for t in tools() if t["slug"] == "html-to-image")
    label = FORMATS[fmt]
    return dict(eyebrow="Free tool · HTML → " + label.upper(),
                headline="HTML to " + label, sub=base["desc"],
                path="/tools/html-to-" + fmt, hsize=92, hline=92)

def card_for_alt(slug):
    alt = next((a for a in alternatives() if a["slug"] == slug), None)
    if not alt:
        sys.exit("unknown alternative: %s" % slug)
    headline = alt["headline"]
    size = (58, 62) if len(headline) > 38 else (76, 78)
    return dict(eyebrow="%s alternative · 2026" % alt["competitor"],
                headline=headline, sub=alt["metaDescription"],
                path="/alternatives/" + slug, hsize=size[0], hline=size[1])

if sys.argv[1] == "--list":
    kind = sys.argv[2]
    items = tools() if kind == "tool" else alternatives()
    print("\n".join(i["slug"] for i in items))
    sys.exit(0)

name = sys.argv[1]
if name.startswith("tool:"):
    raw = card_for_tool(name.split(":", 1)[1])
elif name.startswith("fmt:"):
    raw = card_for_format(name.split(":", 1)[1])
elif name.startswith("alt:"):
    raw = card_for_alt(name.split(":", 1)[1])
else:
    raw = PAGES[name]
p = {"hsize": 92, "hline": 92}; p.update(raw)
import os, io, base64, re, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
here = os.path.dirname(os.path.abspath(__file__))
cache = os.path.join(here, "fonts-src")
os.makedirs(cache, exist_ok=True)
SRC = {
  "Bricolage Grotesque": ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800", 800, {"opsz": 14, "wght": 800}),
  "Inter": ("https://fonts.googleapis.com/css2?family=Inter:wght@400", 400, {"wght": 400}),
  "JetBrains Mono": ("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400", 400, {"wght": 400}),
}
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
def raw_font(fam):
    fp = os.path.join(cache, fam.replace(" ", "-") + ".woff2")
    if not os.path.exists(fp):
        css = urllib.request.urlopen(urllib.request.Request(SRC[fam][0], headers={"User-Agent": UA})).read().decode()
        for b in re.findall(r"@font-face \{(.*?)\}", css, re.S):
            if "U+0000-00FF" in b:
                url = re.search(r"url\((https://[^)]+)\)", b).group(1)
                open(fp, "wb").write(urllib.request.urlopen(url).read()); break
    return open(fp, "rb").read()
def face(fam, text):
    f = TTFont(io.BytesIO(raw_font(fam)))
    if "fvar" in f:
        have = {a.axisTag for a in f["fvar"].axes}
        loc = {k: v for k, v in SRC[fam][2].items() if k in have}
        if loc: f = instancer.instantiateVariableFont(f, loc)
    o = subset.Options(); o.flavor = "woff2"; o.layout_features = ["kern"]; o.hinting = False
    sub = subset.Subsetter(o); sub.populate(text=text); sub.subset(f)
    buf = io.BytesIO(); f.flavor = "woff2"; f.save(buf)
    return "@font-face{font-family:'%s';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, SRC[fam][1], base64.b64encode(buf.getvalue()).decode())
fonts = "\n".join([
    face("Bricolage Grotesque", raw["headline"] + "Pictify"),
    face("Inter", raw["sub"]),
    face("JetBrains Mono", raw["eyebrow"].upper() + raw["eyebrow"] + "pictify.io" + raw["path"]),
])
p = {k: (html.escape(v) if isinstance(v, str) else v) for k, v in p.items()}
p['fonts'] = fonts
print(TEMPLATE % p)
