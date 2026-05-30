class Fila {
  constructor(y, altura, seExpande, index) {
    this.alturaBase = altura;
    this.altura = altura;
    this.seExpande = seExpande;
    this.index = index;
    this.y = y + altura / 2;
    this.columnas = [];

    let numColumnas = int(random(5, 10));
    let gapX = 2;
    let totalWidth = width - (numColumnas + 1) * gapX;

    // alternamos pesos para que no todas las columnas sean iguales
    let pesos = [];
    let sumaPesos = 0;
    for (let i = 0; i < numColumnas; i++) {
      let peso = i % 2 === 0 ? 1.0 : 1.5;
      pesos.push(peso);
      sumaPesos += peso;
    }

    let x = gapX;
    for (let i = 0; i < numColumnas; i++) {
      let ancho = (pesos[i] / sumaPesos) * totalWidth;
      this.columnas.push(new Columna(x, this.y, ancho, this.altura, i, this.index));
      x += ancho + gapX;
    }
  }

  actualizarPosicion(y, nuevaAltura) {
    this.y = y;
    this.altura = nuevaAltura;
    for (let columna of this.columnas) columna.actualizarPosicion(y, nuevaAltura);
  }

  display() {
    for (let columna of this.columnas) {
      push();
      rectMode(CENTER);
      columna.display();
      pop();
    }
  }
}

class Columna {
  constructor(x, y, ancho, altura, index, rowIndex) {
    this.x = x;
    this.y = y;
    this.ancho = ancho;
    this.altura = altura;
    this.index = index;
    this.rowIndex = rowIndex;
    this.disparadaEnCiclo = false;

    // cantidad de celdas según resolución de pantalla
    let minCeldas, maxCeldas;
    if (width < 600)       { minCeldas = 3; maxCeldas = 6; }
    else if (width < 1200) { minCeldas = 5; maxCeldas = 9; }
    else                   { minCeldas = 8; maxCeldas = 14; }
    this.numCeldas = int(random(minCeldas, maxCeldas + 1));

    let colorRandom = colorPaleta.darUnColor();
    this.tinte     = colorRandom.hue;
    this.saturacion = colorRandom.saturation;
    this.brillo    = colorRandom.brightness;

    this.celdas = [];

    // degradado de brillo aleatorio: izq→der, der→izq, o centro→extremos (efecto cilindro)
    let modoDegradado = int(random(0, 3));
    let celdaAncho = this.ancho / this.numCeldas;
    let minBrillo = this.brillo * 0.05;

    for (let i = 0; i < this.numCeldas; i++) {
      let brilloCelda;
      if (modoDegradado === 0) {
        brilloCelda = map(i, 0, this.numCeldas - 1, minBrillo, this.brillo);
      } else if (modoDegradado === 1) {
        brilloCelda = map(i, 0, this.numCeldas - 1, this.brillo, minBrillo);
      } else {
        let distCentro = abs(i - (this.numCeldas - 1) / 2);
        brilloCelda = map(distCentro, 0, (this.numCeldas - 1) / 2, this.brillo, minBrillo);
      }

      this.celdas.push(new Celda(
        this.x + i * celdaAncho + celdaAncho / 2,
        this.y,
        celdaAncho,
        this.altura,
        null,
        brilloCelda,
        this.tinte,
        this.saturacion,
        brilloCelda,
        this.rowIndex
      ));
    }
  }

  actualizarPosicion(y, nuevaAltura) {
    this.y = y;
    this.altura = nuevaAltura;
    for (let celda of this.celdas) celda.actualizarPosicion(y, nuevaAltura);
  }

  display() {
    // sonido de fondo: una nota suave por columna al cruzar el playhead
    let cruzado = (playheadX > this.x && playheadX < this.x + this.ancho);
    if (cruzado) {
      if (!this.disparadaEnCiclo) {
        if (audioIniciado && !modoMemoria && Math.random() < 0.15) {
          let shiftMidi = map(mouseX, 0, width, 0, 12, true);
          let freq = midiToFreq(notasEscala[this.rowIndex] + shiftMidi);
          let vel = map(this.brillo, 0, 100, 0.002, 0.01);
          let sustain = map(this.brillo, 0, 100, 0.5, 1.2) * map(mouseY, 0, height, 0.25, 2.2, true);

          // sine/triangle/saw según la fila
          let bgSynth = [synthBgSine, synthBgTriangle, synthBgSaw][this.rowIndex % 3];
          if (bgSynth) bgSynth.play(freq, vel, 0, sustain);
        }
        this.disparadaEnCiclo = true;
      }
    } else {
      this.disparadaEnCiclo = false;
    }

    push();
    rectMode(CENTER);
    for (let celda of this.celdas) celda.display();
    pop();
  }
}

