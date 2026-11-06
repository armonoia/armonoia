// ============================================================
//  ARMONOIA · interactividad de las secciones nuevas
//  (se carga después de lukas.js, que sigue haciendo el papel roto,
//  las cintas y la aparición al scrollear)
//  Todo está dentro de una función para no pisar nada de lukas.js.
// ============================================================
(function () {
  "use strict";

  const $ = (sel, base) => (base || document).querySelector(sel);
  const $$ = (sel, base) => Array.from((base || document).querySelectorAll(sel));

  // ============================================================
  //  1. TECLAS (W A S D y E)
  //  Se hunden al hacerles click y también cuando apretás la tecla
  //  de verdad en tu teclado.
  // ============================================================
  const teclas = {};
  $$(".tecla").forEach((t) => {
    teclas[t.dataset.tecla] = t;
  });

  document.addEventListener("keydown", (e) => {
    const t = teclas[e.key.toLowerCase()];
    if (t && !e.ctrlKey && !e.metaKey && !e.altKey) t.classList.add("activa");
  });

  document.addEventListener("keyup", (e) => {
    const t = teclas[e.key.toLowerCase()];
    if (t) t.classList.remove("activa");
  });

  window.addEventListener("blur", () => {
    Object.values(teclas).forEach((t) => t.classList.remove("activa"));
  });

  // ============================================================
  //  2. QR DE EJEMPLO (solo ilustrativo, no lleva a ningún lado)
  // ============================================================
  function dibujarQR(el) {
    const n = 21;
    let semilla = 11;
    const azarFijo = () => {
      semilla = (semilla * 16807) % 2147483647;
      return semilla / 2147483647;
    };
    const esBuscador = (x, y) =>
      (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);

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
  //  3. WHATSAPP DE EJEMPLO
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
        { pienso: "Qué pesado este tutorial de m...", envio: "¡Qué bueno este tutorial!! Me encantó, aprobados." },
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
  //  4. RADIO DEL LOCAL (reproduce mp3 de verdad)
  //  Poné los mp3 en la carpeta audio/musica/ con estos nombres,
  //  o cambiá "archivo" por el nombre que tenga el tuyo.
  //  "titulo" es lo que se lee en la pantallita de la radio.
  // ============================================================
  const TEMAS = [
    { banda: "Limp Bizkit", titulo: "Break Stuff", archivo: "audio/musica/limp-bizkit.mp3" },
    { banda: "Linkin Park", titulo: "One Step Closer", archivo: "audio/musica/linkin-park.mp3" },
    { banda: "Korn", titulo: "Blind", archivo: "audio/musica/korn.mp3" },
    { banda: "Alice in Chains", titulo: "Would?", archivo: "audio/musica/alice-in-chains.mp3" },
  ];

  const radioEl = $(".radio");
  const temaBanda = $("#temaBanda");
  const temaTitulo = $("#temaTitulo");
  const temaPlay = $("#temaPlay");
  const temaPrev = $("#temaPrev");
  const temaNext = $("#temaNext");
  const temaProgreso = $("#temaProgreso");
  const temaBarra = $("#temaBarra");
  const musica = new Audio();
  window.musicaRadio = musica; // para que el control de volumen la encuentre
  musica.preload = "none";
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

  // ============================================================
  //  5. AUDIOS DE LUKAS
  //  Cada botón apunta a un archivo (data-audio). Si el archivo todavía
  //  no existe, el botón avisa "Audio próximamente" y no rompe nada.
  // ============================================================
  let sonando = null; // { audio, btn }

  function textoBoton(btn, sonandoAhora) {
    const ic = $(".ic", btn);
    const lbl = $(".lbl", btn);
    btn.classList.toggle("sonando", sonandoAhora);
    ic.textContent = sonandoAhora ? "■" : "▶";
    lbl.textContent = sonandoAhora ? "Detener" : "Escuchar a Lukas";
  }

  function pararAudio() {
    if (!sonando) return;
    sonando.audio.pause();
    sonando.audio.currentTime = 0;
    textoBoton(sonando.btn, false);
    sonando = null;
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
      if (sonando && sonando.btn === btn) sonando = null;
    };

    audio.addEventListener("error", falta);
    audio.addEventListener("ended", () => {
      textoBoton(btn, false);
      if (sonando && sonando.btn === btn) sonando = null;
    });

    btn.addEventListener("click", () => {
      if (btn.classList.contains("sin-audio")) return;
      if (sonando && sonando.btn === btn) {
        pararAudio();
        return;
      }
      pararAudio();
      pararMusica();
      sonando = { audio, btn };
      textoBoton(btn, true);
      const promesa = audio.play();
      if (promesa && promesa.catch) promesa.catch(falta);
    });
  });

  // ============================================================
  //  6. RELOJ DE LAS FASES
  //  Click en el reloj = pasa a la fase siguiente (y después de la
  //  última vuelve a la primera). Las manos siempre giran hacia
  //  adelante, como el tiempo.
  // ============================================================
  const FASES = [
    { hora: 9, texto: "9:00 AM", color: "#9ef000" },
    { hora: 12, texto: "12:00 PM", color: "#f9de00" },
    { hora: 15, texto: "15:00 PM", color: "#ff0054" },
    { hora: 20, texto: "20:00 PM", color: "#9ef000" },
  ];

  const reloj = $("#reloj");
  const manoHora = $("#manoHora");
  const manoMinuto = $("#manoMinuto");
  const digital = $("#relojDigital");
  const relojCol = $(".reloj-col");
  const paneles = $$(".panel-fase");
  const pills = $$(".pill");
  const contenedorPaneles = $("#paneles");

  let faseActual = 0;
  let anguloHora = (FASES[0].hora % 12) * 30;
  let anguloMinuto = 0;

  // Marcas de las horas
  const marcas = $("#marcasReloj");
  if (marcas) {
    const NS = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 12; i++) {
      const l = document.createElementNS(NS, "line");
      const larga = i % 3 === 0;
      l.setAttribute("x1", "100");
      l.setAttribute("x2", "100");
      l.setAttribute("y1", larga ? "14" : "15");
      l.setAttribute("y2", larga ? "24" : "21");
      l.setAttribute("stroke", "#2c365e");
      l.setAttribute("stroke-width", larga ? "4" : "2.5");
      l.setAttribute("stroke-linecap", "round");
      l.setAttribute("transform", "rotate(" + i * 30 + " 100 100)");
      marcas.appendChild(l);
    }
  }

  function girarManos(conAnimacion) {
    [manoHora, manoMinuto].forEach((m) => {
      if (!conAnimacion) m.style.transition = "none";
    });
    manoHora.style.transform = "rotate(" + anguloHora + "deg)";
    manoMinuto.style.transform = "rotate(" + anguloMinuto + "deg)";
    if (!conAnimacion) {
      void manoHora.getBoundingClientRect(); // fuerza a aplicar sin animar
      [manoHora, manoMinuto].forEach((m) => {
        m.style.transition = "";
      });
    }
  }

  function irAFase(i, desdeClickReloj) {
    if (i === faseActual) return;

    // Cuántas horas tienen que pasar para llegar a la nueva fase (siempre hacia adelante)
    const destino = (FASES[i].hora % 12) * 30;
    let delta = (destino - (anguloHora % 360) + 360) % 360;
    if (delta === 0) delta = 360;
    anguloHora += delta;
    anguloMinuto += (delta / 30) * 360; // la aguja de los minutos da una vuelta por hora
    girarManos(true);

    faseActual = i;
    pararAudio();

    paneles.forEach((p, k) => p.classList.toggle("activa", k === i));
    pills.forEach((p, k) => p.classList.toggle("activa", k === i));
    digital.textContent = FASES[i].texto;
    relojCol.style.setProperty("--acento-reloj", FASES[i].color);

    // En pantallas chicas el reloj queda arriba: si el panel no se ve, lo traemos
    if (window.innerWidth <= 900 && contenedorPaneles) {
      const r = contenedorPaneles.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.75 || r.top < 0) {
        contenedorPaneles.style.scrollMarginTop = "80px";
        contenedorPaneles.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  if (reloj && manoHora && manoMinuto && digital && relojCol && paneles.length === FASES.length) {
    girarManos(false);
    relojCol.style.setProperty("--acento-reloj", FASES[0].color);

    reloj.addEventListener("click", () => irAFase((faseActual + 1) % FASES.length, true));
    pills.forEach((p) => {
      p.addEventListener("click", () => irAFase(parseInt(p.dataset.i, 10), false));
    });
  }

  // ============================================================
  //  7. PILA DE POLAROIDS (capturas de cada fase)
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
      texto.textContent =
        actual === total - 1 ? "Tocá para volver a empezar" : "Tocá la foto para revelar la siguiente";
    }

    function avanzar() {
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
  //  8. TRANSICIONES CON EL SCROLL
  //   - Los títulos y los papeles/cajas arrancan más chicos y crecen
  //     hasta su tamaño a medida que suben por la pantalla.
  //   - El logo de la portada se agranda de a poco al bajar.
  //   - Una barra verde en el menú muestra cuánto de la página recorriste.
  //  Para cambiar cuánto crecen, tocá MINIMO (0.8 = arranca al 80%).
  // ============================================================
  const sinMovimiento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    // (se recalcula una vez ya cargado todo)
    window.addEventListener("load", pedir);
    pedir();
  }
})();

