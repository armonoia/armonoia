// ============================================================
//  ARMONOIA · todo el JavaScript de la página en un solo archivo
// ============================================================

// Avisa al CSS que hay JavaScript (activa las animaciones de aparición)
document.documentElement.classList.add("js");

(function () {
  "use strict";

  const $ = (sel, base) => (base || document).querySelector(sel);
  const $$ = (sel, base) => Array.from((base || document).querySelectorAll(sel));
  const azar = (a, b) => a + Math.random() * (b - a);
  const sinMovimiento = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Efectos de sonido cortos (teclas, polaroids). Si falta el mp3, no pasa nada.
  const sonidosBase = {};
  function sonar(archivo, volumen) {
    let base = sonidosBase[archivo];
    if (!base) {
      base = sonidosBase[archivo] = new Audio(archivo);
      base.preload = "auto";
    }
    const a = base.cloneNode(); // un clon por vez, así se pueden superponer si tocás rápido
    a.volume = volumen === undefined ? 0.6 : volumen;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  }

  // ============================================================
  //  1. IMÁGENES Y VIDEO QUE FALTAN
  //  Si no existe el archivo, se muestra un cuadro punteado con el
  //  texto de data-fallback, así la página no queda rota.
  // ============================================================
  $$("img[data-fallback], video[data-fallback]").forEach((el) => {
    const reemplazar = () => {
      const caja = document.createElement("div");
      caja.className = "placeholder " + el.className;
      caja.textContent = el.dataset.fallback;
      el.replaceWith(caja);
    };
    el.addEventListener("error", reemplazar);
    const roto = el.tagName === "IMG" ? el.complete && el.naturalWidth === 0 : el.error || el.networkState === 3;
    if (roto) reemplazar();
  });

  // Video del logo: se reproduce una vez y al terminar se queda repitiendo
  // sus últimos fotogramas (el wiggle de las letras) hasta que se refresque.
  const logoVideo = $("video.logo");
  const WIGGLE_FOTOGRAMAS = 10; // cuántos fotogramas finales se repiten
  const WIGGLE_FPS = 25;       // velocidad del wiggle (más bajo = más lento; el video original va a 25)

  if (logoVideo) {
    if (sinMovimiento) {
      logoVideo.removeAttribute("autoplay");
      logoVideo.pause();
    } else if (logoVideo.requestVideoFrameCallback) {
      // Un lienzo por fotograma: se van turnando y siempre quedan guardados los últimos N
      const lienzos = Array.from({ length: WIGGLE_FOTOGRAMAS }, () => document.createElement("canvas"));
      let turno = 0;
      let guardados = 0;

      const guardar = () => {
        const c = lienzos[turno];
        if (c.width !== logoVideo.videoWidth || c.height !== logoVideo.videoHeight) {
          c.width = logoVideo.videoWidth;
          c.height = logoVideo.videoHeight;
        }
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(logoVideo, 0, 0);
        turno = (turno + 1) % WIGGLE_FOTOGRAMAS;
        guardados++;
        logoVideo.requestVideoFrameCallback(guardar);
      };
      logoVideo.requestVideoFrameCallback(guardar);

      logoVideo.addEventListener("ended", () => {
        if (guardados < WIGGLE_FOTOGRAMAS) return;

        // En orden de reproducción: el más viejo de los N primero, el último al final
        const orden = [];
        for (let k = 0; k < WIGGLE_FOTOGRAMAS; k++) orden.push(lienzos[(turno + k) % WIGGLE_FOTOGRAMAS]);

        const visible = document.createElement("canvas");
        visible.className = logoVideo.className;
        visible.width = orden[0].width;
        visible.height = orden[0].height;
        visible.setAttribute("role", "img");
        visible.setAttribute("aria-label", logoVideo.getAttribute("aria-label") || "Logo");
        const ctx = visible.getContext("2d");
        ctx.drawImage(orden[WIGGLE_FOTOGRAMAS - 1], 0, 0); // el último fotograma, sin salto visual
        logoVideo.replaceWith(visible);

        // Repite los N fotogramas, empezando por el más viejo (después del último vuelve al primero)
        let i = 0;
        setInterval(() => {
          ctx.clearRect(0, 0, visible.width, visible.height);
          ctx.drawImage(orden[i], 0, 0);
          i = (i + 1) % WIGGLE_FOTOGRAMAS;
        }, 1000 / WIGGLE_FPS);
      });
    }
  }

  // ============================================================
  //  2. BORDES RASGADOS
  //  A cada elemento con data-rasgado="N" se le recorta el borde de
  //  forma irregular (N = qué tan profundo es el rasgado, en px).
  //  Cada vez que abrís la página el rasgado es distinto.
  // ============================================================
  function bordeRasgado(el, amp) {
    const puntos = [];
    const nx = 36;
    const ny = 22;
    const tajo = () => (Math.random() < 0.12 ? amp * 1.8 : amp);
    const px = (n) => n.toFixed(1) + "px";

    for (let i = 0; i <= nx; i++) {
      puntos.push(((i / nx) * 100).toFixed(2) + "% " + px(Math.random() * tajo()));
    }
    for (let j = 1; j < ny; j++) {
      puntos.push("calc(100% - " + px(Math.random() * tajo() * 0.7) + ") " + ((j / ny) * 100).toFixed(2) + "%");
    }
    for (let i = nx; i >= 0; i--) {
      puntos.push(((i / nx) * 100).toFixed(2) + "% calc(100% - " + px(Math.random() * tajo()) + ")");
    }
    for (let j = ny - 1; j > 0; j--) {
      puntos.push(px(Math.random() * tajo() * 0.7) + " " + ((j / ny) * 100).toFixed(2) + "%");
    }

    el.style.clipPath = "polygon(" + puntos.join(",") + ")";
  }

  $$("[data-rasgado]").forEach((el) => {
    bordeRasgado(el, parseFloat(el.dataset.rasgado) || 8);
  });

  // ============================================================
  //  3. HOJA ROTA DEL LOGO
  //  La hoja de papel tiene un agujero irregular en el medio, y por
  //  ahí se ve el logo (el video). El agujero cambia cada vez que
  //  abrís la página.
  // ============================================================
  // Qué parte de la hoja se rompe (0.58 = 58% del ancho). Más grande = se ve más logo.
  const HOYO = { ancho: 0.58, alto: 0.74 };

  function armarHoja() {
    const hoja = $("#hojaLogo");
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

    // Agujero irregular en el centro
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

  // Se arma cuando ya cargaron las fuentes (porque cambian el tamaño de las cosas)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(armarHoja);
  window.addEventListener("load", armarHoja);

  let timerHoja;
  window.addEventListener("resize", () => {
    clearTimeout(timerHoja);
    timerHoja = setTimeout(armarHoja, 300);
  });

  // ============================================================
  //  4. APARECER AL HACER SCROLL
  // ============================================================
  const revelar = $$(".reveal");

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
    revelar.forEach((el) => observador.observe(el));
  } else {
    revelar.forEach((el) => el.classList.add("visible"));
  }

  // ============================================================
  //  5. TECLAS (W A S D y E)
  //  Se hunden al hacerles click y también cuando apretás la tecla
  //  de verdad en tu teclado.
  // ============================================================
  const teclas = {};
  $$(".tecla").forEach((t) => {
    teclas[t.dataset.tecla] = t;
  });

  // Sonido de keycap: audio/tecla.mp3 (al hacer click en la tecla o al apretarla de verdad)
  $$(".tecla").forEach((t) => t.addEventListener("click", () => sonar("armonoia/audio/tecla.mp3", 0.5)));

  document.addEventListener("keydown", (e) => {
    const t = teclas[e.key.toLowerCase()];
    if (t && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!e.repeat) sonar("armonoia/audio/tecla.mp3", 0.5);
      t.classList.add("activa");
    }
  });

  document.addEventListener("keyup", (e) => {
    const t = teclas[e.key.toLowerCase()];
    if (t) t.classList.remove("activa");
  });

  window.addEventListener("blur", () => {
    Object.values(teclas).forEach((t) => t.classList.remove("activa"));
  });

  // ============================================================
  //  6. QR DE EJEMPLO (solo ilustrativo, no lleva a ningún lado)
  // ============================================================
  function dibujarQR(el) {
    const n = 21;
    let semilla = 11;
    const azarFijo = () => {
      semilla = (semilla * 16807) % 2147483647;
      return semilla / 2147483647;
    };
    const esBuscador = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);

    let celdas = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (esBuscador(x, y)) continue;
        if (azarFijo() > 0.5) celdas += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }

    // Los tres cuadrados grandes de las esquinas
    const buscador = (x0, y0) =>
      '<rect x="' + x0 + '" y="' + y0 + '" width="7" height="7"/>' +
      '<rect x="' + (x0 + 1) + '" y="' + (y0 + 1) + '" width="5" height="5" fill="#fff"/>' +
      '<rect x="' + (x0 + 2) + '" y="' + (y0 + 2) + '" width="3" height="3"/>';

    el.innerHTML =
      '<svg viewBox="0 0 ' + n + " " + n + '" xmlns="http://www.w3.org/2000/svg" ' +
      'fill="#14091e" shape-rendering="crispEdges" aria-hidden="true">' +
      celdas + buscador(0, 0) + buscador(n - 7, 0) + buscador(0, n - 7) +
      "</svg>";
  }

  const qr = $("#qrEjemplo");
  if (qr) dibujarQR(qr);

  // ============================================================
  //  7. WHATSAPP DE EJEMPLO
  //  Para cambiar los textos, editá la lista PASOS.
  //   - texto:   lo que escribe el otro
  //   - pienso:  lo que Lukas piensa (lo que ves en el botón)
  //   - envio:   lo que se manda de verdad
  // ============================================================
  const RESPUESTA_1 = "Vas a decir lo correcto, o lo que le deberías responder a tu jefe...";

  const PASOS = [
    {
      texto: "Te van a llegar mensajes de tu jefe y de otras personas, que vas a poder responder eligiendo opciones, como las de abajo.",
      opciones: [
        { pienso: "Cada una de estas opciones muestra lo que piensa Lukas sobre el mensaje.", envio: RESPUESTA_1 },
        { pienso: "A veces no piensa cosas muy copadas que digamos...", envio: RESPUESTA_1 },
        { pienso: "Pero al fin y al cabo, si hacés click en cualquier respuesta...", envio: RESPUESTA_1 },
      ],
    },
    {
      texto: "A veces vas a querer decir cosas como...",
      opciones: [
        { pienso: "Qué pesado este tutorial de m...", envio: "¡Qué bueno este tutorial!! Aprobadisimos." },
      ],
    },
  ];

  const TEXTO_FINAL = "Lo que pensás no siempre es lo que enviás.";

  const wppMsgs = $("#wppMsgs");
  const wppOpc = $("#wppOpc");
  const wppReset = $("#wppReset");
  let wppToken = 0;
  let wppIniciado = false;

  function bajar() {
    wppMsgs.scrollTop = wppMsgs.scrollHeight;
  }

  function burbuja(clase, texto) {
    const d = document.createElement("div");
    d.className = "burbuja " + clase;
    d.textContent = texto;
    wppMsgs.appendChild(d);
    bajar();
    return d;
  }

  function escribiendo() {
    const d = document.createElement("div");
    d.className = "burbuja entra escribiendo";
    d.innerHTML = "<i></i><i></i><i></i>";
    wppMsgs.appendChild(d);
    bajar();
    return d;
  }

  function mostrarPaso(i, token) {
    wppOpc.innerHTML = "";
    const puntos = escribiendo();
    setTimeout(() => {
      if (token !== wppToken) return;
      puntos.remove();
      burbuja("entra", PASOS[i].texto);
      mostrarOpciones(i, token);
    }, 1000);
  }

  function mostrarOpciones(i, token) {
    wppOpc.innerHTML = "";
    PASOS[i].opciones.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opcion";
      const marca = document.createElement("small");
      marca.textContent = "Lukas piensa:";
      b.appendChild(marca);
      b.appendChild(document.createTextNode(o.pienso));
      b.addEventListener("click", () => elegir(i, o, token));
      wppOpc.appendChild(b);
    });
  }

  function elegir(i, opcion, token) {
    wppOpc.innerHTML = "";
    burbuja("sale", opcion.envio);
    setTimeout(() => {
      if (token !== wppToken) return;
      if (i + 1 < PASOS.length) {
        mostrarPaso(i + 1, token);
      } else {
        burbuja("aviso", TEXTO_FINAL);
        wppReset.hidden = false;
      }
    }, 800);
  }

  function empezarWpp() {
    wppToken++;
    wppMsgs.innerHTML = "";
    wppOpc.innerHTML = "";
    wppReset.hidden = true;
    mostrarPaso(0, wppToken);
  }

  if (wppMsgs && wppOpc && wppReset) {
    wppReset.addEventListener("click", empezarWpp);

    // Arranca recién cuando el chat entra en pantalla
    const caja = $("#wpp");
    const arrancar = () => {
      if (wppIniciado) return;
      wppIniciado = true;
      empezarWpp();
    };
    if ("IntersectionObserver" in window && caja) {
      const obs = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting)) {
            arrancar();
            obs.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      obs.observe(caja);
    } else {
      arrancar();
    }
  }

  // ============================================================
  //  8. RADIO DEL LOCAL (reproduce mp3 de verdad, con volumen)
  //  Poné los mp3 en la carpeta audio/musica/ con estos nombres,
  //  o cambiá "archivo" por el nombre que tenga el tuyo.
  //  "titulo" es lo que se lee en la pantallita de la radio.
  // ============================================================
  const TEMAS = [
    { banda: "Limp Bizkit", titulo: "Break Stuff", archivo: "armonoia/audio/musica/Limp-Bizkit.mp3" },
    { banda: "Linkin Park", titulo: "One Step Closer", archivo: "armonoia/audio/musica/Linkin-Park.mp3" },
    { banda: "Korn", titulo: "Blind", archivo: "armonoia/audio/musica/Korn.mp3" },
    { banda: "Alice in Chains", titulo: "Would?", archivo: "armonoia/audio/musica/Alice-In-Chains.mp3" },
  ];

  const radioEl = $(".radio");
  const temaBanda = $("#temaBanda");
  const temaTitulo = $("#temaTitulo");
  const temaPlay = $("#temaPlay");
  const temaPrev = $("#temaPrev");
  const temaNext = $("#temaNext");
  const temaProgreso = $("#temaProgreso");
  const temaBarra = $("#temaBarra");
  const volRango = $("#volRango");
  const volMute = $("#volMute");
  const musica = new Audio();
  musica.preload = "none";
  musica.volume = 0.7;

  // Volumen: el que eligió la persona (volMusica). Cuando habla Lukas, la música se "agacha" casi al mínimo.
  const VOLUMEN_AGACHADO = 0.1; // 0.1 = la música baja al 10% mientras suena un audio de Lukas (0 = silencio, 1 = no baja)
  let volMusica = 0.7;
  let factorMusica = 1;
  let objetivoMusica = 1;
  let timerMusica = null;

  function aplicarVolumen() {
    musica.volume = Math.max(0, Math.min(1, volMusica * factorMusica));
  }

  // Baja (true) o devuelve (false) el volumen de la música, de a poco para que no corte de golpe
  function agacharMusica(si) {
    objetivoMusica = si ? VOLUMEN_AGACHADO : 1;
    if (timerMusica) return;
    timerMusica = setInterval(() => {
      factorMusica += (objetivoMusica - factorMusica) * 0.25;
      if (Math.abs(objetivoMusica - factorMusica) < 0.01) {
        factorMusica = objetivoMusica;
        clearInterval(timerMusica);
        timerMusica = null;
      }
      aplicarVolumen();
    }, 40);
  }
  let tema = 0;
  let musicaCargada = -1; // qué tema está cargado en el reproductor

  function botonRadio(suena) {
    if (!temaPlay) return;
    temaPlay.textContent = suena ? "❚❚ Pausar" : "▶ Escuchar";
    if (radioEl) radioEl.classList.toggle("sonando", suena);
  }

  function pararMusica() {
    if (musica.paused) return;
    musica.pause();
    botonRadio(false);
  }

  function mostrarTema(mensaje) {
    const t = TEMAS[tema];
    temaBanda.textContent = t.banda;
    temaTitulo.textContent = mensaje || t.titulo;
    if (temaBarra) temaBarra.style.width = "0%";
  }

  function cargarYTocar() {
    pararAudio(); // si hablaba Lukas, se calla
    if (musicaCargada !== tema) {
      musica.src = TEMAS[tema].archivo;
      musicaCargada = tema;
      if (temaBarra) temaBarra.style.width = "0%";
    }
    const p = musica.play();
    botonRadio(true);
    if (p && p.catch) p.catch(() => {}); // los errores los maneja el evento "error"
  }

  function cambiarTema(nuevo, seguirSonando) {
    const sonaba = seguirSonando || !musica.paused;
    musica.pause();
    musicaCargada = -1;
    tema = (nuevo + TEMAS.length) % TEMAS.length;
    mostrarTema();
    if (sonaba) cargarYTocar();
    else botonRadio(false);
  }

  if (temaBanda && temaTitulo && temaPlay && temaPrev && temaNext) {
    temaPrev.addEventListener("click", () => cambiarTema(tema - 1));
    temaNext.addEventListener("click", () => cambiarTema(tema + 1));

    temaPlay.addEventListener("click", () => {
      if (!musica.paused) pararMusica();
      else cargarYTocar();
    });

    musica.addEventListener("timeupdate", () => {
      if (temaBarra && musica.duration) {
        temaBarra.style.width = (musica.currentTime / musica.duration) * 100 + "%";
      }
    });

    // Al terminar, pasa sola al siguiente tema
    musica.addEventListener("ended", () => cambiarTema(tema + 1, true));

    // Si el mp3 no está en la carpeta, avisa en la pantallita
    musica.addEventListener("error", () => {
      botonRadio(false);
      musicaCargada = -1;
      temaTitulo.textContent = "Falta el mp3: " + TEMAS[tema].archivo;
    });

    // Click en la barra = saltar a ese punto
    if (temaProgreso) {
      temaProgreso.style.pointerEvents = "auto";
      temaProgreso.addEventListener("click", (e) => {
        if (!musica.duration) return;
        const r = temaProgreso.getBoundingClientRect();
        musica.currentTime = ((e.clientX - r.left) / r.width) * musica.duration;
      });
    }

    mostrarTema();
  }

  // Volumen (en iPhone el sistema no deja cambiarlo por código: ahí se usan los botones del celu)
  function pintarVolumen() {
    const v = musica.muted ? 0 : volMusica;
    volMute.textContent = v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊";
    volRango.value = Math.round(v * 100);
    volRango.style.setProperty("--v", volRango.value + "%");
  }

  if (volRango && volMute) {
    volRango.addEventListener("input", () => {
      musica.muted = false;
      volMusica = volRango.value / 100;
      aplicarVolumen();
      pintarVolumen();
    });

    volMute.addEventListener("click", () => {
      if (volMusica === 0) {
        volMusica = 0.5;
        aplicarVolumen();
        musica.muted = false;
      } else {
        musica.muted = !musica.muted;
      }
      pintarVolumen();
    });

    pintarVolumen();
  }

  // ============================================================
  //  9. AUDIOS DE LUKAS
  //  Cada botón apunta a un archivo (data-audio). Si el archivo todavía
  //  no existe, el botón avisa "Audio próximamente" y no rompe nada.
  // ============================================================
  let sonando = null; // { audio, btn }

  function textoBoton(btn, sonandoAhora) {
    btn.classList.toggle("sonando", sonandoAhora);
    $(".ic", btn).textContent = sonandoAhora ? "■" : "▶";
    $(".lbl", btn).textContent = sonandoAhora ? "Detener" : "Escuchar a Lukas";
  }

  function pararAudio() {
    if (!sonando) return;
    sonando.audio.pause();
    sonando.audio.currentTime = 0;
    textoBoton(sonando.btn, false);
    sonando = null;
    agacharMusica(false); // la música vuelve a su volumen
  }

  $$(".btn-audio").forEach((btn) => {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = btn.dataset.audio;

    const falta = () => {
      btn.classList.remove("sonando");
      btn.classList.add("sin-audio");
      btn.setAttribute("aria-disabled", "true");
      $(".ic", btn).textContent = "🔇";
      $(".lbl", btn).textContent = "Audio próximamente";
      if (sonando && sonando.btn === btn) {
        sonando = null;
        agacharMusica(false);
      }
    };

    audio.addEventListener("error", falta);
    audio.addEventListener("ended", () => {
      textoBoton(btn, false);
      if (sonando && sonando.btn === btn) {
        sonando = null;
        agacharMusica(false); // terminó de hablar: la música vuelve
      }
    });

    btn.addEventListener("click", () => {
      if (btn.classList.contains("sin-audio")) return;
      if (sonando && sonando.btn === btn) {
        pararAudio();
        return;
      }
      pararAudio();
      sonando = { audio, btn };
      agacharMusica(true); // mientras habla Lukas, la música baja casi al mínimo (no se apaga)
      textoBoton(btn, true);
      const promesa = audio.play();
      if (promesa && promesa.catch) promesa.catch(falta);
    });
  });

  // ============================================================
  //  10. HORAS DE LAS FASES
  //  Al tocar una hora se muestran su paso a paso y sus polaroids,
  //  y la tarjeta se "pinta" como un graffiti, con su sonido.
  //  (La última, "Cierre", no tiene horario: es otro botón más.)
  // ============================================================
  const horas = $$(".hora");
  const paneles = $$(".panel-fase");
  const pilasFases = $$(".pilas .pila"); // solo las de las fases (sin la de la tienda)

  // Numera los pasos para que aparezcan escalonados al "pintarse"
  $$(".pasos").forEach((ol) => $$(".paso", ol).forEach((p, k) => p.style.setProperty("--i", k)));

  // Sonido del spray: poné tu mp3 en audio/graffiti.mp3 (si falta, simplemente no suena)
  const sonidoGraffiti = new Audio("armonoia/audio/graffiti.mp3");
  sonidoGraffiti.preload = "none";
  sonidoGraffiti.volume = 0.6;

  // ---------- Pinceladas ----------
  // Dibuja pinceladas anchas (con cerdas) del color de la fase sobre la hoja,
  // y después la pintura se desvanece y deja ver el contenido.
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function colorDe(el) {
    const prueba = document.createElement("span");
    prueba.style.color = getComputedStyle(el).getPropertyValue("--acento").trim() || "#ff0054";
    document.body.appendChild(prueba);
    const m = getComputedStyle(prueba).color.match(/\d+/g) || [255, 0, 84];
    prueba.remove();
    return m.slice(0, 3).map(Number);
  }

  function pintarHoja(panel) {
    const card = $(".fase-card", panel);
    if (!card) return;
    let lienzo = $(".fase-lienzo", card);
    if (!lienzo) {
      lienzo = document.createElement("canvas");
      lienzo.className = "fase-lienzo";
      lienzo.setAttribute("aria-hidden", "true");
      card.appendChild(lienzo);
    }
    const token = (lienzo._token = (lienzo._token || 0) + 1);
    const w = card.clientWidth;
    const h = card.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.round(w * dpr);
    lienzo.height = Math.round(h * dpr);
    const ctx = lienzo.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const [r, g, b] = colorDe(panel);
    const tono = (f) => "rgb(" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v * f)))).join(",") + ")";

    // Una fila de pincelada por cada ~80px de alto, yendo y viniendo
    const filas = Math.max(6, Math.round(h / 80));
    const alto = h / filas;
    const DUR_FILA = 0.45; // segundos que tarda cada pincelada
    const SALTO = 0.07;    // segundos entre que empieza una pincelada y la siguiente
    const trazos = [];
    for (let k = 0; k < filas; k++) {
      trazos.push({
        dir: k % 2 === 0 ? 1 : -1,
        yc: alto * (k + 0.5) + azar(-6, 6),
        amp: azar(4, 12),
        fase: azar(0, 6.28),
        freq: azar(0.004, 0.009),
        ini: k * SALTO,
        hecho: 0,
        cerdas: Array.from({ length: 9 }, (_, n) => ({
          off: (n / 8 - 0.5) * alto * 1.5 + azar(-3, 3),
          ancho: alto * azar(0.24, 0.36),
          color: tono(azar(0.84, 1.08)),
        })),
      });
    }

    lienzo.classList.add("pintando");
    const t0 = performance.now();
    const total = (filas - 1) * SALTO + DUR_FILA;

    function cuadro(ahora) {
      if (lienzo._token !== token) return; // empezó otra pintada
      const t = (ahora - t0) / 1000;
      trazos.forEach((z) => {
        const p = Math.min(Math.max((t - z.ini) / DUR_FILA, 0), 1);
        const e = easeInOut(p);
        if (e <= z.hecho) return;
        const xa = z.dir > 0 ? -30 + (w + 60) * z.hecho : w + 30 - (w + 60) * z.hecho;
        const xb = z.dir > 0 ? -30 + (w + 60) * e : w + 30 - (w + 60) * e;
        const pasos = Math.max(1, Math.ceil(Math.abs(xb - xa) / 14));
        z.cerdas.forEach((c) => {
          ctx.strokeStyle = c.color;
          ctx.lineWidth = c.ancho;
          ctx.beginPath();
          for (let s = 0; s <= pasos; s++) {
            const x = xa + ((xb - xa) * s) / pasos;
            const y = z.yc + c.off + z.amp * Math.sin(x * z.freq + z.fase);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
        z.hecho = e;
      });

      if (t < total) {
        requestAnimationFrame(cuadro);
      } else {
        // Se queda un instante cubierto y después la pintura se desvanece
        setTimeout(() => {
          if (lienzo._token === token) lienzo.classList.remove("pintando");
        }, 250);
      }
    }
    requestAnimationFrame(cuadro);
  }

  function graffitear(i, conSonido) {
    const tarjeta = $(".tarjeta", paneles[i]);
    if (!tarjeta) return;
    tarjeta.classList.remove("pintando");
    void tarjeta.offsetWidth; // reinicia la animación de los pasos
    tarjeta.classList.add("pintando");
    if (!sinMovimiento) pintarHoja(paneles[i]);
    if (conSonido) {
      sonidoGraffiti.currentTime = 0;
      const p = sonidoGraffiti.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  // Fondos de la vista de fases: uno por fase, se cruzan con un fundido
  const fondos = $$(".fondo-fase");
  function mostrarFondo(i) {
    fondos.forEach((f, k) => f.classList.toggle("activo", k === i));
  }

  function irAFase(i) {
    pararAudio();
    mostrarFondo(i);
    horas.forEach((h, k) => {
      h.classList.toggle("activa", k === i);
      h.setAttribute("aria-pressed", k === i ? "true" : "false");
    });
    paneles.forEach((p, k) => p.classList.toggle("activa", k === i));
    pilasFases.forEach((p, k) => p.classList.toggle("activa", k === i));
    graffitear(i, true);
  }

  horas.forEach((h, k) => h.addEventListener("click", () => irAFase(k)));

  // ============================================================
  //  11. PILA DE POLAROIDS (capturas de cada fase)
  //  Cada click manda la foto de arriba hacia un costado y "revela"
  //  la de abajo (aparece oscura y borrosa, como una polaroid que se
  //  está revelando). Después de la última, vuelve a empezar.
  // ============================================================
  $$("[data-pila]").forEach((pila) => {
    const fotos = $$(".foto", pila);
    const cont = $(".pila-cont", pila);
    const texto = $(".pila-texto", pila);
    const total = fotos.length;
    let actual = 0;
    let visto = false; // la primera foto se revela cuando la pila entra en pantalla

    function pintar() {
      fotos.forEach((f, k) => {
        f.style.setProperty("--d", Math.max(k - actual, 0));
        f.classList.toggle("se-fue", k < actual);
        f.classList.toggle("oscura", k !== actual || !visto);
      });
      cont.textContent = actual + 1 + " de " + total;
      texto.textContent = actual === total - 1 ? "Tocá para volver a empezar" : "Tocá la foto para revelar la siguiente";
    }

    function avanzar() {
      sonar("armonoia/audio/polaroid.mp3", 0.6); // ruido de foto / papel (poné tu mp3 en audio/polaroid.mp3)
      visto = true;
      actual = (actual + 1) % total;
      pintar();
    }

    pila.addEventListener("click", avanzar);
    pila.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        avanzar();
      }
    });

    pintar();

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting)) {
            visto = true;
            pintar();
            obs.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(pila);
    } else {
      visto = true;
      pintar();
    }
  });

  // ============================================================
  //  13. VISTAS: PÁGINA PRINCIPAL <-> FASES
  //  Las fases son otra "pantalla" dentro de la misma página (sin
  //  pestaña nueva). Se usa el hash #fases, así el botón "atrás"
  //  del navegador también vuelve a la principal.
  // ============================================================
  const vistaPrincipal = $("#vistaPrincipal");
  const vistaFases = $("#vistaFases");
  let enFases = false;

  function abrirFases() {
    if (enFases || !vistaFases) return;
    enFases = true;
    vistaPrincipal.hidden = true;
    vistaFases.hidden = false;
    document.body.classList.add("en-fases");
    window.scrollTo({ top: 0, behavior: "instant" });
    irAFase(0); // arranca siempre en la primera fase (9:00)
  }

  function cerrarFases() {
    if (!enFases) return;
    enFases = false;
    pararAudio();
    vistaFases.hidden = true;
    vistaPrincipal.hidden = false;
    document.body.classList.remove("en-fases");
  }

  function segunHash() {
    const h = location.hash;
    if (h === "#fases") {
      abrirFases();
      return;
    }
    const venia = enFases;
    cerrarFases();
    // Si venía de las fases y el link apunta a una sección, ir hasta ahí
    const destino = venia && h.length > 1 ? document.getElementById(h.slice(1)) : null;
    if (destino) requestAnimationFrame(() => destino.scrollIntoView({ behavior: "instant" }));
  }

  window.addEventListener("hashchange", segunHash);
  segunHash();

  // ============================================================
  //  12. TRANSICIONES CON EL SCROLL
  //   - Los títulos y los papeles/cajas arrancan más chicos y crecen
  //     hasta su tamaño a medida que suben por la pantalla.
  //   - El logo de la portada se agranda de a poco al bajar.
  //   - Una barra verde en el menú muestra cuánto de la página recorriste.
  //  Para cambiar cuánto crecen, tocá "minimo" (0.8 = arranca al 80%).
  // ============================================================
  if (!sinMovimiento) {
    const CRECEN = [
      { sel: ".titulo-seccion", minimo: 0.7 },
      { sel: ".choque", minimo: 0.8 },
      { sel: ".nota", minimo: 0.85 },
      { sel: ".ficha-marco", minimo: 0.86 },
      { sel: ".ctrl", minimo: 0.84 },
      { sel: ".wpp", minimo: 0.88 },
      { sel: ".radio", minimo: 0.84 },
      { sel: ".tarjeta", minimo: 0.88 },
      { sel: ".pila", minimo: 0.8 },
      { sel: ".equipo", minimo: 0.85 },
    ];
    const items = [];
    CRECEN.forEach((c) => $$(c.sel).forEach((el) => items.push({ el, minimo: c.minimo })));

    const logo = $(".logo-collage");
    const nav = $(".nav");
    let pendiente = false;

    function actualizar() {
      pendiente = false;
      const vh = window.innerHeight;

      items.forEach(({ el, minimo }) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return; // oculto (por ejemplo, una fase que no está activa)
        // punto de referencia: el centro del elemento, o a lo sumo 25% de la pantalla
        const ancla = r.top + Math.min(r.height / 2, vh * 0.25);
        const p = Math.min(Math.max((vh - ancla) / (vh * 0.4), 0), 1);
        const suave = 1 - Math.pow(1 - p, 3);
        el.style.setProperty("--z", (minimo + (1 - minimo) * suave).toFixed(3));
      });

      if (logo) {
        const q = Math.min(window.scrollY / (vh * 0.9), 1);
        logo.style.setProperty("--zl", (1 + 0.1 * q).toFixed(3));
      }

      if (nav) {
        const total = document.documentElement.scrollHeight - vh;
        nav.style.setProperty("--progreso", total > 0 ? Math.min(window.scrollY / total, 1).toFixed(4) : 0);
      }
    }

    function pedir() {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    }

    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    // al cambiar de fase aparece otro panel: recalculamos
    document.addEventListener("click", () => setTimeout(pedir, 60));
    window.addEventListener("load", pedir);
    pedir();
  }
})();