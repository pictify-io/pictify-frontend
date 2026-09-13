"""
Blog covers: a 1200x630 specimen of what the post is about, in the Repro Shop brand.

    python3 scripts/blog-cover.py <slug> > /tmp/cover.html
    python3 scripts/blog-cover.py --list

Prints one cover's HTML to stdout; rasterise at 1200x630 with a headless Chrome
that can reach Google Fonts (wait for document.fonts.ready), upload to Sanity,
set the post's `heroImage`.

THE RULE. The cover shows the thing the post teaches you to make — a rendered
certificate for the certificates post, a browser capture becoming a PNG for the
URL post, a filmstrip for the GIF post. Never the post's title (the page and the
card already say it), never abstract decoration (a placeholder says nothing).
Specimen text is allowed because it is the specimen's content, not ours.

Every scene is built from the site's own parts: paper sheets with a 1.5px ink
border and a hard offset shadow, mono labels, the riso palette, the pixel
cluster only as a small signature. One scene per slug, in SCENES.
"""
import sys, html

W, H = 1200, 630
INK, PAPER, CANVAS = "#000000", "#FFFFFF", "#E2E4DD"
FIELD, POWDER, ROSE, SKY, BLUE, ROYAL, PINK, MUTE, SLATE = "#D8F34A", "#D3E7F6", "#FFD3E8", "#A9D7F2", "#0078BF", "#0054A6", "#FF48B0", "#8A8A85", "#383A42"

HEAD = """<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:%(w)dpx;height:%(h)dpx;overflow:hidden}
#cover{position:relative;width:%(w)dpx;height:%(h)dpx;overflow:hidden;background:%(bg)s;font-family:Inter,sans-serif;color:#000;-webkit-font-smoothing:antialiased}
.mono{font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
.disp{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;letter-spacing:-.03em}
.sheet{position:absolute;background:#fff;border:1.5px solid #000;border-radius:14px;box-shadow:8px 8px 0 0 #000}
.tag{position:absolute;left:56px;bottom:44px;font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:14px;align-items:center}
.tag b{font-weight:700;background:#000;color:#fff;padding:6px 10px;border-radius:4px}
.bar{position:absolute;height:12px;border-radius:2px;background:#000}
.px{position:absolute;width:24px;height:24px}
</style></head><body><div id="cover">"""
FOOT = """</div></body></html>"""


def signature(x=1080, y=36, cells=None):
    """The small pixel cluster, top-right — a signature, not a subject."""
    cells = cells or [(0, 0, BLUE), (1, 0, INK), (2, 1, BLUE), (1, 2, PINK), (2, 2, INK), (3, 1, SKY), (3, 2, BLUE), (3, 0, ROSE)]
    return "".join(f'<div class="px" style="left:{x + c*24}px;top:{y + r*24}px;background:{col}"></div>' for c, r, col in cells)


def tag(label, chip):
    return f'<div class="tag"><b>{html.escape(chip)}</b><span>{html.escape(label)}</span></div>'


# ── Scenes ──────────────────────────────────────────────────────────────────

def browser(x, y, w, h, url, inner):
    """A browser window: chrome bar with three dots and a URL pill, then the page."""
    return (f'<div class="sheet" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;overflow:hidden">'
            f'<div style="height:40px;border-bottom:1.5px solid #000;background:{CANVAS};display:flex;align-items:center;gap:8px;padding:0 14px">'
            f'<i style="width:10px;height:10px;border-radius:50%;background:#000;display:block"></i><i style="width:10px;height:10px;border-radius:50%;border:1.5px solid #000;display:block"></i><i style="width:10px;height:10px;border-radius:50%;border:1.5px solid #000;display:block"></i>'
            f'<div class="mono" style="margin-left:10px;flex:1;height:22px;border:1.5px solid #000;border-radius:9999px;background:#fff;font-size:10px;letter-spacing:.04em;text-transform:none;display:flex;align-items:center;padding:0 10px">{html.escape(url)}</div></div>'
            f'<div style="position:relative;height:{h-42}px;overflow:hidden">{inner}</div></div>')


def mini_page(accent=FIELD):
    """A generic landing page made of blocks — the thing being captured."""
    return (f'<div style="position:absolute;left:0;top:0;right:0;height:34px;border-bottom:1.5px solid #000;display:flex;align-items:center;gap:10px;padding:0 16px">'
            f'<div style="width:16px;height:16px;background:#000;border-radius:4px"></div><div class="bar" style="position:static;width:54px;height:8px"></div><div style="flex:1"></div><div class="bar" style="position:static;width:40px;height:8px"></div><div class="bar" style="position:static;width:40px;height:8px"></div><div style="width:64px;height:18px;background:#000;border-radius:3px"></div></div>'
            f'<div style="position:absolute;left:16px;top:56px;width:200px;height:20px;background:#000;border-radius:3px"></div>'
            f'<div style="position:absolute;left:16px;top:84px;width:150px;height:20px;background:#000;border-radius:3px"></div>'
            f'<div class="bar" style="left:16px;top:118px;width:170px;height:8px;background:{MUTE}"></div><div class="bar" style="left:16px;top:132px;width:130px;height:8px;background:{MUTE}"></div>'
            f'<div style="position:absolute;left:16px;top:154px;width:76px;height:22px;background:{PINK};border:1.5px solid #000;border-radius:3px"></div>'
            f'<div style="position:absolute;right:16px;top:56px;width:150px;height:120px;background:{accent};border:1.5px solid #000;border-radius:8px"></div>')


