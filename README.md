<div align="center">

<img src="docs/img/banner.png" alt="Letraria: título em dourado ao lado da pintura A Noite Estrelada" width="720" />

# Letraria

**Obras e formas desenhadas com letras.**<br />
Arte ASCII colorida e animada: pinturas que se revelam com zoom, formas que se desenham e se preenchem com palavras de carinho.

<br />

[![Abrir o app](https://img.shields.io/badge/abrir_o_app-letraria.vercel.app-f59e0b?style=for-the-badge&logo=vercel&logoColor=white)](https://letraria.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?style=flat-square&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Canvas](https://img.shields.io/badge/arte_em_canvas-sem_bibliotecas-fcd34d?style=flat-square)

</div>

<br />

## ✨ O que dá para fazer

| Recurso | Descrição |
|---|---|
| **Galeria** | A página inicial reúne as obras em cartões. Clique em um para abrir a animação em tela cheia. |
| **A Noite Estrelada** | A pintura de Van Gogh vira texto colorido, com moldura dourada também em ASCII. O zoom começa no centro e se afasta até mostrar a obra inteira. |
| **Coração de palavras** | Um contorno de coração se desenha de baixo para cima e depois se preenche com "TE AMO", "CARINHO", "ABRAÇO" e outras palavras, em tons de vermelho. |
| **Repetir a animação** | Clique na tela ou no botão "Repetir" para rever o zoom ou o desenho do coração. |
| **Movimento reduzido** | Se o seu sistema pede menos animação, as obras aparecem já prontas, sem zoom nem desenho progressivo. |

## 🧠 Como funciona

| Conceito | Regra |
|---|---|
| **Pixels viram letras** | A pintura é lida célula a célula. O brilho de cada trecho escolhe o caractere (`.,:;-=+*xo#%&@`) e a cor dele vem do próprio trecho, com um fundo mais escuro da mesma cor. |
| **Zoom** | O zoom parte de 16× e cai de forma suave até 1×, sempre centrado no meio da obra. |
| **Moldura** | Quatro anéis de caracteres dourados (`#@`, `~o`, `=-`, `'.`), mais claros no canto superior esquerdo e mais escuros no inferior direito. |
| **Coração** | A forma vem da equação clássica do coração. As células de borda formam o contorno e o interior recebe as palavras, embaralhadas e deslocadas linha a linha. |

Tudo é desenhado com `<canvas>` 2D, sem biblioteca de gráficos.

## 🚀 Rodando localmente

Requer [Node.js](https://nodejs.org) 18.18 ou superior e npm.

```bash
git clone https://github.com/diegonatalo/Letraria.git
cd Letraria
npm install
npm run dev     # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm start` | Serve o build de produção |

## 🗂️ Estrutura

```text
app/
├── page.tsx                galeria (página inicial)
├── noite-estrelada/        página da pintura em ASCII
├── coracao/                página do coração de palavras
├── layout.tsx              metadados, Open Graph e Twitter
├── opengraph-image.tsx     imagem de compartilhamento (1200×630)
├── icon.svg                favicon
├── robots.ts               /robots.txt
└── sitemap.ts              /sitemap.xml
components/
├── AsciiStarryNight.tsx    renderizador da pintura, com zoom e moldura
└── AsciiHeart.tsx          contorno e preenchimento do coração
public/
└── noite-estrelada.jpg     pintura de origem (1920×1520)
docs/img/
└── banner.png              banner deste README
```

<details>
<summary><b>Como adicionar uma nova obra</b></summary>

1. Crie o componente em `components/` (use `AsciiStarryNight.tsx` ou `AsciiHeart.tsx` como base).
2. Crie a página em `app/<nome>/page.tsx`, com `metadata` própria (título, descrição, `canonical` e `openGraph.url`) e o link "← Galeria".
3. Adicione a obra à lista `WORKS` em `app/page.tsx` para ela aparecer na galeria.
4. Inclua a nova URL em `app/sitemap.ts`.

</details>

## 🌐 Deploy

O projeto foi pensado para a [Vercel](https://vercel.com) e não precisa de configuração extra nem de variáveis de ambiente.

> [!NOTE]
> O domínio `https://letraria.vercel.app` está escrito em `app/layout.tsx` (`metadataBase`), em `app/sitemap.ts` e em `app/robots.ts`. Ao mudar de domínio, troque nos três lugares, senão o Open Graph, o sitemap e o canonical continuam apontando para o endereço antigo.

## 🧭 Próximos passos

- [ ] Mais obras na galeria (girassóis, O Beijo, outras formas).
- [ ] Miniatura da Noite Estrelada em ASCII (hoje o cartão usa a pintura original).
- [ ] Gerar o sitemap a partir da lista de obras, em vez de manter as duas à mão.
- [ ] Gerar um `favicon.ico` para leitores antigos (hoje só existe o SVG).
- [ ] Testar o desempenho em celulares mais simples. A animação redesenha milhares de células por quadro.
- [ ] Testes automatizados. Hoje não há nenhum.

## Créditos

- *A Noite Estrelada* (Vincent van Gogh, 1889): reprodução do Google Art Project em domínio público, obtida na [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg).
- O código foi escrito com apoio do Claude Code.

<br />

<div align="center">
  <sub>Feito com 💛 para quem gosta de ver arte sendo escrita.</sub>
</div>