class Celda {
  constructor(x, y, ancho, altura, colorArg, brillo, tinte, saturacion, brilloOriginal, rowIndex) {
    this.x = x;
    this.y = y;
    this.ancho = ancho;
    this.altura = altura;
    this.color = colorArg;
    this.brillo = brillo;
    this.tinte = tinte;
    this.saturacion = saturacion;
    this.brilloOriginal = brilloOriginal;
    this.rowIndex = rowIndex;

    this.estadoCA = 0;
    this.siguienteEstadoCA = 0;
    this.vecinos = [];
    this.hasBeenTouched = false;
    this.memoriaCA = 0;
    this.disparadaEnCiclo = false;
  }

  actualizarPosicion(y, nuevaAltura) {
    this.y = y;
    this.altura = nuevaAltura;
  }

  display() {
    let hueShift = map(mouseX, 0, width, 0, 360);
    let tinteActual = (this.tinte + hueShift) % 360;

    // memoria de rastro: sube con la energía, decae lento con un piso del 15%
    if (this.estadoCA > 0.02) {
      this.hasBeenTouched = true;
      this.memoriaCA = max(this.memoriaCA, this.estadoCA);
    } else if (this.hasBeenTouched) {
      this.memoriaCA = max(this.memoriaCA * 0.992, 0.15);
    }

    // chispa sonora: solo si la celda está activa y el playhead la cruza
    let cruzado = (playheadX > this.x - this.ancho / 2 && playheadX < this.x + this.ancho / 2);
    if (cruzado) {
      let estaActiva = modoMemoria ? (this.hasBeenTouched && this.memoriaCA > 0.15) : (this.estadoCA > 0.4);
      if (estaActiva && !this.disparadaEnCiclo && audioIniciado && synth) {
        let shiftMidi = map(mouseX, 0, width, 0, 12, true);
        let freq = midiToFreq(notasEscala[this.rowIndex] + shiftMidi);
        let nivelEnergia = modoMemoria ? this.memoriaCA : this.estadoCA;
        let vel = map(nivelEnergia, 0.15, 1.0, 0.04, 0.22) * map(this.brilloOriginal, 0, 100, 0.3, 1.0);
        let sustain = map(nivelEnergia, 0.15, 1.0, 0.15, 0.4) * map(mouseY, 0, height, 0.3, 2.0, true);
        synth.play(freq, vel, 0, sustain);
        this.disparadaEnCiclo = true;
      }
    } else {
      this.disparadaEnCiclo = false;
    }

    if (modoMemoria) {
      fill(this.hasBeenTouched
        ? color(tinteActual, this.saturacion, this.brilloOriginal, this.memoriaCA)
        : color(0));
      push();
      rectMode(CENTER);
      rect(this.x, this.y, this.ancho - 1, this.altura);
      pop();
    } else {
      let pitchSimulado = map(sin(frameCount * 0.04 + this.x * 0.002), -1, 1, 0.3, 1.0);
      let satBase  = map(sin((frameCount * 0.1 + this.x / this.ancho) * 0.4), -1, 3, 0, this.saturacion);
      let satActual   = lerp(satBase, 0, this.estadoCA);
      let brilloActual = lerp(pitchSimulado * this.brilloOriginal, 100, this.estadoCA);

      fill(color(tinteActual, satActual, brilloActual));
      push();
      rectMode(CENTER);
      rect(this.x, this.y, this.ancho - 1, this.altura);
      pop();
    }
  }
}

function rotulo(color, numero) {
  push();
  colorMode(HSB);
  let hueShift = map(mouseX, 0, width, 0, 360);
  let tinteActual = (color.hue + hueShift) % 360;
  let brilloOsc = map(sin(frameCount * 0.04), -1, 1, 40, color.brightness + 20);
  fill(tinteActual, color.saturation, brilloOsc);
  if (fontKurt) textFont(fontKurt);
  textSize(16);
  text("M.fREIRE - " + numero, 30, height - 10);
  pop();
}

function marco() {
  push();
  rectMode(CENTER);
  fill(0, 0);
  strokeWeight(60);
  stroke(0);
  rect(width / 2, height / 2, width, height);
  pop();
}
