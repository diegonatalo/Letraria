"""Gera os SVGs e o README.md a partir de theme.json + content.json.

Uso: python docs/assets/build.py   (requer Pillow)
"""
import base64, io, json, pathlib, re, textwrap
from html import escape
from PIL import Image

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
T = json.loads((HERE / "theme.json").read_text(encoding="utf-8"))
C = json.loads((HERE / "content.json").read_text(encoding="utf-8"))
SANS, MONO = T["fontSans"], T["fontMono"]
GRAD = f'<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{T["accent"]}"/><stop offset="1" stop-color="{T["accent2"]}"/></linearGradient>'


def e(s):
    return escape(s, quote=True)


def plain(s):
    """Texto sem marcação Markdown, para uso dentro do SVG."""
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    return s.replace("`", "").replace("*", "").replace("<br />", " ")


def svg(w, h, body, title, defs="", extra=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
        f'role="img" aria-label="{e(title)}"{extra}><title>{e(title)}</title><defs>{GRAD}{defs}</defs>{body}</svg>'
    )


def glow(i, cx, cy, r, color, op):
    return (
        f'<radialGradient id="{i}" gradientUnits="userSpaceOnUse" cx="{cx}" cy="{cy}" r="{r}">'
        f'<stop offset="0" stop-color="{color}" stop-opacity="{op}"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>'
    )


def write(name, content):
    (HERE / name).write_text(content, encoding="utf-8")


def jpeg_uri(img, max_w=1280, max_kb=200):
    img = img.convert("RGB")
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    for q in range(82, 40, -4):
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        if len(buf.getvalue()) <= max_kb * 1000:
            break
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue()), img.size


def chip_w(label):
    return 0.6 * 13 * len(label) + 38


