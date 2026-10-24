/** Obras em domínio público (reproduções reduzidas da Wikimedia Commons). */
export type Work = {
  slug: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  /** Página do arquivo na Wikimedia Commons. */
  source: string;
  /** Contexto, mensagem e uma curiosidade, nesta ordem (um parágrafo cada). */
  about: string[];
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`;

export const WORKS: Work[] = [
  {
    slug: "noite-estrelada",
    title: "A Noite Estrelada",
    artist: "Vincent van Gogh",
    year: "1889",
    description: "O céu em redemoinho sobre o vilarejo, em ASCII colorido.",
    source: commons("Van Gogh - Starry Night - Google Art Project.jpg"),
    about: [
      "Van Gogh pintou o quadro em junho de 1889, internado por vontade própria no asilo de Saint-Paul-de-Mausole, em Saint-Rémy-de-Provence, na França. A cena se inspira na vista da janela do quarto, voltada para o leste, pouco antes do amanhecer. O vilarejo, porém, é imaginado.",
      "O céu agitado contrasta com o vilarejo quieto, de janelas acesas. Muitos leem aí a tensão entre angústia e consolo: o cipreste, árvore ligada ao luto, sobe como uma chama escura em direção às estrelas. As interpretações variam.",
      "A obra está no MoMA, em Nova York, desde 1941.",
    ],
  },
  {
    slug: "girassois",
    title: "Os Girassóis",
    artist: "Vincent van Gogh",
    year: "1888",
    description: "Amarelos e ocres em pinceladas grossas, de perto até o vaso inteiro.",
    source: commons("Vincent Willem van Gogh 127.jpg"),
    about: [
      "Van Gogh pintou a série de girassóis em Arles, no sul da França, a partir de agosto de 1888, para decorar a Casa Amarela, onde esperava receber o amigo e pintor Paul Gauguin. Esta versão está na National Gallery, em Londres.",
      "O amarelo, para ele, era a cor da luz, da alegria e da amizade. As flores aparecem em todos os estágios: abertas, murchando, já viradas em sementes. Por isso muitos leem o quadro como uma meditação sobre o ciclo da vida, e não só sobre alegria.",
      "Existem outras versões da pintura, em museus de várias cidades, como Amsterdã, Filadélfia e Munique.",
    ],
  },
  {
    slug: "o-beijo",
    title: "O Beijo",
    artist: "Gustav Klimt",
    year: "1907–1908",
    description: "O ouro e os padrões do casal abraçado, revelados do centro para fora.",
    source: commons("The Kiss - Gustav Klimt - Google Cultural Institute.jpg"),
    about: [
      "Klimt pintou O Beijo entre 1907 e 1908, no auge da sua \"fase dourada\", quando usava folhas de ouro de verdade nas telas. A obra está no Museu Belvedere, em Viena.",
      "O casal se funde num só corpo dourado. As roupas têm padrões diferentes: formas geométricas na dele, flores e formas coloridas na dela, que usa uma coroa de flores. Muitos veem aí a união de dois opostos. Eles estão ajoelhados num prado florido, à beira do que parece um precipício, o que para alguns sugere que a felicidade é intensa e frágil ao mesmo tempo.",
      "O quadro foi exibido pela primeira vez em 1908 e comprado pelo governo austríaco ainda inacabado.",
    ],
  },
  {
    slug: "a-grande-onda",
    title: "A Grande Onda de Kanagawa",
    artist: "Katsushika Hokusai",
    year: "c. 1831",
    description: "A onda gigante diante do monte Fuji, em azul e creme.",
    source: commons("Tsunami by hokusai 19th century.jpg"),
    about: [
      "É uma xilogravura, não uma pintura. Hokusai a criou por volta de 1831, como parte da série \"Trinta e Seis Vistas do Monte Fuji\". Por ser impressa, existem muitas cópias.",
      "Barcos de pescadores são ameaçados por uma onda enorme, enquanto o monte Fuji, pequeno e calmo ao fundo, permanece imóvel. Muitos veem aí o contraste entre a força da natureza, que pode esmagar as pessoas, e a serenidade do que é permanente. Apesar do apelido de \"tsunami\", a imagem retrata uma grande onda do mar.",
      "O azul intenso vem do azul-da-prússia, um pigmento importado da Europa, que chegou ao Japão a partir de 1820. A gravura inspirou artistas europeus na época do japonismo, a moda pela arte japonesa.",
    ],
  },
  {
    slug: "moca-com-brinco-de-perola",
    title: "Moça com Brinco de Pérola",
    artist: "Johannes Vermeer",
    year: "c. 1665",
    description: "O olhar sobre o ombro e a pérola que brilha no escuro.",
    source: commons("Meisje met de parel.jpg"),
    about: [
      "Pintada por volta de 1665 pelo holandês Johannes Vermeer, a obra está no museu Mauritshuis, em Haia. Não é o retrato de uma pessoa específica: é uma \"tronie\", um estudo de rosto e expressão comum na pintura holandesa da época.",
      "A mensagem está mais na sensação do que numa história: um instante em que a jovem olha por cima do ombro, com a boca entreaberta, como se tivesse acabado de ser chamada. O turbante e a pérola brilhando no escuro dão ao quadro um ar de mistério. A identidade da modelo é discutida, e isso faz parte do encanto.",
      "A obra está no Mauritshuis desde 1902, quando um colecionador sem herdeiros a deixou em testamento ao museu.",
    ],
  },
  {
    slug: "o-grito",
    title: "O Grito",
    artist: "Edvard Munch",
    year: "1893",
    description: "O céu alaranjado e a figura na ponte, em tons ardentes.",
    source: commons("The Scream.jpg"),
    about: [
      "Edvard Munch criou várias versões de O Grito a partir de 1893, entre pinturas, pastéis e uma litografia. A data da imagem usada aqui é 1893, o ano da primeira versão, que está no Museu Nacional da Noruega, em Oslo.",
      "Munch contou em seu diário que caminhava ao entardecer quando o céu ficou vermelho como sangue e ele sentiu um grito infinito atravessando a natureza. Ou seja, o grito não vem só da figura: ela tapa os ouvidos para ele. A obra é um retrato da ansiedade e da angústia, sentimentos que muita gente reconhece até hoje.",
      "Uma versão em pastel, de 1895, foi vendida em leilão em 2012 por quase US$ 120 milhões.",
    ],
  },
];

export const getWork = (slug: string) => WORKS.find((w) => w.slug === slug);
export const workImage = (w: Work) => `/obras/${w.slug}.jpg`;
export const workThumb = (w: Work) => `/obras/${w.slug}-thumb.jpg`;
