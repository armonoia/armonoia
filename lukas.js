// Avisa al CSS que hay JavaScript (activa las animaciones de aparición)
document.documentElement.classList.add("js");

// ============================================================
//  1. IMÁGENES QUE FALTAN (logo / foto de Lukas)
//  Si no existe el archivo, se muestra un cuadro punteado con el
//  texto de data-fallback, así la página no queda rota.
// ============================================================
document.querySelectorAll("img[data-fallback]").forEach((img) => {
  const reemplazar = () => {
    const caja = document.createElement("div");
    caja.className = "placeholder " + img.className;
    caja.textContent = img.dataset.fallback;
    img.replaceWith(caja);
  };
  img.addEventListener("error", reemplazar);
  if (img.complete && img.naturalWidth === 0) reemplazar();
});

// ============================================================
//  2. BORDES RASGADOS
//  A cada elemento con data-rasgado="N" se le recorta el borde de
//  forma irregular (N = qué tan profundo es el rasgado, en px).
//  Cada vez que abrís la página el rasgado es distinto.
// ============================================================
function bordeRasgado(el, amp) {
  const puntos = [];
  const nx = 36; // puntos por lado horizontal
  const ny = 22; // puntos por lado vertical

  // Mordiscos ocasionales más profundos, como un rasgón de verdad
  const tajo = () => (Math.random() < 0.12 ? amp * 1.8 : amp);
  const px = (n) => n.toFixed(1) + "px";

  for (let i = 0; i <= nx; i++) {
    puntos.push((i / nx * 100).toFixed(2) + "% " + px(Math.random() * tajo()));
  }
  for (let j = 1; j < ny; j++) {
    puntos.push("calc(100% - " + px(Math.random() * tajo() * 0.7) + ") " + (j / ny * 100).toFixed(2) + "%");
  }
  for (let i = nx; i >= 0; i--) {
    puntos.push((i / nx * 100).toFixed(2) + "% calc(100% - " + px(Math.random() * tajo()) + ")");
  }
  for (let j = ny - 1; j > 0; j--) {
    puntos.push(px(Math.random() * tajo() * 0.7) + " " + (j / ny * 100).toFixed(2) + "%");
  }

  el.style.clipPath = "polygon(" + puntos.join(",") + ")";
}

document.querySelectorAll("[data-rasgado]").forEach((el) => {
  bordeRasgado(el, parseFloat(el.dataset.rasgado) || 8);
});

// ============================================================
//  3. FONDO: PATRÓN + GRAFFITIS + GRANO
//  Se dibuja UNA sola vez en un canvas fijo (liviano).
// ============================================================
const IMAGENES_PATRON = ["estrella.png", "espiral.png", "flor.png"];
const TAMANO_CELDA = 90; // cuanto más chico, más figuritas hay
const COLOR_FONDO = "#2b1a3c"; // violeta de la paleta
const COLORES_GRAFITI = ["#ff0054", "#9ef000", "#f9de00"];

const azar = (a, b) => a + Math.random() * (b - a);
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

let imagenesPatron = null; // se cargan una sola vez

function cargarImagenesPatron() {
  if (!imagenesPatron) {
    imagenesPatron = Promise.all(
      IMAGENES_PATRON.map(
        (src) =>
          new Promise((resolver) => {
            const img = new Image();
            img.onload = () => resolver(img);
            img.onerror = () => resolver(null); // si falta una, se ignora
            img.src = src;
          })
      )
    ).then((lista) => lista.filter(Boolean));
  }
  return imagenesPatron;
}

// ----- Pequeñas funciones para "pintar" a mano -----

// Salpicadura de aerosol: mancha central + gotitas alrededor
function salpicadura(ctx, x, y, color) {
  const escala = azar(0.7, 1.6);
  ctx.fillStyle = color;
  ctx.globalAlpha = azar(0.16, 0.3);
  ctx.beginPath();
  ctx.arc(x, y, azar(5, 14) * escala, 0, Math.PI * 2);
  ctx.fill();
  const n = 16 + Math.floor(Math.random() * 20);
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() ** 2 * 70 * escala;
    const tam = azar(0.8, 4.5) * (1.2 - dist / (80 * escala));
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, Math.max(tam, 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
}

// Chorreado de pintura
function goteo(ctx, x, y, color) {
  const largo = azar(30, 120);
  const grosor = azar(3, 6);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = azar(0.2, 0.34);
  ctx.lineWidth = grosor;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + azar(-2, 2), y + largo);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + largo, grosor * 0.95, 0, Math.PI * 2);
  ctx.fill();
}