def scene_url_to_image():
    left = browser(56, 92, 520, 380, "https://acme.dev/pricing", mini_page(FIELD))
    arrow = f'<div class="disp" style="position:absolute;left:600px;top:250px;font-size:72px;line-height:1">→</div>'
    # the output: the same page, now a file
    right = (f'<div class="sheet" style="left:680px;top:120px;width:460px;height:330px;overflow:hidden;background:{POWDER}">'
             f'<div style="position:absolute;left:0;top:0;right:0;bottom:0;background:#fff;margin:26px 26px 60px 26px;border:1.5px solid #000;border-radius:8px;overflow:hidden;transform:scale(1)">{mini_page(FIELD)}</div>'
             f'<div class="mono" style="position:absolute;left:26px;bottom:20px;font-size:12px;display:flex;gap:10px;align-items:center"><b style="background:#000;color:#fff;padding:4px 8px;border-radius:4px">PNG</b>pricing.png · 1200×630 · 84 KB</div></div>')
    return POWDER, left + arrow + right + tag("one url in, one file out", "URL → PNG") + signature()


def scene_certificates():
    def cert(x, y, name, rot, ghost=False):
        bg = PAPER
        body = "" if ghost else (
            f'<div class="mono" style="position:absolute;left:0;right:0;top:44px;text-align:center;font-size:12px;color:{SLATE}">Certificate of completion</div>'
            f'<div class="disp" style="position:absolute;left:0;right:0;top:80px;text-align:center;font-size:44px;line-height:1.05">{html.escape(name)}</div>'
            f'<div style="position:absolute;left:0;right:0;top:146px;text-align:center;font-size:15px;color:{SLATE}">completed <b style="color:#000">Rendering at Scale</b>, a 6-week course</div>'
            f'<div class="mono" style="position:absolute;left:48px;bottom:40px;font-size:11px;color:{SLATE}">12 Sep 2026 · No. PC-0311</div>'
            f'<div style="position:absolute;right:52px;bottom:34px;width:64px;height:64px;border-radius:50%;background:{PINK};border:1.5px solid #000;box-shadow:3px 3px 0 0 #000;display:flex;align-items:center;justify-content:center"><div class="disp" style="font-size:26px;color:#000">★</div></div>'
            f'<div style="position:absolute;left:48px;bottom:74px;width:150px;border-top:1.5px solid #000"></div><div class="mono" style="position:absolute;left:48px;bottom:60px;font-size:9px;color:{MUTE}">instructor</div>')
        return (f'<div class="sheet" style="left:{x}px;top:{y}px;width:640px;height:400px;background:{bg};transform:rotate({rot}deg);border-width:1.5px">'
                f'<div style="position:absolute;inset:14px;border:1.5px solid #000;border-radius:8px"></div>{body}</div>')
    stack = cert(300, 160, "", 3, ghost=True) + cert(280, 140, "", 1.5, ghost=True) + cert(260, 118, "Priya Raman", 0)
    counter = f'<div class="mono" style="position:absolute;left:56px;top:96px;font-size:14px;display:flex;flex-direction:column;gap:10px"><b style="background:#000;color:#fff;padding:6px 10px;border-radius:4px;width:max-content">1 of 312</b><span style="color:{SLATE};text-transform:none;letter-spacing:0;font-family:Inter;font-size:14px;max-width:170px;line-height:20px">one row of the roster, one file</span></div>'
    return ROSE, stack + counter + tag("html template · names from a sheet", "PDF") + signature()


