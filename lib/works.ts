/** Obras em domínio público (reproduções reduzidas da Wikimedia Commons). */
export type Work = {
  slug: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  /** Página do arquivo na Wikimedia Commons. */
  source: string;
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
  },
  {
    slug: "girassois",
    title: "Os Girassóis",
    artist: "Vincent van Gogh",
    year: "1888",
    description: "Amarelos e ocres em pinceladas grossas, de perto até o vaso inteiro.",
    source: commons("Vincent Willem van Gogh 127.jpg"),
  },
  {
    slug: "o-beijo",
    title: "O Beijo",
    artist: "Gustav Klimt",
    year: "1907–1908",
    description: "O ouro e os padrões do casal abraçado, revelados do centro para fora.",
    source: commons("The Kiss - Gustav Klimt - Google Cultural Institute.jpg"),
  },
  {
    slug: "a-grande-onda",
    title: "A Grande Onda de Kanagawa",
    artist: "Katsushika Hokusai",
    year: "c. 1831",
    description: "A onda gigante diante do monte Fuji, em azul e creme.",
    source: commons("Tsunami by hokusai 19th century.jpg"),
  },
  {
    slug: "moca-com-brinco-de-perola",
    title: "Moça com Brinco de Pérola",
    artist: "Johannes Vermeer",
    year: "c. 1665",
    description: "O olhar sobre o ombro e a pérola que brilha no escuro.",
    source: commons("Meisje met de parel.jpg"),
  },
  {
    slug: "o-grito",
    title: "O Grito",
    artist: "Edvard Munch",
    year: "1893",
    description: "O céu alaranjado e a figura na ponte, em tons ardentes.",
    source: commons("The Scream.jpg"),
  },
];

export const getWork = (slug: string) => WORKS.find((w) => w.slug === slug);
export const workImage = (w: Work) => `/obras/${w.slug}.jpg`;
export const workThumb = (w: Work) => `/obras/${w.slug}-thumb.jpg`;