// Garabato en zigzag
function garabato(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.2, 0.34);
  ctx.lineWidth = azar(2, 4.5);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  const n = 6 + Math.floor(Math.random() * 8);
  let px = x;
  let py = y;
  for (let i = 0; i < n; i++) {
    px += (i % 2 ? 1 : -1) * azar(12, 34);
    py += azar(8, 20);
    ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Cruz / tachadura
function cruz(ctx, x, y, color) {
  const t = azar(10, 26);
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.22, 0.36);
  ctx.lineWidth = azar(3, 6);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - t, y - t * azar(0.8, 1.1));
  ctx.lineTo(x + t, y + t * azar(0.8, 1.1));
  ctx.moveTo(x + t * azar(0.8, 1.1), y - t);
  ctx.lineTo(x - t * azar(0.8, 1.1), y + t);
  ctx.stroke();
}

// Espiral dibujada a mano
function espiralTrazo(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.2, 0.32);
  ctx.lineWidth = azar(2.5, 4.5);
  ctx.lineCap = "round";
  ctx.beginPath();
  const vueltas = azar(2, 3.5);
  const paso = azar(2.2, 3.6);
  for (let a = 0; a < vueltas * Math.PI * 2; a += 0.2) {
    const r = a * paso;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Estrella de cinco puntas hecha de un solo trazo
function estrellaTrazo(ctx, x, y, color) {
  const r = azar(16, 34);
  const giro = Math.random() * Math.PI;
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.22, 0.34);
  ctx.lineWidth = azar(2.5, 4.5);
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let k = 0; k <= 5; k++) {
    const ang = giro + (k * 4 * Math.PI) / 5;
    const px = x + Math.cos(ang) * r;
    const py = y + Math.sin(ang) * r;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Flecha
function flecha(ctx, x, y, color) {
  const largo = azar(50, 110);
  const ang = Math.random() * Math.PI * 2;
  const fx = x + Math.cos(ang) * largo;
  const fy = y + Math.sin(ang) * largo;
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.22, 0.34);
  ctx.lineWidth = azar(3, 5);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo((x + fx) / 2 + azar(-20, 20), (y + fy) / 2 + azar(-20, 20), fx, fy);
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx - Math.cos(ang - 0.5) * 18, fy - Math.sin(ang - 0.5) * 18);
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx - Math.cos(ang + 0.5) * 18, fy - Math.sin(ang + 0.5) * 18);
  ctx.stroke();
}

// Círculo "sucio" que no cierra del todo
function circuloSucio(ctx, x, y, color) {
  const r = azar(18, 44);
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.2, 0.32);
  ctx.lineWidth = azar(3, 5);
  ctx.lineCap = "round";
  ctx.beginPath();
  const inicio = Math.random() * Math.PI * 2;
  for (let a = 0; a <= Math.PI * 2.3; a += 0.2) {
    const rr = r + a * 1.5 + azar(-1.5, 1.5);
    const px = x + Math.cos(inicio + a) * rr;
    const py = y + Math.sin(inicio + a) * rr;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Trazo grueso de marcador, de un lado al otro
function rayon(ctx, x, y, color) {
  const largo = azar(90, 280);
  const ang = Math.random() * Math.PI * 2;
  const x2 = x + Math.cos(ang) * largo;
  const y2 = y + Math.sin(ang) * largo;
  ctx.strokeStyle = elegir([color, color, "#000000", "#ffffff"]);
  ctx.globalAlpha = azar(0.14, 0.3);
  ctx.lineWidth = azar(4, 13);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo((x + x2) / 2 + azar(-40, 40), (y + y2) / 2 + azar(-40, 40), x2, y2);
  ctx.stroke();
}

// Tachón: muchas rayitas paralelas en diagonal
function tachon(ctx, x, y, color) {
  const n = 6 + Math.floor(Math.random() * 8);
  const dx = azar(20, 40);
  const dy = azar(-44, -22);
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.2, 0.34);
  ctx.lineWidth = azar(1.5, 3);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    ctx.moveTo(x + i * 7 + azar(-1, 1), y + azar(-2, 2));
    ctx.lineTo(x + i * 7 + dx + azar(-3, 3), y + dy + azar(-3, 3));
  }
  ctx.stroke();
}