# ---------------------------------------------------------------- banner
def banner():
    W, H = 1200, 470
    anim = T["animations"]
    glows = T["glow"] and T["grid"]
    defs = ""
    body = f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="26" fill="{T["bg"]}" stroke="{T["borderStrong"]}"/>'
    clip = f'<clipPath id="r"><rect width="{W}" height="{H}" rx="26"/></clipPath>'
    defs += clip
    inner = ""
    if T["grid"]:
        defs += f'<pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="{T["fg"]}" stroke-opacity="0.045"/></pattern>'
        inner += f'<rect width="{W}" height="{H}" fill="url(#grid)"/>'
    if glows:
        defs += glow("ga", 170, 40, 330, T["accent"], 0.26) + glow("gb", 1040, 420, 380, T["accent2"], 0.26)
        drift = lambda a, b: (f'<animateTransform attributeName="transform" type="translate" values="0 0;{a} {b};0 0" dur="15s" repeatCount="indefinite"/>' if anim else "")
        inner += f'<rect x="-300" y="-300" width="1000" height="800" fill="url(#ga)">{drift(30, 20)}</rect>'
        inner += f'<rect x="500" y="0" width="1000" height="900" fill="url(#gb)">{drift(-30, -16)}</rect>'
    body += f'<g clip-path="url(#r)">{inner}</g>'

    repo = f'github.com/diegonatalo/{C["repo"]}'.upper()
    pw = len(repo) * 9.6 + 50
    pulse = (f'<animate attributeName="opacity" values="1;0.35;1" dur="2.4s" repeatCount="indefinite"/>' if anim else "")
    body += (
        f'<rect x="72" y="62" width="{pw:.0f}" height="36" rx="18" fill="{T["accent"]}" fill-opacity="0.10" stroke="{T["accent"]}" stroke-opacity="0.38"/>'
        f'<circle cx="94" cy="80" r="4" fill="{T["accent"]}">{pulse}</circle>'
        f'<text x="108" y="85" font-family="{MONO}" font-size="13" letter-spacing="1.8" fill="{T["fg"]}">{e(repo)}</text>'
    )
    words = C["name"].split()
    if len(words) > 1:
        head = e(" ".join(words[:-1]) + " ")
        name = f'<text x="72" y="196" font-family="{SANS}" font-size="98" font-weight="800" letter-spacing="-3" fill="{T["fg"]}">{head}<tspan fill="url(#g)">{e(words[-1])}</tspan></text>'
    else:
        name = f'<text x="72" y="196" font-family="{SANS}" font-size="98" font-weight="800" letter-spacing="-3" fill="{T["fg"]}">{e(C["name"])}</text>'
    body += name
    for i, line in enumerate(textwrap.wrap(C["tagline"], 44)[:2]):
        body += f'<text x="72" y="{296 + 28*i}" font-family="{SANS}" font-size="20" fill="{T["muted"]}">{e(line)}</text>'
    x = 72
    for i, label in enumerate(C["stack"][:4]):
        w = chip_w(label)
        col = T["accent"] if i % 2 == 0 else T["accent2"]
        body += (
            f'<rect x="{x:.0f}" y="362" width="{w:.0f}" height="32" rx="16" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
            f'<circle cx="{x+16:.0f}" cy="378" r="3.5" fill="{col}"/>'
            f'<text x="{x+28:.0f}" y="383" font-family="{MONO}" font-size="13" fill="{T["fg"]}">{e(label)}</text>'
        )
        x += w + 10

    # moldura de screenshot
    shot = C["shots"][2]
    im = Image.open(HERE / shot["file"]).convert("RGB")
    fw, fh = 366, 290
    cw = round(im.height * fw / fh)  # recorte central, altura inteira
    im = im.crop((im.width // 2 - cw // 2, 0, im.width // 2 + cw // 2, im.height))
    im = im.resize((fw * 2, fh * 2), Image.LANCZOS)
    uri, _, _ = jpeg_uri(im, 732, 120)
    defs += glow("gs", 953, 217, 260, T["accent"], 0.28)
    defs += f'<clipPath id="c"><rect x="770" y="58" width="366" height="318" rx="20"/></clipPath>'
    body += (
        f'<rect x="700" y="40" width="500" height="400" fill="url(#gs)"/>'
        f'<rect x="770.5" y="58.5" width="365" height="317" rx="20" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
        f'<g clip-path="url(#c)"><image x="770" y="86" width="366" height="290" preserveAspectRatio="xMidYMin slice" href="{uri}"/>'
        f'<rect x="770" y="58" width="366" height="28" fill="{T["card"]}"/></g>'
        f'<line x1="770" x2="1136" y1="86.5" y2="86.5" stroke="{T["borderStrong"]}"/>'
        f'<circle cx="790" cy="72" r="4.5" fill="#ff8a7a"/><circle cx="806" cy="72" r="4.5" fill="#f5d36a"/><circle cx="822" cy="72" r="4.5" fill="{T["accent"]}"/>'
        f'<text x="953" y="76" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{T["subtle"]}">{e(shot["name"])}</text>'
    )
    write("banner.svg", svg(W, H, body, f'{C["name"]}: {C["tagline"]}', defs))


# ---------------------------------------------------------------- botões
def button(fname, label, primary):
    text = f"{label} ↗"
    w = round(len(text) * 10 + 64)
    if primary:
        body = (
            f'<rect width="{w}" height="52" rx="26" fill="url(#g)"/>'
            f'<text x="{w/2}" y="32" text-anchor="middle" font-family="{SANS}" font-size="16" font-weight="700" fill="{T["onAccent"]}">{e(text)}</text>'
        )
    else:
        body = (
            f'<rect x="0.75" y="0.75" width="{w-1.5}" height="50.5" rx="25.25" fill="{T["card"]}" stroke="{T["borderStrong"]}" stroke-width="1.5"/>'
            f'<text x="{w/2}" y="32" text-anchor="middle" font-family="{SANS}" font-size="16" font-weight="700" fill="{T["fg"]}">{e(text)}</text>'
        )
    write(fname, svg(w, 52, body, text))


# ---------------------------------------------------------------- cabeçalho de seção
def header(fname, num, label, title):
    pill = f"{num:02d} · {label}"
    pw = len(pill) * 9.4 + 34
    defs = glow("h1", 1000, 0, 260, T["accent2"], 0.16) + glow("h2", 0, 124, 260, T["accent"], 0.14)
    body = (
        f'<rect x="0.5" y="0.5" width="999" height="123" rx="22" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
        f'<clipPath id="k"><rect width="1000" height="124" rx="22"/></clipPath>'
        f'<g clip-path="url(#k)"><rect width="1000" height="124" fill="url(#h1)"/><rect width="1000" height="124" fill="url(#h2)"/></g>'
        f'<rect x="40" y="26" width="{pw:.0f}" height="28" rx="14" fill="{T["accent"]}" fill-opacity="0.10" stroke="{T["accent"]}" stroke-opacity="0.38"/>'
        f'<text x="{40 + pw/2:.0f}" y="45" text-anchor="middle" font-family="{MONO}" font-size="12" letter-spacing="1.6" fill="{T["accent"]}">{e(pill)}</text>'
        f'<text x="40" y="94" font-family="{SANS}" font-size="36" font-weight="800" letter-spacing="-0.8" fill="{T["fg"]}">{e(title)}</text>'
        f'<rect x="40" y="106" width="64" height="3" rx="1.5" fill="url(#g)"/>'
    )
    write(fname, svg(1000, 124, body, f"{pill}: {title}", defs))
    return f"{pill} — {title}"


# ---------------------------------------------------------------- cards
def card_lines(desc):
    return textwrap.wrap(plain(desc), 54)


def feature_cards():
    items = C["features"]["items"]
    heights = []
    for it in items:
        n = len(card_lines(it["desc"]))
        heights.append(max(290, 116 + 22 * n + 30))
    rows = [heights[i:i + 2] for i in range(0, len(heights), 2)]
    out = []
    for i, it in enumerate(items):
        h = max(rows[i // 2])
        defs = glow("fc", 490, 0, 220, T["accent"], 0.18) + f'<clipPath id="fk"><rect width="490" height="{h}" rx="22"/></clipPath>'
        body = (
            f'<rect x="0.5" y="0.5" width="489" height="{h-1}" rx="22" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
            f'<g clip-path="url(#fk)"><rect width="490" height="{h}" fill="url(#fc)"/><rect width="490" height="4" fill="url(#g)"/></g>'
            f'<text x="32" y="44" font-family="{MONO}" font-size="12" letter-spacing="1.4" fill="{T["subtle"]}">FUNCIONALIDADE {i+1:02d}</text>'
            f'<text x="32" y="82" font-family="{SANS}" font-size="28" font-weight="700" fill="{T["fg"]}">{e(plain(it["title"]))}</text>'
        )
        for j, ln in enumerate(card_lines(it["desc"])):
            body += f'<text x="32" y="{116 + 22*j}" font-family="{SANS}" font-size="14.5" fill="{T["muted"]}">{e(ln)}</text>'
        name = f"f-{i+1:02d}.svg"
        write(name, svg(490, h, body, f'{plain(it["title"])}. {plain(it["desc"])}', defs))
        out.append((name, f'{plain(it["title"])}: {plain(it["desc"])}'))
    return out


def stack_card():
    pad, W = 26, 1000
    x, y, pos = pad, pad, []
    for i, label in enumerate(C["stack"]):
        w = chip_w(label)
        if x + w > W - pad:
            x, y = pad, y + 40
        pos.append((label, x, y, w, i))
        x += w + 10
    H = y + 32 + pad
    body = f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="20" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
    for label, x, y, w, i in pos:
        col = T["accent"] if i % 2 == 0 else T["accent2"]
        body += (
            f'<rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="32" rx="16" fill="{T["bg"]}" stroke="{T["borderStrong"]}"/>'
            f'<circle cx="{x+16:.0f}" cy="{y+16}" r="3.5" fill="{col}"/>'
            f'<text x="{x+28:.0f}" y="{y+21}" font-family="{MONO}" font-size="13" fill="{T["fg"]}">{e(label)}</text>'
        )
    write("stack.svg", svg(W, H, body, "Stack: " + ", ".join(C["stack"])))


# ---------------------------------------------------------------- screenshots
def shots():
    out = []
    for i, s in enumerate(C["shots"]):
        im = Image.open(HERE / s["file"])
        uri, size, (iw, ih) = jpeg_uri(im)
        W, bar = 1000, 28
        ih2 = round(ih * W / iw)
        H = bar + ih2 + 28
        defs = glow("gl", 500, bar + ih2, 520, T["accent"], 0.22) + f'<clipPath id="sk"><rect x="0.5" y="0.5" width="{W-1}" height="{bar+ih2}" rx="16"/></clipPath>'
        body = (
            f'<rect x="0" y="{bar}" width="{W}" height="{ih2+28}" fill="url(#gl)"/>'
            f'<rect x="0.5" y="0.5" width="{W-1}" height="{bar+ih2}" rx="16" fill="{T["card"]}" stroke="{T["borderStrong"]}"/>'
            f'<g clip-path="url(#sk)"><image x="0" y="{bar}" width="{W}" height="{ih2}" href="{uri}"/></g>'
            f'<line x1="0" x2="{W}" y1="{bar+0.5}" y2="{bar+0.5}" stroke="{T["borderStrong"]}"/>'
            f'<circle cx="20" cy="14" r="4.5" fill="#ff8a7a"/><circle cx="36" cy="14" r="4.5" fill="#f5d36a"/><circle cx="52" cy="14" r="4.5" fill="{T["accent"]}"/>'
            f'<text x="500" y="18" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{T["subtle"]}">{e(s["name"])}</text>'
        )
        name = f"shot-{i+1:02d}.svg"
        write(name, svg(W, H, body, s["alt"], defs))
        out.append((name, s["alt"], size))
    return out


def footer():
    body = (
        f'<rect x="0" y="13" width="1000" height="2" fill="url(#g)" opacity="0.7"/>'
        f'<text x="500" y="52" text-anchor="middle" font-family="{MONO}" font-size="12.5" fill="{T["subtle"]}">© {C["year"]} {C["author_name"].upper()}</text>'
        f'<text x="500" y="74" text-anchor="middle" font-family="{SANS}" font-size="14" fill="{T["muted"]}">{e(C["footer_line"])}</text>'
    )
    # fundo próprio para ficar igual no tema claro e no escuro do GitHub
    body = f'<rect width="1000" height="90" rx="12" fill="{T["bg"]}"/>' + body
    write("footer.svg", svg(1000, 90, body, f'© {C["year"]} {C["author_name"]}. {C["footer_line"]}'))


# ---------------------------------------------------------------- README
def img(name, alt, width="100%"):
    return f'<img src="docs/assets/{name}" alt="{e(alt)}" width="{width}" />'


def main():
    banner()
    button("btn-demo.svg", "Abrir o app", True)
    button("btn-code.svg", "Código", False)
    for i, a in enumerate(C["author"]):
        button(f"btn-author-{i+1}.svg", a["label"], False)
    cards = feature_cards()
    stack_card()
    shot_files = shots()
    footer()

    n = 0
    heads = {}

    def sec(label, title, key):
        nonlocal n
        n += 1
        heads[key] = img(f"h-{key}.svg", header(f"h-{key}.svg", n, label, title))
        return f'<div align="center">\n\n{heads[key]}\n\n</div>\n\n'

    r = []
    r.append(
        '<div align="center">\n\n'
        + img("banner.svg", f'{C["name"]}: {C["tagline"]} github.com/diegonatalo/{C["repo"]}. Stack: {", ".join(C["stack"][:4])}')
        + "\n\n<br />\n\n"
        + f'<a href="{C["demo_url"]}"><img src="docs/assets/btn-demo.svg" alt="Abrir o app ↗" height="46" /></a>\n'
        + f'<a href="{C["code_url"]}"><img src="docs/assets/btn-code.svg" alt="Código ↗" height="46" /></a>\n\n'
        + "<br />\n\n"
        + C["badges_md"]
        + "\n\n</div>\n\n<br />\n\n"
    )
    r.append(sec("SOBRE", "Sobre o projeto", "sobre") + C["sobre_md"] + "\n\n<br />\n\n")
    r.append(sec("DEMO", "Demonstração", "demo") + '<div align="center">\n\n' + "\n\n<br />\n\n".join(img(f, a) for f, a, _ in shot_files) + "\n\n</div>\n\n<br />\n\n")
    rows = []
    for i in range(0, len(cards), 2):
        rows.append("\n".join(img(f, a, "49%") for f, a in cards[i:i + 2]))
    r.append(sec("FUNCIONALIDADES", C["features"]["title"], "func") + '<div align="center">\n\n' + "\n<br />\n".join(rows) + "\n\n</div>\n\n<br />\n\n")
    r.append(sec("STACK", "Stack", "stack") + '<div align="center">\n\n' + img("stack.svg", "Stack: " + ", ".join(C["stack"])) + "\n\n</div>\n\n<br />\n\n")
    r.append(sec("COMO RODAR", C["run"]["title"], "run") + C["run"]["md"] + "\n\n<br />\n\n")
    r.append(sec("ESTRUTURA", C["estrutura"]["title"], "estrutura") + C["estrutura"]["md"] + "\n\n<br />\n\n")
    mais = "\n\n".join(f'### {m["title"]}\n\n{m["md"]}' for m in C["mais"])
    r.append(sec("MAIS", "Mais informações", "mais") + mais + "\n\n<br />\n\n")
    au = "\n".join(f'<a href="{a["url"]}"><img src="docs/assets/btn-author-{i+1}.svg" alt="{a["label"]} ↗" height="46" /></a>' for i, a in enumerate(C["author"]))
    r.append(sec("AUTOR", "Autor", "autor") + f'<div align="center">\n\n{au}\n\n</div>\n\n<br />\n\n')
    r.append('<div align="center">\n\n' + img("footer.svg", f'© {C["year"]} {C["author_name"]}. {C["footer_line"]}') + "\n\n</div>\n")
    (ROOT / "README.md").write_text("".join(r), encoding="utf-8")
    print("ok;", [(f, f"{s/1000:.0f} KB") for f, _, s in shot_files])


if __name__ == "__main__":
    main()
