"""Extrai content.json do README original (docs/assets/raw/README.original.md)."""
import json, re, pathlib

here = pathlib.Path(__file__).parent
src = (here / "raw" / "README.original.md").read_text(encoding="utf-8")


def block(start, end=None):
    i = src.index(start)
    j = src.index(end, i + 1) if end else len(src)
    return src[i:j]


def body(sec):  # remove a linha "## título"
    return sec.split("\n", 1)[1].strip("\n")


intro = block("# Letraria", "<br />\n\n[![Abrir").split("\n", 1)[1].strip()
badges = [l for l in src.splitlines() if l.startswith("![")]
rows = []
for l in block("## ✨ O que dá para fazer", "## 🧠").splitlines():
    if l.startswith("|") and not l.startswith("|---") and not l.startswith("| Recurso"):
        a, b = [c.strip() for c in l.strip("|").split("|", 1)]
        rows.append({"title": a.strip("*"), "desc": b.rstrip(" |")})

creditos = block("## Créditos", "<br />\n\n<div align=\"center\">\n  <sub>")
footer = re.search(r"<sub>(.*?)</sub>", src).group(1)

content = {
    "repo": "Letraria",
    "name": "Letraria",
    "tagline": "Obras e formas desenhadas com letras.",
    "demo_url": "https://letraria.vercel.app",
    "code_url": "https://github.com/diegonatalo/Letraria",
    "sobre_md": intro,
    "badges_md": "\n".join(badges),
    "features": {"title": "O que dá para fazer", "items": rows},
    "stack": ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS 4", "arte em canvas · sem bibliotecas"],
    "run": {"title": "Rodando localmente", "md": body(block("## 🚀", "## 🗂️"))},
    "estrutura": {"title": "Estrutura", "md": body(block("## 🗂️", "## 🌐"))},
    "mais": [
        {"title": "🧠 Como funciona", "md": body(block("## 🧠", "## 🚀"))},
        {"title": "🌐 Deploy", "md": body(block("## 🌐", "## 🧭"))},
        {"title": "🧭 Próximos passos", "md": body(block("## 🧭", "## Créditos"))},
        {"title": "Créditos", "md": body(creditos).strip()},
    ],
    "footer_line": footer,
    "shots": [
        {"file": "raw/galeria.png", "name": "letraria.vercel.app", "alt": "Galeria do Letraria: título LETRARIA em letras douradas e cartões com miniaturas em ASCII de A Noite Estrelada, Os Girassóis e O Beijo"},
        {"file": "raw/noite-estrelada.png", "name": "/noite-estrelada", "alt": "A Noite Estrelada, de Van Gogh, desenhada com letras coloridas dentro de uma moldura dourada em ASCII"},
        {"file": "raw/buque.png", "name": "/buque", "alt": "Buquê de flores em letras coloridas: hortênsia, girassol, rosa, tulipa, lírio e margaridas sobre fundo escuro"},
    ],
    "author": [
        {"label": "Portfólio", "url": "https://diegonatalo.dev"},
        {"label": "LinkedIn", "url": "https://www.linkedin.com/in/diegonatalo/"},
        {"label": "GitHub", "url": "https://github.com/diegonatalo"},
    ],
    "author_name": "Diego Natalo",
    "year": 2026,
}
(here / "content.json").write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(rows), "funcionalidades")