// ============================================================
//  EXTRAS · polaroids centradas + volumen de la radio
//  (va aparte del bloque de arriba, no toca nada de lo anterior)
// ============================================================

// ---------- Polaroids: se sacan de cada panel y se ponen centradas ----------
(function () {
  "use strict";
  const wrap = document.querySelector(".fases-wrap");
  const paneles = Array.from(document.querySelectorAll(".panel-fase"));
  if (!wrap || !paneles.length) return;

  const caja = document.createElement("div");
  caja.className = "pilas-centro";
  wrap.after(caja);

  // mover el nodo mantiene sus clicks y su animación
  const pilas = paneles.map((p) => {
    const pila = p.querySelector(".pila");
    if (pila) caja.appendChild(pila);
    return pila;
  });

  // Muestra solo la pila de la fase activa
  function sincronizar() {
    paneles.forEach((p, i) => {
      if (pilas[i]) pilas[i].classList.toggle("pila-activa", p.classList.contains("activa"));
    });
  }

  const vigia = new MutationObserver(sincronizar);
  paneles.forEach((p) => vigia.observe(p, { attributes: true, attributeFilter: ["class"] }));
  sincronizar();
})();

// ---------- Volumen de la radio ----------
(function () {
  "use strict";
  const botones = document.querySelector(".radio-botones");
  const musica = window.musicaRadio;
  if (!botones || !musica) return;

  const caja = document.createElement("div");
  caja.className = "radio-vol";
  caja.innerHTML =
    '<button type="button" class="rb rb-vol" aria-label="Silenciar">🔊</button>' +
    '<input type="range" min="0" max="100" value="70" aria-label="Volumen de la radio">';
  botones.appendChild(caja);

  const mute = caja.querySelector("button");
  const rango = caja.querySelector("input");

  function pintar() {
    const v = musica.muted ? 0 : musica.volume;
    mute.textContent = v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊";
    rango.value = Math.round(v * 100);
    rango.style.setProperty("--v", rango.value + "%");
  }

  rango.addEventListener("input", () => {
    musica.muted = false;
    musica.volume = rango.value / 100;
    pintar();
  });

  mute.addEventListener("click", () => {
    if (musica.volume === 0) {
      musica.volume = 0.5;
      musica.muted = false;
    } else {
      musica.muted = !musica.muted;
    }
    pintar();
  });

  musica.volume = 0.7;
  pintar();
})();