def scene_html_to_gif():
    frames = ""
    for i, pct in enumerate([0, 33, 66, 100]):
        x = 56 + i * 272
        frames += (f'<div class="sheet" style="left:{x}px;top:150px;width:248px;height:300px;background:#fff;overflow:hidden">'
                   f'<div class="mono" style="position:absolute;left:16px;top:14px;font-size:10px;color:{MUTE}">frame {i+1:02d}</div>'
                   f'<div class="disp" style="position:absolute;left:16px;top:40px;font-size:30px">Upload</div>'
                   f'<div style="position:absolute;left:16px;right:16px;top:100px;height:22px;border:1.5px solid #000;border-radius:9999px;overflow:hidden;background:#fff"><div style="width:{pct}%;height:100%;background:{FIELD};border-right:{"1.5px solid #000" if 0<pct<100 else "0"}"></div></div>'
                   f'<div class="mono" style="position:absolute;left:16px;top:134px;font-size:12px">{pct}%</div>'
                   f'<div style="position:absolute;left:16px;top:180px;width:{110 + i*30}px;height:44px;background:{"#000" if pct==100 else "#fff"};border:1.5px solid #000;border-radius:4px;display:flex;align-items:center;justify-content:center;color:{"#fff" if pct==100 else "#000"};font-weight:600;font-size:14px">{"Done ✓" if pct==100 else "Uploading…"}</div>'
                   f'<div class="mono" style="position:absolute;left:16px;bottom:14px;font-size:10px;color:{MUTE}">t = {i*0.4:.1f}s</div></div>')
    holes = "".join(f'<div style="position:absolute;left:{70 + k*56}px;top:{y}px;width:22px;height:14px;background:#000;border-radius:2px"></div>' for k in range(20) for y in (112, 470))
    return SKY, holes + frames + tag("css animation, rendered frame by frame", "HTML → GIF") + signature()


SCENES = {
    "how-to-create-image-from-url": scene_url_to_image,
    "how-to-create-certificates-from-html-templates": scene_certificates,
    "html-to-gif-how-to-create-animated-images-from-code": scene_html_to_gif,
}

# ── helpers for the remaining scenes ─────────────────────────────────────────

def sheet(x, y, w, h, inner="", bg=PAPER, rot=0, extra=""):
    return (f'<div class="sheet" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{bg};'
            f'transform:rotate({rot}deg);overflow:hidden;{extra}">{inner}</div>')

def mono(x, y, text, size=11, color=INK, extra=""):
    return f'<div class="mono" style="position:absolute;left:{x}px;top:{y}px;font-size:{size}px;color:{color};{extra}">{html.escape(text)}</div>'

def chip(x, y, text, bg=INK, fg=PAPER, size=11):
    return f'<div class="mono" style="position:absolute;left:{x}px;top:{y}px;font-size:{size}px;font-weight:700;background:{bg};color:{fg};padding:5px 9px;border-radius:4px;border:1.5px solid #000">{html.escape(text)}</div>'

def block(x, y, w, h, bg=INK, r=3, border=False):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{bg};border-radius:{r}px;{"border:1.5px solid #000" if border else ""}"></div>'

def avatar(x, y, d=40, bg=BLUE, letter="P"):
    return f'<div class="disp" style="position:absolute;left:{x}px;top:{y}px;width:{d}px;height:{d}px;border-radius:50%;background:{bg};border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font-size:{d//2}px;color:#fff">{letter}</div>'

def arrow(x, y, size=64):
    return f'<div class="disp" style="position:absolute;left:{x}px;top:{y}px;font-size:{size}px;line-height:1">→</div>'


def scene_screenshot_api():
    page = mini_page(FIELD)
    desk = browser(56, 100, 560, 360, "https://acme.dev", page)
    tablet = (f'<div class="sheet" style="left:660px;top:120px;width:240px;height:320px;border-radius:18px;padding:14px;overflow:hidden">'
              f'<div style="position:relative;width:100%;height:100%;border:1.5px solid #000;border-radius:8px;overflow:hidden">{mini_page(POWDER)}</div></div>')
    phone_banner = (f'<div style="position:absolute;left:8px;right:8px;bottom:8px;background:#fff;border:1.5px solid #000;border-radius:6px;padding:8px;font-size:9px;line-height:12px">We use cookies.'
                    f'<div style="margin-top:6px;display:flex;gap:6px"><span style="background:#000;color:#fff;padding:2px 6px;border-radius:3px;font-size:8px">Accept</span><span class="mono" style="font-size:8px;text-decoration:line-through;color:{MUTE}">dismissed</span></div></div>')
    phone = (f'<div class="sheet" style="left:940px;top:100px;width:180px;height:360px;border-radius:26px;padding:12px;overflow:hidden">'
             f'<div style="position:relative;width:100%;height:100%;border:1.5px solid #000;border-radius:14px;overflow:hidden">{mini_page(ROSE)}{phone_banner}</div></div>')
    labels = mono(56, 478, "1440 × 900", 11, SLATE) + mono(660, 458, "768 × 1024", 11, SLATE) + mono(940, 478, "390 × 844", 11, SLATE)
    return POWDER, desk + tablet + phone + labels + tag("same url · three viewports · cookie banner gone", "URL → PNG") + signature()


