import { FONT, RAMP } from "@/lib/ascii";

/**
 * Renderizador da pintura em ASCII na GPU (WebGL2). Cada pixel decide em qual célula está,
 * amostra a pintura (com mipmaps no lugar da média 2x2) e escolhe o glifo num atlas.
 * Substitui ~25 mil `fillRect` + `fillText` por quadro por uma única chamada de desenho.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_img;
uniform sampler2D u_atlas;
uniform vec2 u_res;     // tamanho do canvas em pixels
uniform vec2 u_origin;  // canto superior esquerdo da grade, em pixels
uniform vec2 u_cell;    // tamanho de uma célula, em pixels
uniform vec2 u_grid;    // colunas, linhas
uniform vec2 u_tile;    // tamanho de um glifo no atlas, em pixels
uniform float u_z;
uniform float u_t;
uniform float u_alpha;
uniform float u_lod;
uniform int u_n;
out vec4 o;

void main() {
  vec2 cf = (vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) - u_origin) / u_cell;
  if (cf.x < 0.0 || cf.y < 0.0 || cf.x >= u_grid.x || cf.y >= u_grid.y) {
    o = vec4(0.0);
    return;
  }
  vec2 cell = floor(cf);
  vec2 loc = cf - cell;
  vec2 nuv = (cell + 0.5) / u_grid - 0.5;
  // Zoom sempre centrado, com uma ondulação suave, como se o céu respirasse.
  float wob = 0.0016 / sqrt(u_z);
  vec2 uv = 0.5 + nuv / u_z + wob * vec2(sin(nuv.y * 22.0 + u_t * 1.3), sin(nuv.x * 18.0 - u_t * 1.1));
  vec3 c = textureLod(u_img, uv, u_lod).rgb;

  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Cintilação nas partes claras (estrelas, lua, janelas).
  float tw = lum > 0.55 ? 0.12 * sin(u_t * 3.0 + cell.x * 1.7 + cell.y * 2.3) : 0.0;
  lum = clamp(pow(lum, 0.55) + tw, 0.0, 1.0);
  int idx = clamp(int(floor(lum * float(u_n))), 0, u_n - 1);

  // Fundo: a cor da célula escurecida; o glifo vai por cima, mais vivo.
  vec3 bg = c * 0.42;
  float boost = clamp((215.0 / 255.0) / max(max(c.r, max(c.g, c.b)), 1.0 / 255.0), 1.0, 2.2);
  vec3 fg = clamp(c * boost, 0.0, 1.0);

  ivec2 t = ivec2(min(floor(loc * u_tile), u_tile - 1.0));
  float a = texelFetch(u_atlas, ivec2(idx * int(u_tile.x) + t.x, t.y), 0).a;
  o = vec4(mix(bg, fg, a) * u_alpha, u_alpha);
}`;

export type GlLayout = {
  /** Tamanho do canvas e da grade, em px CSS. */
  width: number;
  height: number;
  dpr: number;
  originX: number;
  originY: number;
  cw: number;
  ch: number;
  cols: number;
  rows: number;
  fontPx: number;
};

export type GlArt = {
  layout(l: GlLayout): void;
  draw(o: { t: number; z: number; alpha: number }): void;
  dispose(): void;
};

/** Devolve null se o navegador não oferece WebGL2 (aí o chamador usa o desenho em canvas 2D). */
export function createGlArt(canvas: HTMLCanvasElement, img: HTMLImageElement): GlArt | null {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram()!;
  if (!vs || !fs) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const loc = {
    res: u("u_res"),
    origin: u("u_origin"),
    cell: u("u_cell"),
    grid: u("u_grid"),
    tile: u("u_tile"),
    z: u("u_z"),
    t: u("u_t"),
    alpha: u("u_alpha"),
    lod: u("u_lod"),
  };
  gl.uniform1i(u("u_img"), 0);
  gl.uniform1i(u("u_atlas"), 1);
  gl.uniform1i(u("u_n"), RAMP.length);

  // Pintura: com mipmaps, a amostragem afastada vira uma média da região (como a antiga média 2x2).
  const imgTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, imgTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const atlasTex = gl.createTexture();
  const atlas = document.createElement("canvas");
  const actx = atlas.getContext("2d")!;

  const srcW = img.naturalWidth;
  let cols = 1;

  return {
    layout(l) {
      canvas.width = Math.round(l.width * l.dpr);
      canvas.height = Math.round(l.height * l.dpr);
      canvas.style.width = `${l.width}px`;
      canvas.style.height = `${l.height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      cols = l.cols;

      // Atlas: um glifo branco por caractere da escala, no tamanho exato (em pixels) de uma célula.
      const tw = Math.max(1, Math.round(l.cw * l.dpr));
      const th = Math.max(1, Math.round(l.ch * l.dpr));
      atlas.width = tw * RAMP.length;
      atlas.height = th;
      actx.font = `bold ${l.fontPx * l.dpr}px ${FONT}`;
      actx.textBaseline = "top";
      actx.fillStyle = "#fff";
      for (let k = 0; k < RAMP.length; k++) actx.fillText(RAMP[k], k * tw, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform2f(loc.origin, l.originX * l.dpr, l.originY * l.dpr);
      gl.uniform2f(loc.cell, l.cw * l.dpr, l.ch * l.dpr);
      gl.uniform2f(loc.grid, l.cols, l.rows);
      gl.uniform2f(loc.tile, tw, th);
    },
    draw({ t, z, alpha }) {
      gl.uniform1f(loc.t, t);
      gl.uniform1f(loc.z, z);
      gl.uniform1f(loc.alpha, alpha);
      gl.uniform1f(loc.lod, Math.max(0, Math.log2(srcW / (cols * z))));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(imgTex);
      gl.deleteTexture(atlasTex);
      gl.deleteProgram(prog);
    },
  };
}