// Lazos, como letra cursiva garabateada
function lazos(ctx, x, y, color) {
  const n = 4 + Math.floor(Math.random() * 5);
  ctx.strokeStyle = color;
  ctx.globalAlpha = azar(0.2, 0.34);
  ctx.lineWidth = azar(2, 4);
  ctx.lineCap = "round";
  const inclinacion = azar(-0.5, 0.5);
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * azar(12, 18), y + azar(-4, 4), azar(8, 16), azar(10, 22), inclinacion, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Rasguños: tres líneas finas largas, como uñas
function rasguno(ctx, x, y) {
  ctx.strokeStyle = "#ffffff";
  ctx.globalAlpha = azar(0.1, 0.2);
  ctx.lineWidth = azar(1, 2);
  ctx.lineCap = "round";
  const largo = azar(120, 260);
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(x + k * 9, y + k * 2);
    ctx.lineTo(x + k * 9 + azar(-10, 10), y + largo + azar(-20, 20));
  }
  ctx.stroke();
}

const TRAZOS = [
  garabato, cruz, espiralTrazo, estrellaTrazo, flecha, circuloSucio,
  rayon, rayon, tachon, tachon, lazos, rasguno,
];

async function dibujarFondo() {
  const canvas = document.getElementById("fondo");
  const ancho = window.innerWidth;
  const alto = window.innerHeight;

  const escala = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = ancho * escala;
  canvas.height = alto * escala;

  const ctx = canvas.getContext("2d");
  ctx.scale(escala, escala);

  // Fondo liso
  ctx.fillStyle = COLOR_FONDO;
  ctx.fillRect(0, 0, ancho, alto);

  // Grano, como papel fotocopiado
  const granos = Math.floor((ancho * alto) / 150);
  for (let i = 0; i < granos; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.13)";
    ctx.fillRect(Math.random() * ancho, Math.random() * alto, 1.4, 1.4);
  }

  // Tus imágenes en patrón (estrella, espiral, flor)
  const imagenes = await cargarImagenesPatron();
  if (imagenes.length > 0) {
    // Si el navegador no soporta filtros en canvas (ej. Safari), se usa
    // otro modo de mezcla para que no queden cuadrados blancos.
    const soportaFiltro = "filter" in ctx;
    const columnas = Math.ceil(ancho / TAMANO_CELDA);
    const filas = Math.ceil(alto / TAMANO_CELDA);

    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        if (Math.random() < 0.1) continue; // deja algunos huecos

        const img = elegir(imagenes);
        // Algunas son grandes para que se vea más intervenido
        const grande = Math.random() < 0.14;
        const tam = grande ? azar(95, 150) : azar(38, 70);
        const cx = c * TAMANO_CELDA + TAMANO_CELDA / 2 + (Math.random() - 0.5) * TAMANO_CELDA * 0.8;
        const cy = f * TAMANO_CELDA + TAMANO_CELDA / 2 + (Math.random() - 0.5) * TAMANO_CELDA * 0.8;

        // Recorte cuadrado desde el centro de la imagen
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;

        ctx.save();
        ctx.globalAlpha = grande ? azar(0.1, 0.16) : azar(0.12, 0.26);
        if (soportaFiltro) {
          ctx.globalCompositeOperation = "screen";
          ctx.filter = "invert(1) hue-rotate(180deg)";
        } else {
          ctx.globalCompositeOperation = "multiply";
        }
        ctx.translate(cx, cy);
        ctx.rotate((Math.random() * 360 * Math.PI) / 180);
        ctx.drawImage(img, sx, sy, lado, lado, -tam / 2, -tam / 2, tam, tam);
        ctx.restore();
      }
    }
  }

  // Graffitis: garabatos, cruces, espirales, estrellas, flechas, círculos
  const cantidad = Math.max(34, Math.round((ancho * alto) / 20000));
  for (let i = 0; i < cantidad; i++) {
    ctx.save();
    elegir(TRAZOS)(ctx, azar(0, ancho), azar(0, alto), elegir(COLORES_GRAFITI));
    ctx.restore();
  }

  // Salpicaduras de aerosol
  const manchas = Math.max(6, Math.round((ancho * alto) / 130000));
  for (let i = 0; i < manchas; i++) {
    ctx.save();
    salpicadura(ctx, azar(0, ancho), azar(0, alto), elegir(COLORES_GRAFITI));
    ctx.restore();
  }

  // Chorreados de pintura
  const chorros = Math.max(5, Math.round((ancho * alto) / 170000));
  for (let i = 0; i < chorros; i++) {
    ctx.save();
    goteo(ctx, azar(0, ancho), azar(0, alto * 0.8), elegir(COLORES_GRAFITI));
    ctx.restore();
  }
}

