
let estado = "inicio";

let colorPaleta;
let colorRandom;
let colorRotulo;
let numRotulo;
let imagenesPaleta = [];
let textura;

let filas = [];
let numFilas;
let margenX = 0;
let fontKurt;

let caSparksActive = false;
let modoMemoria = false;
let mostrarPlayhead = true;
let mostrarDesc = true;

// sintetizadores: uno percusivo para chispas, tres de fondo con timbres distintos
let synth;
let synthBgSine;
let synthBgTriangle;
let synthBgSaw;
let masterCompressor;
let filterLP;

let audioIniciado = false;
let playheadX = 0;

// la menor pentatónica en MIDI, de agudo a grave
let notasEscala = [81, 79, 76, 74, 72, 69, 67, 64, 62, 60];

function preload() {
  fontKurt = loadFont('data/Kurt-Regular.otf');

  let urls_img = [
    "paleta/paleta_1.webp",
    "paleta/paleta_2.webp",
    "paleta/paleta_3.webp",
    "paleta/paleta_4.webp",
  ];

  textura = loadImage("data/textura.webp");

  for (let i = 0; i < urls_img.length; i++) {
    loadImage(urls_img[i], (img) => {
      imagenesPaleta.push(img);
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  colorMode(HSB, 360, 100, 100, 1);
  colorPaleta = new paleta(imagenesPaleta);

  colorRotulo = colorPaleta.darUnColor();
  numRotulo = int(random(1, 1000000));

  // chispas: ataque inmediato, decae rápido
  synth = new p5.PolySynth(undefined, 16);
  synth.setADSR(0.01, 0.15, 0.3, 0.25);

  synthBgSine = new p5.PolySynth(undefined, 12);
  synthBgSine.setADSR(0.3, 0.4, 0.6, 0.8);

  synthBgTriangle = new p5.PolySynth(undefined, 12);
  synthBgTriangle.setADSR(0.3, 0.4, 0.6, 0.8);

  // la sierra necesita un ataque un poco más suave para no clipear
  synthBgSaw = new p5.PolySynth(undefined, 12);
  synthBgSaw.setADSR(0.4, 0.4, 0.5, 1.0);

  masterCompressor = new p5.Compressor();
  masterCompressor.set(0.003, 30, 12, -24, 0.25);

  // cadena: synths → filtro → compresor → salida
  filterLP = new p5.LowPass();
  synth.disconnect(); synth.connect(filterLP);
  synthBgSine.disconnect(); synthBgSine.connect(filterLP);
  synthBgTriangle.disconnect(); synthBgTriangle.connect(filterLP);
  synthBgSaw.disconnect(); synthBgSaw.connect(filterLP);
  filterLP.disconnect();
  filterLP.connect(masterCompressor);

  configurarOsciladoresSynth(synth, 'triangle');
  configurarOsciladoresSynth(synthBgSine, 'sine');
  configurarOsciladoresSynth(synthBgTriangle, 'triangle');
  configurarOsciladoresSynth(synthBgSaw, 'sawtooth');

  inicializarFilas();
  actualizarUI();
}

// p5.PolySynth no expone setType directamente; hay que ir voz por voz
function configurarOsciladoresSynth(polySynth, tipo) {
  if (polySynth && polySynth.voices) {
    for (let i = 0; i < polySynth.voices.length; i++) {
      if (polySynth.voices[i] && polySynth.voices[i].oscillator) {
        polySynth.voices[i].oscillator.setType(tipo);
      }
    }
  }
}

function inicializarFilas() {
  filas = [];
  numFilas = 10;

  let margenY = 10;
  let altoDisponible = height - (numFilas + 1) * margenY;

  // alturas proporcionales con pesos aleatorios
  let pesos = [];
  let sumaPesos = 0;
  for (let i = 0; i < numFilas; i++) {
    let peso = i % 2 === 0 ? random(1.0, 2.0) : random(2.0, 4.0);
    pesos.push(peso);
    sumaPesos += peso;
  }

  let y = margenY;
  for (let i = 0; i < numFilas; i++) {
    let altura = (pesos[i] / sumaPesos) * altoDisponible;
    let seExpande = random() > 0.5;
    let fila = new Fila(y, altura, seExpande, i);
    filas.push(fila);
    y += altura + margenY;
  }

  enlazarVecinos();
}

function enlazarVecinos() {
  for (let r = 0; r < filas.length; r++) {
    let fila = filas[r];
    for (let col of fila.columnas) {
      for (let i = 0; i < col.celdas.length; i++) {
        let celda = col.celdas[i];
        celda.vecinos = [];

        // vecinos dentro de la misma columna
        if (i > 0) celda.vecinos.push(col.celdas[i - 1]);
        if (i < col.celdas.length - 1) celda.vecinos.push(col.celdas[i + 1]);

        // vecinos en la fila de arriba que se solapan horizontalmente
        if (r > 0) {
          for (let colA of filas[r - 1].columnas) {
            for (let celdaA of colA.celdas) {
              if (abs(celda.x - celdaA.x) < (celda.ancho + celdaA.ancho) / 2) {
                celda.vecinos.push(celdaA);
              }
            }
          }
        }

        // vecinos en la fila de abajo
        if (r < filas.length - 1) {
          for (let colB of filas[r + 1].columnas) {
            for (let celdaB of colB.celdas) {
              if (abs(celda.x - celdaB.x) < (celda.ancho + celdaB.ancho) / 2) {
                celda.vecinos.push(celdaB);
              }
            }
          }
        }
      }
    }
  }
}

function draw() {
  if (estado == "inicio") {
    background(0);

    // mouseY controla el filtro y las envolventes en tiempo real
    if (audioIniciado) {
      if (filterLP) {
        filterLP.set(
          map(mouseY, 0, height, 10000, 150, true),
          map(mouseY, 0, height, 1.0, 3.5, true)
        );
      }
      let sparkRelease = map(mouseY, 0, height, 0.12, 1.2, true);
      synth.setADSR(0.01, 0.12, 0.3, sparkRelease);

      let bgAttack = map(mouseY, 0, height, 0.08, 0.6, true);
      let bgRelease = map(mouseY, 0, height, 0.25, 2.5, true);
      synthBgSine.setADSR(bgAttack, 0.4, 0.6, bgRelease);
      synthBgTriangle.setADSR(bgAttack, 0.4, 0.6, bgRelease);
      synthBgSaw.setADSR(bgAttack + 0.1, 0.4, 0.5, bgRelease + 0.5);
    }

    // excitación por mouse hover
    for (let fila of filas) {
      for (let col of fila.columnas) {
        for (let celda of col.celdas) {
          if (
            mouseX > celda.x - celda.ancho / 2 &&
            mouseX < celda.x + celda.ancho / 2 &&
            mouseY > celda.y - celda.altura / 2 &&
            mouseY < celda.y + celda.altura / 2
          ) {
            celda.estadoCA = min(celda.estadoCA + 0.4, 1.0);
          }
          if (caSparksActive && random() < 0.0005) {
            celda.estadoCA = 1.0;
          }
        }
      }
    }

    // difusión del autómata celular (doble buffer)
    for (let fila of filas) {
      for (let col of fila.columnas) {
        for (let celda of col.celdas) {
          let suma = 0;
          for (let vec of celda.vecinos) suma += vec.estadoCA;
          let promedio = celda.vecinos.length > 0 ? suma / celda.vecinos.length : 0;
          celda.siguienteEstadoCA = lerp(celda.estadoCA, promedio, 0.15) * 0.98;
        }
      }
    }
    for (let fila of filas) {
      for (let col of fila.columnas) {
        for (let celda of col.celdas) {
          celda.estadoCA = celda.siguienteEstadoCA;
        }
      }
    }

    // filas con altura variable según mouseY
    let factorMouse = map(mouseY, 0, height, 0, 1, true);
    let alturasDinamicas = [];
    let sumaAlturas = 0;
    for (let fila of filas) {
      let h = fila.seExpande
        ? map(factorMouse, 0, 1, fila.alturaBase, fila.alturaBase + 80)
        : map(1 - factorMouse, 0, 1, fila.alturaBase - 20, fila.alturaBase);
      alturasDinamicas.push(h);
      sumaAlturas += h;
    }

    let margenY = 10;
    let altoDisponible = height - (numFilas + 1) * margenY;
    let yActual = margenY;
    for (let i = 0; i < filas.length; i++) {
      let nuevaAltura = alturasDinamicas[i] * (altoDisponible / sumaAlturas);
      filas[i].actualizarPosicion(yActual + nuevaAltura / 2, nuevaAltura);
      push();
      rectMode(CENTER);
      filas[i].display();
      pop();
      yActual += nuevaAltura + margenY;
    }

    // barrido del secuenciador
    playheadX = (playheadX + 2.5) % width;
    if (mostrarPlayhead && audioIniciado) {
      push();
      stroke(255, 0.35);
      strokeWeight(2.5);
      line(playheadX, 0, playheadX, height);
      pop();
    }

    marco();
    rotulo(colorRotulo, numRotulo);
    image(textura, 0, 0, width, height);
    push();
    dibujarTextura();
    pop();
  }
}

function dibujarTextura() {
  if (frameCount % 10 === 0) {
    for (let i = 0; i < 150; i++) {
      let x1 = random() * width;
      let y1 = random() * height;
      let theta = random() * 2 * Math.PI;
      let len = random() * 5 + 1;
      stroke(0, 10 - random() * 5, 20 - random() * 8, random() * 2 + 10);
      line(x1, y1, cos(theta) * len + x1, sin(theta) * len + y1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  inicializarFilas();
}

function keyPressed() {
  if (key == "f" || key == "F") toggleFullscreen();
  if (key == "s" || key == "S") toggleSparks();
  if (key == "m" || key == "M") toggleMemory();
  if (key == "r" || key == "R") resetMemory();
  if (key == "a" || key == "A") toggleAudio();
  if (key == "b" || key == "B") togglePlayhead();
  if (key == "g" || key == "G") guardarCaptura();
  if (key == "h" || key == "H") toggleDesc();
}

function mousePressed() {
  // ignorar clicks sobre el panel de control
  let panel = document.getElementById("control-panel");
  if (panel) {
    let rect = panel.getBoundingClientRect();
    if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) return;
  }

  for (let fila of filas) {
    for (let col of fila.columnas) {
      for (let celda of col.celdas) {
        if (
          mouseX > celda.x - celda.ancho / 2 &&
          mouseX < celda.x + celda.ancho / 2 &&
          mouseY > celda.y - celda.altura / 2 &&
          mouseY < celda.y + celda.altura / 2
        ) {
          if (audioIniciado && synth) {
            let shiftMidi = map(mouseX, 0, width, 0, 12, true);
            let freq = midiToFreq(notasEscala[celda.rowIndex] + shiftMidi);
            let vel = map(celda.brilloOriginal, 0, 100, 0.08, 0.35);
            let sustain = map(celda.brilloOriginal, 0, 100, 0.15, 0.4) * map(mouseY, 0, height, 0.3, 2.0, true);
            synth.play(freq, vel, 0, sustain);
          }

          // onda expansiva de luz
          celda.estadoCA = 1.0;
          for (let vec of celda.vecinos) {
            vec.estadoCA = 0.8;
            for (let vec2 of vec.vecinos) vec2.estadoCA = 0.6;
          }

          // color nuevo para la columna cliqueada
          let colorNuevo = colorPaleta.darUnColor();
          col.tinte = colorNuevo.hue;
          col.saturacion = colorNuevo.saturation;
          col.brillo = colorNuevo.brightness;
          for (let c of col.celdas) {
            c.tinte = col.tinte;
            c.saturacion = col.saturacion;
            c.brilloOriginal = col.brillo;
          }
        }
      }
    }
  }
}

function toggleSparks() { caSparksActive = !caSparksActive; actualizarUI(); }
function toggleMemory() { modoMemoria = !modoMemoria; actualizarUI(); }
function togglePlayhead() { mostrarPlayhead = !mostrarPlayhead; actualizarUI(); }
function toggleFullscreen() { fullscreen(!fullscreen()); }
function guardarCaptura() { saveCanvas("vibrante", "png"); }

function resetMemory() {
  for (let fila of filas)
    for (let col of fila.columnas)
      for (let celda of col.celdas) {
        celda.hasBeenTouched = false;
        celda.memoriaCA = 0;
        celda.estadoCA = 0;
        celda.siguienteEstadoCA = 0;
      }
}

function toggleAudio() {
  if (!audioIniciado) {
    userStartAudio().then(() => {
      audioIniciado = true;
      mostrarPlayhead = true;
      actualizarUI();
    }).catch(err => console.log("Audio bloqueado:", err));
  } else {
    audioIniciado = false;
    mostrarPlayhead = false;
    actualizarUI();
  }
}

function toggleDesc() {
  mostrarDesc = !mostrarDesc;
  let panel = document.getElementById("control-panel");
  if (panel) panel.style.display = mostrarDesc ? "flex" : "none";
}

function actualizarUI() {
  let btnAudio = document.getElementById("btn-audio");
  let btnSparks = document.getElementById("btn-sparks");
  let btnMemory = document.getElementById("btn-memory");
  let btnPlayhead = document.getElementById("btn-playhead");

  function led(btn, estado) {
    if (!btn) return;
    let ind = btn.querySelector(".indicator");
    btn.classList.toggle("active", estado);
    if (ind) {
      ind.style.background = estado ? "#50fa7b" : "#ff5555";
      ind.style.boxShadow = estado ? "0 0 8px rgba(80,250,123,0.8)" : "0 0 8px rgba(255,85,85,0.8)";
    }
  }

  led(btnAudio, audioIniciado);
  led(btnSparks, caSparksActive);
  led(btnMemory, modoMemoria);
  led(btnPlayhead, mostrarPlayhead);
}