def scene_handlebars():
    code = ("&lt;h1&gt;Hi <b style='color:#0054A6'>{{name}}</b>&lt;/h1&gt;\n"
            "<b style='color:#FF48B0'>{{#each</b> items<b style='color:#FF48B0'>}}</b>\n"
            "  &lt;li&gt;<b style='color:#0054A6'>{{this}}</b>&lt;/li&gt;\n"
            "<b style='color:#FF48B0'>{{/each}}</b>\n"
            "<b style='color:#FF48B0'>{{#if</b> pro<b style='color:#FF48B0'>}}</b>&lt;span&gt;Pro&lt;/span&gt;<b style='color:#FF48B0'>{{/if}}</b>")
    left = sheet(56, 110, 500, 360, f'<div class="mono" style="position:absolute;left:24px;top:18px;font-size:10px;color:{MUTE}">template.hbs</div>'
                 f'<pre style="position:absolute;left:24px;top:52px;font-family:\'JetBrains Mono\',monospace;font-size:17px;line-height:30px;white-space:pre">{code}</pre>')
    right = sheet(660, 110, 480, 360, f'<div class="mono" style="position:absolute;left:24px;top:18px;font-size:10px;color:{MUTE}">rendered · name=Priya</div>'
                  f'<div class="disp" style="position:absolute;left:24px;top:52px;font-size:40px">Hi Priya</div>'
                  f'<div style="position:absolute;left:24px;top:120px;font-size:17px;line-height:32px">• Invoice<br>• Badge<br>• Report</div>'
                  f'<div class="mono" style="position:absolute;left:24px;top:236px;font-size:11px;font-weight:700;background:{FIELD};border:1.5px solid #000;border-radius:9999px;padding:5px 10px">Pro</div>')
    return SKY, left + arrow(578, 258) + right + tag("if · each · helpers · one template, any data", "TEMPLATE → RENDER") + signature()


def scene_ranked():
    rows = [("Pictify", 94, FIELD), ("htmlcsstoimage", 81, PAPER), ("Bannerbear", 76, PAPER), ("Placid", 71, PAPER), ("Puppeteer (self-hosted)", 58, PAPER)]
    inner = ""
    for i, (name, score, bg) in enumerate(rows):
        y = 26 + i * 76
        inner += (f'<div style="position:absolute;left:24px;top:{y}px;right:24px;height:60px;background:{bg};border:1.5px solid #000;border-radius:8px">'
                  f'<div class="mono" style="position:absolute;left:16px;top:20px;font-size:12px;color:{SLATE}">0{i+1}</div>'
                  f'<div style="position:absolute;left:56px;top:17px;font-size:18px;font-weight:600">{html.escape(name)}</div>'
                  f'<div style="position:absolute;right:90px;top:23px;width:220px;height:12px;border:1.5px solid #000;border-radius:9999px;overflow:hidden;background:#fff"><div style="width:{score}%;height:100%;background:{"#000" if i else BLUE}"></div></div>'
                  f'<div class="mono" style="position:absolute;right:16px;top:20px;font-size:13px;font-weight:700">{score}</div></div>')
    return CANVAS, sheet(160, 100, 880, 420, inner) + tag("pricing · speed · templates · honesty", "RANKED · 2026") + signature()


def scene_grid(title_rows, cols, ground, tagline, chipname, highlight=0):
    cw = 120; x0 = 300
    head = "".join(mono(x0 + i * cw, 22, c, 10, SLATE) for i, c in enumerate(cols))
    body = ""
    for r, (name, marks) in enumerate(title_rows):
        y = 60 + r * 52
        bg = FIELD if r == highlight else "transparent"
        body += f'<div style="position:absolute;left:12px;top:{y-8}px;right:12px;height:44px;background:{bg};border-radius:6px"></div>'
        body += f'<div style="position:absolute;left:24px;top:{y+3}px;font-size:16px;font-weight:600">{html.escape(name)}</div>'
        for i, m in enumerate(marks):
            sym = "✓" if m else "✕"
            body += f'<div class="disp" style="position:absolute;left:{x0 + i*cw + 18}px;top:{y}px;font-size:20px;color:{"#000" if m else MUTE}">{sym}</div>'
    h = 60 + len(title_rows) * 52 + 12
    return ground, sheet(120, 90, 960, h, head + body) + tag(tagline, chipname) + signature()

def scene_bannerbear():
    rows = [("Pictify", [1,1,1,1,1]), ("Bannerbear", [0,1,1,0,1]), ("Placid", [0,1,1,0,1]), ("Abyssale", [0,1,1,0,0]), ("htmlcsstoimage", [1,1,0,0,0]), ("Puppeteer", [1,0,0,1,0])]
    return scene_grid(rows, ["HTML templates", "Hosted API", "Batch / CSV", "Video", "Free tier"], ROSE, "template language · pricing · api limits", "12 TOOLS COMPARED")

def scene_canva():
    rows = [("Canva", [1,0,1,0,1]), ("Pictify", [0,1,1,1,1]), ("Figma", [1,1,0,0,0]), ("Bannerbear", [0,1,1,0,1]), ("Adobe Express", [1,0,1,0,1])]
    return scene_grid(rows, ["Visual editor", "Render API", "Batch", "Video", "Templates"], POWDER, "editor-first vs api-first, when to pick each", "CANVA ALTERNATIVES", highlight=1)