// El fondo generado con graffitis está desactivado: ahora se usa tu imagen (ver lukas.css).
// Si algún día querés volver al fondo de graffitis, descomentá esto y volvé a poner
// <canvas id="fondo" aria-hidden="true"></canvas> en lukas.html:
//
// dibujarFondo();
// let timerFondo;
// window.addEventListener("resize", () => {
//   clearTimeout(timerFondo);
//   timerFondo = setTimeout(dibujarFondo, 250);
// });

// ============================================================
//  4. LOGO DETRÁS DE LA HOJA RASGADA
//  La hoja de papel tiene un agujero irregular en el medio, y por
//  ahí se ve el logo. El agujero cambia cada vez que abrís la página.
// ============================================================
// Qué parte de la hoja se rompe (0.7 = 70% del ancho). Más grande = se ve más logo.
const HOYO = { ancho: 0.58, alto: 0.74 };

function armarHoja() {
  const hoja = document.getElementById("hojaLogo");
  if (!hoja) return;
  const w = hoja.offsetWidth;
  const h = hoja.offsetHeight;
  if (!w || !h) return;

  const amp = Math.min(w, h) * 0.03;
  const paso = Math.max(Math.min(w, h) / 24, 12);
  const f = (n) => n.toFixed(1);

  // Contorno exterior rasgado
  const exterior = [];
  for (let x = 0; x <= w; x += paso) exterior.push([x, azar(0, amp)]);
  for (let y = paso; y < h; y += paso) exterior.push([w - azar(0, amp), y]);
  for (let x = w; x >= 0; x -= paso) exterior.push([x, h - azar(0, amp)]);
  for (let y = h - paso; y > 0; y -= paso) exterior.push([azar(0, amp), y]);

  // Agujero irregular en el centro (rectángulo redondeado y mordido)
  const cx = w / 2 + azar(-w * 0.015, w * 0.015);
  const cy = h / 2 + azar(-h * 0.015, h * 0.015);
  const rx = (w * HOYO.ancho) / 2;
  const ry = (h * HOYO.alto) / 2;
  const hueco = [];
  const n = 76;
  for (let k = 0; k < n; k++) {
    const t = (k / n) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let factor = 1 + azar(-0.06, 0.06);
    if (Math.random() < 0.14) factor += azar(-0.13, 0.1); // mordiscos
    hueco.push([
      cx + Math.sign(c) * Math.abs(c) ** 0.6 * rx * factor,
      cy + Math.sign(s) * Math.abs(s) ** 0.6 * ry * factor,
    ]);
  }

  const aTexto = (puntos) => "M" + puntos.map((p) => f(p[0]) + " " + f(p[1])).join(" L") + " Z";
  hoja.style.clipPath = 'path(evenodd, "' + aTexto(exterior) + " " + aTexto(hueco) + '")';
}

// ============================================================
//  5. RAYONES (garabatos de lapicera y marcador)
//  Se arman sobre las secciones, la ficha, las tarjetas y el logo.
// ============================================================
const NS = "http://www.w3.org/2000/svg";

function trazoSvg(svg, d, color, grosor, opacidad) {
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", d);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", color);
  p.setAttribute("stroke-width", grosor.toFixed(1));
  p.setAttribute("stroke-linecap", "round");
  p.setAttribute("stroke-linejoin", "round");
  p.setAttribute("opacity", opacidad.toFixed(2));
  svg.appendChild(p);
}

