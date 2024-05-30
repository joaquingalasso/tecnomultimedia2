let monitorear = true;

let AMP_MIN = 0.020;
let AMP_MAX = 0.12;

let FREC_MIN = 80;
let FREC_MAX = 350;

let mic;
let pitch;
let audioCotext;

let gestorAmp;
let gestorPitch;

let haySonido; // estado de cómo está el sonido en cada momento
let antesHabiaSonido; // moemoria del estado anterior del sonido

let estado = "inicio";
let columnas = [];
let cantidadFilas = 41;
let cantidadColumnas = 1;
let cantidadCeldas = 41;

let colorPaleta;
let imagenPaleta = [];

let marca;  

const model_url =
  "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/";

function preload() {
  let urls_img = [
    "paleta/paleta_1.png",
    "paleta/paleta_2.png",
    "paleta/paleta_3.png",
    "paleta/paleta_4.png",
  ];

  // Carga de las imágenes de trazos figura en el array imagen_paleta_fondo
  for (let i = 0; i < urls_img.length; i++) {
    loadImage(urls_img[i], (img) => {
      imagenPaleta.push(img); // inicio la imagen cargada al array
    });
  }
}
let ac;
let colorRandom;

function setup() {
  createCanvas(displayWidth, displayHeight);

  audioContext = getAudioContext(); // inicia el motor de audio
  mic = new p5.AudioIn(); // inicia el micrófono
  mic.start(startPitch); // se enciende el micrófono y le transmito el analisis de frecuencia (pitch) al micrófono. Conecto la libreria con el micrófono

  userStartAudio(); // por la dudas para forzar inicio de audio en algunos navegadores

  gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);
  gestorPitch = new GestorSenial(FREC_MIN, FREC_MAX);

  colorMode(HSB, 360, 100, 100, 1);
  colorPaleta = new paleta(imagenPaleta);

  antesHabiaSonido = false;

  ac = width / 41;
  colorRandom = random(10, 360);
}

function draw() {

  let vol = mic.getLevel(); // cargo en vol la amplitud del micrófono (señal cruda);
  gestorAmp.actualizar(vol);

  haySonido = gestorAmp.filtrada > 0.1; // umbral de ruido que define el estado haySonido

  let inicioElSonido = haySonido && !antesHabiaSonido; // evendo de INICIO de un sonido
  let finDelSonido = !haySonido && antesHabiaSonido; // evento de fIN de un sonido
  //columnas[cantidadColumnas] = new Columna();
  //columnas[1](colorPaleta, cantidadCeldas).dibujar();

  if (estado == "inicio") {
    if (inicioElSonido) {
        /*for(let i=0; i<cantidadColumnas; i++){
        columnas[i] = new Columna();
        columnas.dibujar();*/
       
      }

    }

    if (haySonido) {
      //Estado
      //columnas[cantidadColumnas] = new Columna();
      background(255);
      for (let i = 0; i < 41; i++) {
        push();
        rectMode(CENTER);
        fill(map(gestorPitch.filtrada, FREC_MIN, FREC_MAX, 120, 240, 0, 360), 100, map(sin((frameCount * 0.1 + i) * 0.4), -1, 5, 0, 255));
        // noStroke();
        rect(ac * i, height/2, ac, map(gestorAmp.filtrada, AMP_MIN, AMP_MAX, 0, height/4));
        pop();
      }
    }

    if (finDelSonido) {
      //Evento
      marca = millis();
    }
    if (!haySonido) {
      //Estado SILENCIO
      let ahora = millis();
    }
/*
  }else if (estado == "grosor"){

    if(inicioElSonido){ //Evento
    }
  
    if(haySonido){ //Estado
      for(let i=0; i<cantidad; i++){
        rectangulos[i].setGrosor(gestorPitch.filtrada);
      }
    }

    if(finDelSonido){//Evento
      marca = millis();
    }

    if(!haySonido){ //Estado SILENCIO
      let ahora = millis();
      if(ahora > marca + tiempoLimiteGrosor){

        estado = "color";
        marca = millis();
      }
    }

  }else if (estado == "color"){

    if(inicioElSonido){ //Evento
     
    }
  
    if(haySonido){ //Estado
      elColor = lerpColor( colorInicial, colorFinal, gestorPitch.filtrada);
    }

    if(finDelSonido){//Evento
      marca = millis();
    }
    
    if(!haySonido){ //Estado SILENCIO
      let ahora = millis();
      if(ahora > marca + tiempoLimiteColor){

        estado = "fin";
        marca = millis();
      }
    }
    
  }else if (estado == "fin"){

    if(inicioElSonido){ //Evento
      marca = millis();
    }
  
    if(haySonido){ //Estado

      let ahora = millis();
      if(ahora > marca + tiempoLimiteFin){
        estado = "reinicio";
        marca = millis();
      }
    }

    if(finDelSonido){//Evento
    }
    
    if(!haySonido){ //Estado SILENCIO
    }
    
  }else if (estado == "reinicio"){

    rectangulos =  [];
    cantidad = 0;
    estado = "inicio";
    elColor = color(0);
    marca = millis();
  }
*/
    if (monitorear) {
      gestorAmp.dibujar(100, 100);
      gestorPitch.dibujar(100, 300);
    }

    printData();
    antesHabiaSonido = haySonido;
  }

// ---- Debug ---
  function printData(){
    //background(255);
    console.log(estado);
    console.log(gestorAmp.filtrada);
    console.log(gestorPitch.filtrada);
    }

// ---- Pitch detection ---
function startPitch() {
  pitch = ml5.pitchDetection(model_url, audioContext, mic.stream, modelLoaded);
}

function modelLoaded() {
  getPitch();
}

function getPitch() {
  pitch.getPitch(function (err, frequency) {
    if (frequency) {
      gestorPitch.actualizar(frequency);
      //console.log(frequency);
    }
    getPitch();
  });
}