def scene_automated():
    rows = [("acme", "Pro", "$4,200"), ("northwind", "Team", "$1,150"), ("globex", "Pro", "$3,980"), ("initech", "Free", "$0"), ("umbrella", "Team", "$980")]
    table = f'<div class="mono" style="position:absolute;left:20px;top:16px;font-size:10px;color:{MUTE}">customers.csv · 5,000 rows</div>'
    table += "".join(f'<div class="mono" style="position:absolute;left:20px;top:{46+i*34}px;font-size:12px;letter-spacing:.04em;text-transform:none;display:flex;gap:18px"><span style="width:90px">{a}</span><span style="width:50px;color:{SLATE}">{b}</span><span>{c}</span></div>' for i,(a,b,c) in enumerate(rows))
    left = sheet(56, 150, 330, 260, table)
    cards = ""
    for i, (name, plan, mrr) in enumerate(rows[:3]):
        cards += sheet(560 + i*180, 110 + i*70, 340, 230, f'<div style="position:absolute;left:0;top:0;right:0;height:64px;background:{[FIELD,POWDER,ROSE][i]};border-bottom:1.5px solid #000"></div>'
                       f'<div class="disp" style="position:absolute;left:24px;top:84px;font-size:32px">{name}</div>'
                       f'<div style="position:absolute;left:24px;top:132px;font-size:15px;color:{SLATE}">{plan} plan · {mrr} / mo</div>'
                       f'<div class="mono" style="position:absolute;left:24px;bottom:18px;font-size:10px;color:{MUTE}">value-update-{i+1:04d}.png</div>')
    return SKY, left + arrow(420, 250, 56) + cards + tag("one template, every row, no exports", "CSV → 5,000 IMAGES") + signature()


def scene_social_cards():
    def card(x, y, w, h, label, bg):
        return sheet(x, y, w, h, f'<div style="position:absolute;left:0;top:0;right:0;height:{int(h*0.42)}px;background:{bg};border-bottom:1.5px solid #000"></div>'
                     f'<div class="disp" style="position:absolute;left:{int(w*0.07)}px;top:{int(h*0.5)}px;font-size:{int(w*0.07)}px;line-height:1.05">Launch<br>week</div>'
                     + block(int(w*0.07), int(h*0.5)+int(w*0.16), int(w*0.4), 6, MUTE)) + mono(x, y+h+12, label, 11, SLATE)
    return CANVAS, card(56, 100, 430, 226, "1200 × 630 · open graph", FIELD) + card(536, 100, 300, 300, "1080 × 1080 · instagram", POWDER) + card(886, 60, 230, 410, "1080 × 1920 · story", ROSE) + tag("one template · every platform size", "HTML → PNG") + signature()