function formaRayon(svg, x, y, color) {
  const tipo = Math.floor(Math.random() * 4);
  const f = (n) => n.toFixed(1);
  let d = "";

  if (tipo === 0) {
    // tachón en zigzag
    let px = x;
    let py = y;
    d = "M" + f(px) + " " + f(py);
    const n = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      px += (i % 2 ? 1 : -1) * azar(14, 38);
      py += azar(6, 16);
      d += " L" + f(px) + " " + f(py);
    }
  } else if (tipo === 1) {
    // rayitas paralelas
    const n = 4 + Math.floor(Math.random() * 5);
    const dx = azar(18, 44);
    const dy = azar(-44, -18);
    for (let i = 0; i < n; i++) {
      d += "M" + f(x + i * 8) + " " + f(y) + " l" + f(dx + azar(-3, 3)) + " " + f(dy + azar(-3, 3)) + " ";
    }
  } else if (tipo === 2) {
    // línea larga y curva
    const largo = azar(70, 220);
    const ang = azar(0, Math.PI * 2);
    const x2 = x + Math.cos(ang) * largo;
    const y2 = y + Math.sin(ang) * largo;
    d =
      "M" + f(x) + " " + f(y) +
      " Q" + f((x + x2) / 2 + azar(-30, 30)) + " " + f((y + y2) / 2 + azar(-30, 30)) +
      " " + f(x2) + " " + f(y2);
  } else {
    // lazos
    const n = 3 + Math.floor(Math.random() * 4);
    let px = x;
    for (let i = 0; i < n; i++) {
      const r = azar(8, 18);
      d +=
        "M" + f(px) + " " + f(y) +
        " c" + f(-r * 0.2) + " " + f(-r * 2.2) + " " + f(r * 2.2) + " " + f(-r * 2.2) + " " + f(r * 2) + " 0" +
        " c" + f(-r * 0.6) + " " + f(r * 1.2) + " " + f(-r * 1.8) + " " + f(r * 0.8) + " " + f(-r * 1.4) + " " + f(-r * 0.2) + " ";
      px += r * 1.6;
    }
  }

  trazoSvg(svg, d.trim(), color, azar(1.5, 4.5), azar(0.3, 0.65));
}

// modo "laterales": garabatos en los costados (para secciones enteras)
// modo "bordes": garabatos cerca de los bordes (para tarjetas, hojas, etc.)
function rayones(el, { cantidad, colores, modo }) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "rayones");
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const franja = Math.max((w - Math.min(1100, w * 0.92)) / 2 + 30, 40);

  for (let i = 0; i < cantidad; i++) {
    let x;
    let y;
    if (modo === "laterales") {
      x = Math.random() < 0.5 ? azar(0, franja) : azar(w - franja, w);
      y = azar(0, h);
    } else {
      const r = Math.random();
      if (r < 0.3) { x = azar(0, w); y = azar(0, h * 0.16); }
      else if (r < 0.6) { x = azar(0, w); y = azar(h * 0.84, h); }
      else if (r < 0.8) { x = azar(0, w * 0.14); y = azar(0, h); }
      else { x = azar(w * 0.86, w); y = azar(0, h); }
    }
    formaRayon(svg, x, y, elegir(colores));
  }

  el.insertBefore(svg, el.firstChild);
}

// Los rayones (garabatos sobre los papeles) se sacaron: tapaban el texto.
// Esta función solo limpia cualquier rayón que hubiera quedado.
function construirRayones() {
  document.querySelectorAll(".rayones").forEach((s) => s.remove());
}

function construirTodo() {
  armarHoja();
  construirRayones();
}

// Se arma cuando ya cargaron las fuentes (porque cambian el tamaño de las cosas)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(construirTodo);
}
window.addEventListener("load", construirTodo);

let timerRayones;
window.addEventListener("resize", () => {
  clearTimeout(timerRayones);
  timerRayones = setTimeout(construirTodo, 300);
});

// ============================================================
//  6. APARECER AL HACER SCROLL
// ============================================================
const elementos = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  elementos.forEach((el) => observador.observe(el));
} else {
  elementos.forEach((el) => el.classList.add("visible"));
}
