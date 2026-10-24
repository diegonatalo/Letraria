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
  {
    slug: "mona-lisa",
    title: "Mona Lisa",
    artist: "Leonardo da Vinci",
    year: "c. 1503–1517",
    description: "O sorriso mais famoso da pintura, em ASCII colorido.",
    source: commons("Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg"),
    about: [
      "Retrato de meio corpo feito por Leonardo da Vinci, a óleo sobre painel de álamo-branco. Tradicionalmente se vê nele Lisa del Giocondo, mulher de um comerciante florentino, embora não haja certeza total. Acredita-se que tenha sido pintado entre 1503 e 1506, mas Leonardo pode ter retocado a obra até 1517. Ele nunca a entregou à família Giocondo; depois da morte dele, em 1519, o rei Francisco I da França a adquiriu. Está no Louvre, em Paris, desde 1797.",
      "A obra é famosa pela expressão enigmática. O efeito vem do sfumato, a mistura suave de tons, que deixa o humor da modelo ambíguo, sobretudo nos cantos da boca e dos olhos. Cada pessoa tende a ver um sorriso um pouco diferente.",
      "Parte da fama mundial do quadro vem de um roubo: em 1911, Vincenzo Peruggia o levou do Louvre, dizendo agir por patriotismo italiano.",
    ],
  },
  {
    slug: "o-nascimento-de-venus",
    title: "O Nascimento de Vênus",
    artist: "Sandro Botticelli",
    year: "c. 1485",
    description: "A deusa chegando à praia numa concha, em tons de mar e ouro.",
    source: commons("Sandro Botticelli - La nascita di Venere - Google Art Project - edited.jpg"),
    about: [
      "Botticelli provavelmente pintou a obra em meados da década de 1480, em Florença, em têmpera sobre tela, num formato bem grande (cerca de 1,7 m por 2,8 m). Ela está na Galeria Uffizi. Hoje não se sabe ao certo quem a encomendou: antes se pensava nos Médici, mas isso é incerto.",
      "A cena mostra Vênus, já adulta, chegando à margem depois de nascer do mar. À esquerda, o deus do vento Zéfiro a sopra em direção à praia; à direita, uma das Horas, deusas ligadas às estações, vem cobri-la com um manto florido. As interpretações variam, mas costumam ligar a imagem à beleza e ao amor, em diálogo com a Antiguidade clássica.",
      "Uma nudez feminina tão grande e tão em destaque era quase inédita na arte ocidental desde a Antiguidade.",
    ],
  },
  {
    slug: "impressao-nascer-do-sol",
    title: "Impressão, nascer do sol",
    artist: "Claude Monet",
    year: "1872",
    description: "O porto de Le Havre em névoa, o quadro que deu nome ao Impressionismo.",
    source: commons("Monet - Impression, Sunrise.jpg"),
    about: [
      "Monet pintou o quadro em 1872, no porto de Le Havre, sua cidade natal, na França. Foi uma das seis telas que fez do porto em horários e pontos de vista diferentes. Em 2014, astrônomos cruzaram a posição do Sol, a maré e o clima e concluíram que a cena foi pintada na manhã de 13 de novembro de 1872, por volta das 7h35. O quadro está no Museu Marmottan Monet, em Paris.",
      "Em vez de detalhar barcos e chaminés, Monet registra a impressão do momento: a luz laranja do sol sobre a água e a névoa que dissolve as formas. É essa atenção à luz e à atmosfera, mais do que ao contorno, que marcou o novo estilo.",
      "O título foi mostrado na exposição de abril de 1874 e inspirou o nome do movimento: na crítica do jornal Le Charivari, Louis Leroy usou \"Impressionismo\" para descrever o estilo, citando o quadro de Monet. A obra foi roubada do museu em 1985 e recuperada em 1990.",
    ],
  },
  {
    slug: "a-criacao-de-adao",
    title: "A Criação de Adão",
    artist: "Michelangelo",
    year: "c. 1511",
    description: "Duas mãos quase se tocando no teto da Capela Sistina.",
    source: commons("Michelangelo - Creation of Adam (cropped).jpg"),
    about: [
      "É um afresco de Michelangelo no teto da Capela Sistina, no Vaticano, pintado entre 1508 e 1512, a pedido do papa Júlio II. A cena ilustra o Gênesis: Deus dá vida a Adão, o primeiro homem. A imagem aqui é um recorte da cena.",
      "Deus estica o braço para transmitir a centelha de vida, e Adão, já criado mas ainda inerte, estica a mão sem força. Os dois dedos indicadores não se tocam: há um pequeno vão de cerca de 2 cm. Alguns estudiosos leem essa distância como a impossibilidade de o ser humano alcançar a perfeição divina.",
      "Em 1990, um médico americano propôs que as figuras e o manto atrás de Deus lembram um cérebro humano. A ideia é uma hipótese de interpretação, não algo comprovado.",
    ],
  },
  {
    slug: "o-caminhante-sobre-o-mar-de-nevoa",
    title: "O Caminhante sobre o Mar de Névoa",
    artist: "Caspar David Friedrich",
    year: "c. 1818",
    description: "Um homem de costas diante de montanhas e névoa sem fim.",
    source: commons("Caspar David Friedrich - Wanderer above the sea of fog.jpg"),
    about: [
      "Pintura a óleo do alemão Caspar David Friedrich, de cerca de 1818, um dos grandes nomes do Romantismo. Um homem, de costas para nós, está de pé sobre um rochedo e olha uma paisagem coberta por um mar de névoa, de onde saem cumes, árvores e montanhas. Em 1970 ela foi adquirida pelo museu Hamburger Kunsthalle, em Hamburgo, onde está até hoje.",
      "É talvez a figura de costas (Rückenfigur) mais famosa da arte: ao olhar junto com ele, quem vê o quadro se coloca no lugar do caminhante. A obra é lida como símbolo de autorreflexão e de contemplação do caminho da vida, e a paisagem evoca o sublime, aquela mistura de beleza e vertigem diante da natureza.",
      "A identidade do homem é incerta. Há quem sugira que seja um autorretrato do artista, por detalhes como o cabelo ruivo.",
    ],
  },
];

export const getWork = (slug: string) => WORKS.find((w) => w.slug === slug);
export const workImage = (w: Work) => `/obras/${w.slug}.jpg`;
export const workThumb = (w: Work) => `/obras/${w.slug}-thumb.jpg`;