def scene_use_cases():
    items = [("invoice", lambda: block(14,14,60,8)+block(14,30,40,6,MUTE)+block(14,60,110,6,MUTE)+block(14,74,90,6,MUTE)+block(96,96,42,10)),
             ("og image", lambda: block(0,0,160,50,FIELD,0)+block(14,66,100,10)+block(14,84,70,6,MUTE)),
             ("badge", lambda: f'<div style="position:absolute;left:40px;top:18px;width:80px;height:80px;border-radius:50%;background:{PINK};border:1.5px solid #000"></div>'),
             ("chart", lambda: "".join(block(14+i*22,110-h,14,h,BLUE if i!=3 else PINK,2) for i,h in enumerate([30,50,44,70,58,80]))),
             ("certificate", lambda: f'<div style="position:absolute;inset:12px;border:1.5px solid #000;border-radius:4px"></div>'+block(40,44,80,8)+block(52,60,56,5,MUTE)),
             ("receipt", lambda: "".join(block(14,14+i*16,{0:90,1:70,2:100,3:60}[i],6,MUTE if i else INK) for i in range(4))+block(14,90,110,8)),
             ("tweet", lambda: f'<div style="position:absolute;left:14px;top:14px;width:26px;height:26px;border-radius:50%;background:{BLUE};border:1.5px solid #000"></div>'+block(48,18,60,6)+block(14,54,120,6,MUTE)+block(14,68,90,6,MUTE)),
             ("banner", lambda: block(0,34,160,52,SKY,0)+block(14,52,80,8)),
             ("qr code", lambda: "".join(block(20+c*14,16+r*14,12,12) for r in range(6) for c in range(6) if (r*7+c*3)%5<2)),
             ("table", lambda: "".join(block(14,14+r*18,132,1.5,INK if r==0 else MUTE,0) for r in range(6)))]
    out = ""
    for i, (label, draw) in enumerate(items):
        x = 56 + (i % 5) * 220; y = 60 + (i // 5) * 240
        out += sheet(x, y, 176, 128, draw()) + mono(x, y + 140, label, 10, SLATE)
    return POWDER, out + tag("what developers actually render with it", "10 USE CASES") + signature()


def scene_seo_images():
    def pic(): return block(0,0,320,140,SKY,0)+block(0,140,320,80,FIELD,0)+f'<div style="position:absolute;left:220px;top:28px;width:56px;height:56px;border-radius:50%;background:{PINK};border:1.5px solid #000"></div>'
    def one(x, fmt, kb, best):
        return sheet(x, 110, 320, 300, pic() + f'<div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:#fff;border-top:1.5px solid #000"></div>'
                     + chip(20, 246, fmt, FIELD if best else INK, INK if best else PAPER) + mono(100, 254, f"{kb} KB", 13, INK if best else SLATE, "letter-spacing:.04em")
                     + (f'<div class="disp" style="position:absolute;right:22px;top:250px;font-size:26px">✓</div>' if best else ""))
    return CANVAS, one(56, "WEBP", 38, True) + one(440, "JPG", 96, False) + one(824, "PNG", 412, False) + tag("same image · format, size, alt text, lazy load", "3 WEIGHTS") + signature()


def scene_tweet():
    inner = (avatar(28, 28, 52, BLUE, "P") + f'<div style="position:absolute;left:96px;top:30px;font-size:19px;font-weight:600">Pictify <span style="color:{BLUE}">✔</span></div>'
             f'<div class="mono" style="position:absolute;left:96px;top:58px;font-size:12px;color:{MUTE};text-transform:none;letter-spacing:.02em">@pictify_io</div>'
             f'<div style="position:absolute;left:28px;top:110px;right:28px;font-size:30px;line-height:40px;letter-spacing:-.01em">We turned a URL into a card with one API call. The metadata came along for free.</div>'
             f'<div class="mono" style="position:absolute;left:28px;bottom:70px;font-size:12px;color:{MUTE};text-transform:none;letter-spacing:.02em">9:41 AM · Sep 12, 2026</div>'
             f'<div style="position:absolute;left:28px;right:28px;bottom:26px;border-top:1.5px solid #000;padding-top:14px;font-size:14px;color:{SLATE};display:flex;gap:28px"><span><b style="color:#000">1,204</b> reposts</span><span><b style="color:#000">8,913</b> likes</span></div>')
    return POWDER, sheet(220, 80, 760, 440, inner) + tag("url in · card out · node.js", "TWEET → PNG") + signature()


def scene_quote():
    card = sheet(400, 95, 440, 440, f'<div style="position:absolute;inset:0;background:{FIELD}"></div>'
                 f'<div class="disp" style="position:absolute;left:40px;top:60px;font-size:120px;line-height:1;color:#000">“</div>'
                 f'<div class="disp" style="position:absolute;left:40px;right:40px;top:150px;font-size:44px;line-height:1.08">Make it once. Render it a thousand times.</div>'
                 f'<div class="mono" style="position:absolute;left:40px;bottom:40px;font-size:12px">— every ops team, eventually</div>'
                 + block(360, 380, 40, 40, PINK, 4, True))
    return ROSE, card + mono(56, 300, "1080 × 1080", 13, INK) + mono(56, 322, "one per quote, on schedule", 11, SLATE, "text-transform:none;letter-spacing:0;font-family:Inter;font-size:14px") + tag("quotes from a sheet · instagram-ready", "1080 × 1080") + signature()


def scene_learning():
    ring = (f'<svg style="position:absolute;left:36px;top:36px" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#fff" stroke-width="14"/><circle cx="60" cy="60" r="50" fill="none" stroke="#000" stroke-width="1.5"/>'
            f'<circle cx="60" cy="60" r="50" fill="none" stroke="{BLUE}" stroke-width="14" stroke-dasharray="{2*3.1416*50*0.72} {2*3.1416*50}" stroke-linecap="butt" transform="rotate(-90 60 60)"/></svg>'
            f'<div class="disp" style="position:absolute;left:36px;top:36px;width:120px;height:120px;display:flex;align-items:center;justify-content:center;font-size:30px">72%</div>')
    inner = (ring + f'<div class="mono" style="position:absolute;left:190px;top:44px;font-size:11px;color:{MUTE}">module 4 of 6</div>'
             f'<div class="disp" style="position:absolute;left:190px;top:66px;font-size:32px;line-height:1.05">Rendering at Scale</div>'
             f'<div style="position:absolute;left:190px;top:118px;font-size:15px;color:{SLATE}">Next: batch renders from a CSV · 14 min</div>'
             f'<div style="position:absolute;left:36px;top:190px;right:36px;height:150px;background:{SKY};border:1.5px solid #000;border-radius:8px"></div>'
             f'<div style="position:absolute;left:50%;top:230px;width:70px;height:70px;margin-left:-35px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px">▶</div>')
    return POWDER, sheet(230, 80, 740, 380, inner) + tag("images · video · infographics · retention", "COURSE CARD") + signature()


def scene_thumbnail():
    thumb = sheet(120, 100, 640, 360, f'<div style="position:absolute;inset:0;background:{FIELD}"></div>'
                  f'<div class="disp" style="position:absolute;left:36px;top:36px;font-size:132px;line-height:.9;letter-spacing:-.05em">EP<br>12</div>'
                  f'<div class="disp" style="position:absolute;left:330px;top:60px;font-size:40px;line-height:1.02;width:280px">Thumbnails from a script</div>'
                  f'<div style="position:absolute;right:36px;bottom:36px;width:76px;height:76px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:30px">▶</div>'
                  + chip(36, 296, "NEW", PINK, INK))
    code = sheet(800, 150, 330, 250, f'<div class="mono" style="position:absolute;left:20px;top:16px;font-size:10px;color:{MUTE}">generate.js</div>'
                 f'<pre style="position:absolute;left:20px;top:44px;font-family:\'JetBrains Mono\',monospace;font-size:13px;line-height:24px">for (const ep of eps) {{\n  await render(\n    template, {{ ep }}\n  )\n}}\n<span style="color:{MUTE}">// 42 thumbnails, 9s</span></pre>')
    return SKY, thumb + code + tag("one per episode · 1280 × 720", "NODE.JS") + signature()


def scene_email_banner():
    inner = (f'<div style="position:absolute;left:0;top:0;right:0;height:78px;border-bottom:1.5px solid #000;padding:16px 24px;font-size:13px;line-height:22px;color:{SLATE}"><b style="color:#000">From:</b> Pictify &lt;hello@pictify.io&gt;<br><b style="color:#000">Subject:</b> Your seats are ready, Maya</div>'
             f'<div style="position:absolute;left:24px;top:102px;width:600px;height:200px;background:{FIELD};border:1.5px solid #000;border-radius:8px;overflow:hidden">'
             f'<div class="disp" style="position:absolute;left:28px;top:34px;font-size:44px;line-height:1.02;width:380px">Hi Maya, your seats are ready</div>'
             f'<div class="mono" style="position:absolute;left:28px;bottom:24px;font-size:11px">row f · seats 12–13 · fri 8pm</div>'
             f'<div style="position:absolute;right:-30px;top:-30px;width:180px;height:180px;border-radius:50%;background:{PINK};border:1.5px solid #000"></div></div>'
             f'<div style="position:absolute;left:24px;top:322px;font-size:14px;color:{SLATE};line-height:22px">Banner rendered per recipient, 600 × 200, inline in the email.</div>')
    return ROSE, sheet(160, 70, 880, 440, inner) + tag("name · seats · date, per recipient", "600 × 200") + signature()


def scene_report_snapshot():
    bars = "".join(block(40 + i*64, 250 - h, 44, h, BLUE if i != 6 else PINK, 3) for i, h in enumerate([90,120,104,150,134,176,168]))
    chart = sheet(56, 90, 560, 400, f'<div class="mono" style="position:absolute;left:24px;top:18px;font-size:10px;color:{MUTE}">daily renders · last 7 days</div>'
                  f'<div class="disp" style="position:absolute;left:24px;top:40px;font-size:40px">12,480</div>'
                  f'<div class="mono" style="position:absolute;left:24px;top:92px;font-size:11px;color:{BLUE}">▲ 18% vs last week</div>'
                  f'<div style="position:absolute;left:0;right:0;top:260px;border-top:1.5px solid #000"></div>' + bars.replace('top:', 'top:').replace('left:', 'left:')
                  + f'<div class="mono" style="position:absolute;right:24px;top:18px;font-size:10px;font-weight:700;background:#000;color:#fff;padding:4px 8px;border-radius:4px">snapshot · 09:00</div>')
    code = sheet(660, 140, 480, 300, f'<div class="mono" style="position:absolute;left:20px;top:16px;font-size:10px;color:{MUTE}">snapshot.py · cron 0 9 * * *</div>'
                 f'<pre style="position:absolute;left:20px;top:46px;font-family:\'JetBrains Mono\',monospace;font-size:14px;line-height:26px">png = pictify.render(\n    template="report",\n    data=metrics.today(),\n)\nslack.post("#ops", png)</pre>')
    return CANVAS, chart + code + tag("dashboard → png, every morning", "PYTHON") + signature()


def scene_ugc():
    posts = [("Ana", "Shipped 300 certificates before lunch.", "1.2k", POWDER), ("Dev", "Our OG images finally match the page.", "846", ROSE), ("Mia", "The batch API is the whole product.", "2.1k", SKY),
             ("Ken", "Replaced a designer bottleneck with a CSV.", "634", FIELD), ("Sol", "Certificates, invoices, badges. One template each.", "1.9k", POWDER), ("Ivy", "Thumbnails from a cron job. Never again by hand.", "978", ROSE)]
    out = ""
    for i, (name, text, likes, bg) in enumerate(posts):
        x = 56 + (i % 3) * 370; y = 60 + (i // 3) * 220
        out += sheet(x, y, 340, 190, avatar(20, 20, 40, bg, name[0]) + f'<div style="position:absolute;left:72px;top:26px;font-size:15px;font-weight:600">{name} <span class="mono" style="font-size:10px;color:{MUTE};font-weight:400">@{name.lower()}</span></div>'
                     f'<div style="position:absolute;left:20px;top:78px;right:20px;font-size:17px;line-height:26px">{html.escape(text)}</div>'
                     f'<div class="mono" style="position:absolute;left:20px;bottom:18px;font-size:11px;color:{SLATE}">♥ {likes}</div>')
    return CANVAS, out + tag("a wall of posts, rendered as one image", "UGC") + signature()


SCENES.update({
    "website-screenshot-api-the-complete-developer-guide-2026": scene_screenshot_api,
    "handlebars-templates-the-practical-guide-if-else-each-helpers": scene_handlebars,
    "best-image-generation-apis-ranked-2026": scene_ranked,
    "bannerbear-alternatives-for-developers-12-tools-compared-honestly-2026": scene_bannerbear,
    "canva-alternatives-for-developers-api-first-editor-first-and-when-to-pick-each-2026": scene_canva,
    "automated-image-generation-the-developers-guide-2026": scene_automated,
    "how-to-generate-social-media-cards-using-html-to-image-api": scene_social_cards,
    "10-best-html-to-image-api-use-cases-for-developers": scene_use_cases,
    "optimizing-images-for-seo-a-step-by-step-guide-to-improve-your-websites-performance": scene_seo_images,
    "building-a-twitter-card-generator-with-node-js": scene_tweet,
    "building-a-quote-image-generator-for-instagram": scene_quote,
    "why-visual-content-matters-in-online-learning": scene_learning,
    "how-to-create-a-thumbnail-generator-using-node-js": scene_thumbnail,
    "why-you-should-use-custom-and-personalized-email-banners": scene_email_banner,
    "how-to-create-real-time-snapshot-of-your-reports-using-python-and-pictify": scene_report_snapshot,
    "driving-user-generated-content-ugc-a-comprehensive-guide": scene_ugc,
})


def scene_html_to_image_guide():
    code = ("&lt;div class=<b style='color:#0054A6'>\"card\"</b>&gt;\n  &lt;h1&gt;Q3 report&lt;/h1&gt;\n  &lt;p&gt;Revenue up 18%&lt;/p&gt;\n&lt;/div&gt;\n<span style='color:#8A8A85'>@font-face {{ Inter }}</span>\n<span style='color:#8A8A85'>.card {{ width: 600px }}</span>")
    left = sheet(56, 100, 480, 380, f'<div class="mono" style="position:absolute;left:24px;top:18px;font-size:10px;color:{MUTE}">card.html</div>'
                 f'<pre style="position:absolute;left:24px;top:52px;font-family:\'JetBrains Mono\',monospace;font-size:16px;line-height:30px;white-space:pre">{code}</pre>')
    out = sheet(640, 100, 500, 250, f'<div style="position:absolute;inset:0;background:{FIELD}"></div>'
                f'<div class="disp" style="position:absolute;left:32px;top:34px;font-size:44px;line-height:1">Q3 report</div>'
                f'<div style="position:absolute;left:32px;top:96px;font-size:20px">Revenue up 18%</div>'
                f'<div class="mono" style="position:absolute;left:32px;bottom:22px;font-size:11px;color:{SLATE}">card.png · 1200 × 500 · 2×</div>')
    checks = [("fonts loaded before capture", True), ("viewport set, not guessed", True), ("no memory leak across 10k renders", True), ("html2canvas: css blur, fonts missed", False)]
    lst = ""
    for i, (t, ok) in enumerate(checks):
        lst += (f'<div style="position:absolute;left:640px;top:{384 + i*30}px;display:flex;gap:10px;align-items:center;font-size:14px;color:{"#000" if ok else MUTE}">'
                f'<span class="disp" style="font-size:16px;width:20px">{"✓" if ok else "✕"}</span>{html.escape(t)}</div>')
    return POWDER, left + arrow(560, 250, 56) + out + lst + tag("html2canvas vs puppeteer vs a rendering api", "HTML → PNG") + signature()

SCENES["html-to-image-the-complete-developer-guide-2026"] = scene_html_to_image_guide


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] == "--list":
        print("\n".join(SCENES)); sys.exit(0)
    slug = sys.argv[1]
    if slug not in SCENES:
        sys.exit(f"no scene for {slug}; add one to SCENES")
    bg, body = SCENES[slug]()
    print(HEAD % {"w": W, "h": H, "bg": bg} + body + FOOT)
