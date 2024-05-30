let columnWidth; // Ancho de cada columna
let columnSpeed = 0.1; // Velocidad a la que aumenta la luminosidad
let totalColumns; // Número total de columnas
let currentColumn = 0; // Columna actual
let maxBrightness; // Brillo máximo
let lastColumn;
let tinte;


//----CONFIGURACION-----
//amplitud minima y maxima
let AMP_MIN = 0.020; // umbral mínimo de sonido que supera al ruido de fondo
let AMP_MAX = 0.12 // amplitud máxima del sonido
//pitch minimo y maximo
let FREC_MIN = 80;
let FREC_MAX = 350;

//mostrar grafico para debug
let IMPRIMIR = false;
//variables estados
//variable para indicar cantidad de objetos
let cantidad_tf=0;
let cantidadagregar_tf=10;
let cantidad_total_tf=0;
let cantidad_tfig=0;
let cantidad_max_tf=25;
let cantidad_max_tfig=25;

//tiempo
let marca;
let tiempoLimiteFondo = 3000;
let tiempoLimiteFigura=3000;
let tiempoLimiteFin = 3000;

//----MICROFONO----
let mic;
let audioContext;

const model_url = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

//----GESTOR AMPITUD----
let gestorAmp;

//----GESTOR PITCH----
let gestorPitch;


//-----ESTADOS-------
let haySonido = false;
let antesHabiaSonido = false; // memoria del estado de "haySonido" un fotograma atrás

//estado inicial de los objetos//
let estado="fondo";
let bandera="inactiva";

//obtejos 
// Array de objetos Trazo_f
let tfon = [];
// Array de objetos trazo_fig
let tfig = [];

//imagenes y mascaras
//array de imgs mascara figura
let mascarafigura=[];
let index_mfig;
// Array de imágenes de trazos figura
let imgs_trazos = [];
//array de trazos fondo
let imgs_trazos_fondo = [];
//objeto paleta
let paletas_color;

//array de imagenes para las paletas del fondo
let imagen_paleta_fondo=[];
//array de imagenes para las paletas de la figura
let imagen_paleta_figura=[];

//////--------------------PRELOAD----------//////////
// Carga de recursos antes de iniciar el sketch
function preload() {

  // URLs de las imágenes de la paleta de colores de los trazos figura
  let urls_pfig = [
    "paleta/paleta_1.png",
    "paleta/paleta_2.png",
    "paleta/paleta_3.png",
    "paleta/paleta_4.png"
  ];

  // Carga de las imágenes de trazos figura en el array imagen_paleta_figura
  for (let j = 0; j < urls_pfig.length; j++) {
    loadImage(urls_pfig[j], (img) => {
   
      imagen_paleta_figura.push(img); // Agregar la imagen cargada al array
    });
  }

//fondo
  // URLs de las imágenes de la paleta de colores de los trazos fondo
  let urls_pfon = [
    "paleta/paleta_fondo.jpg",
    "paleta/paleta_fondo_2.jpg",
    "paleta/paleta_fondo_3.jpg",
    "paleta/paleta_fondo_4.jpg",
    "paleta/paleta_fondo_5.jpg",
    "paleta/paleta_fondo_6.jpg"
  ];

  // Carga de las imágenes de trazos figura en el array imagen_paleta_fondo
  for (let k = 0; k < urls_pfon.length; k++) {
    loadImage(urls_pfon[k], (img) => {
      imagen_paleta_fondo.push(img); // Agregar la imagen cargada al array
    });
  }

    // Carga de la máscara figura prueba
    //fondo
  // URLs de las imágenes de la mascara para la figura
  let urls_mascfig = [
    "trazos/mascara_figura3.jpg",
    "trazos/mascara_figura4.png",
    "trazos/mascara_figura5.jpg",
    "trazos/mascara_figura6.jpg",
    "trazos/mascara_figura7.jpg",
    "trazos/mascara_figura8.jpg",
    "trazos/mascara_figura9.jpg"
  ];

  // Carga de las imágenes de trazos figura en el array imagen_paleta_fondo
  for (let l = 0; l < urls_mascfig.length; l++) {
    loadImage(urls_mascfig[l], (img) => {
   
      mascarafigura.push(img); // Agregar la imagen cargada al array
    });
  }

}

//------------SETUP------//
function setup() {
 //----MICROFONO-----
 createCanvas(windowWidth, windowHeight);
 audioContext = getAudioContext();
 mic = new p5.AudioIn(); // objeto que se comunica con la enrada de micrófono
 mic.start(startPitch); // se inicia el flujo de audio hay que pasarle el pitch para que funcione
 //----GESTOR----
 gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX); // inicilizo en goestor con los umbrales mínimo y máximo de la señal
 gestorPitch= new GestorSenial(FREC_MIN,FREC_MAX);
 //------MOTOR DE AUDIO-----
 userStartAudio(); // esto lo utilizo porque en algunos navigadores se cuelga el audio. Esto hace un reset del motor de audio (audio context)

 //obj palaeta de color
  paletas_color = new paleta(imagen_paleta_fondo,imagen_paleta_figura);  
 
background(255);
colorMode(HSB);
  //variable para elegir una mascara de figuras del array
  index_mfig=floor(random(mascarafigura.length));
}
///-----------------DRAW---------///
function draw() {
  //cargo en vol la amplitud de la señal del mic cruda
  let vol= mic.getLevel();
  gestorAmp.actualizar(vol);//volumen filtrado
  haySonido = gestorAmp.filtrada >AMP_MIN; //umbral de ruido
  let inicioElSonido = haySonido && !antesHabiaSonido; // EVENTO inicio de sonido
  let finDelSonido = !haySonido && antesHabiaSonido; //EVENTO de fin de sonido;
  if(bandera=="inactiva" && inicioElSonido){
    bandera="activa";
  }
  //----------------ESTADO FONDO------------//
if(estado == "fondo"){
  //cuando inicia el sonido
  if(inicioElSonido){ //Evento
    //condicional si la cantidad actual de objetos en el array  es menor a la cantidad maxima//
    if (tfon.length < cantidad_max_tf) {
      //este calculo determina cuantos trazos faltan para completar la cantidad maxima, para evitar generar mas trazos de los permitidos por la cantidad maxima
      let trazosPorAgregar = Math.min(cantidadagregar_tf, cantidad_max_tf - tfon.length);
      for (let i = 0; i < trazosPorAgregar; i++) {
        tfon.push(new Trazo_f_regular(imgs_trazos_fondo, paletas_color, 3));
        cantidad_tf++;
        cantidad_total_tf++;
      }
    } 
    //si la cantidad de trazos generados es mayor a 50 hacer trazos irregulares
    if (cantidad_total_tf > 150) {
      tfon.forEach((trazo) => {
        cantidadagregar_tf=5;//cambio la cantidad a agregar    
        trazo.dibujar_irregulares(gestorPitch.filtrada);
  });
    } 
  }

  //borrar trazos del fondo que se salieron de pantalla del array
  tfon = tfon.filter((trazo) => {
    const dentroLimites = trazo.posX >= 0 && trazo.posX <= width && trazo.posY>=0 && trazo.posY<=height;
    const nopasolasvueltasmax = trazo.vueltas<=trazo.maxVueltas; 
    return dentroLimites && nopasolasvueltasmax;
  });


//esto es el trigger para que se empiezen a dibujar solos los trazos del fondo la primera vez que se activa hay inicio el sonido
  if(bandera=="activa"){
    //es mejor con for each para que no genere conflicto con la cantidad; 
    tfon.forEach((trazo) => {
      trazo.dibujar_regulares();
      trazo.movertrazo_f();
    });
   }

   //mientras hay sonido 
  if(haySonido){ //Estado
      tfon.forEach((trazo) => {
        //cambiar tamaño con volumen
        trazo.setTam(gestorAmp.filtrada);
        trazo.setEscalaRuido(gestorPitch.filtrada,gestorAmp.filtrada);
      });

    }
//cuando no hay sonido
  if(finDelSonido){//Evento
    //empieza el contador de tiempo
    marca = millis();
  }

  //si estoy en silencio mas tiempo que el tiempo limite paso al siguiente estado
  if(!haySonido){ //Estado SILENCIO
    let ahora = millis();
    if(ahora > marca + tiempoLimiteFondo){
      estado = "figura";
      marca = millis();
    }
  }


//cuando no hay sonido
  if(finDelSonido){//Evento
    //empieza el contador de tiempo
    marca = millis();
  }
}


 //-----------ESTADO FIGURA---------//
 // Bandera
let bandera_empezofigura = false;
 if(estado == "figura"){
  //cuando inicia el sonido
  if(inicioElSonido){ //Evento
    //borro los objetos del array del fondo 
    if(!bandera_empezofigura){
      tfon=[];
    }
    //es para agegar de a varios trazos para que no sea tan tedioso para el usuario
    if (cantidad_tfig <= cantidad_max_tfig ) {
        tfig[cantidad_tfig] = new trazo_fig(mascarafigura[index_mfig], imgs_trazos, paletas_color, gestorAmp.filtrada);
        tfig[cantidad_tfig].saltaralprincipio();
      cantidad_tfig ++;
    }

     // Actualizar la bandera para indicar que la acción se ha realizado
     bandera_empezofigura = true;
  }


// Verificar si la cantidad de trazos en tfig supera el límite máximo
if (tfig.length > cantidad_max_tfig) {
  // Calcular la cantidad de trazos a eliminar
  let trazosPorEliminar = tfig.length - cantidad_max_tfig;
  // Eliminar los trazos más antiguos del array
  tfig.splice(0, trazosPorEliminar);
}

   //mientras hay sonido 
  if(haySonido){ //Estado
      tfig.forEach((trazo) => {
        trazo.actualizar_conamp(gestorAmp.filtrada);
        trazo.actualizar_conpitch(gestorPitch.filtrada);
  //dibujar trazos figura cuando se inicio el sonido//
        trazo.dibujar();
        trazo.mover();
      });
    }
//cuando no hay sonido
  if(finDelSonido){//Evento
    //empieza el contador de tiempo
    marca = millis();
  }

  //si estoy en silencio mas tiempo que el tiempo limite paso al siguiente estado
  if(!haySonido){ //Estado SILENCIO
    let ahora = millis();
    if(ahora > marca + tiempoLimiteFigura){
      estado = "fin";
      marca = millis();
    }
  }
}
//----------------ESTADO FIN---------//
  //para pasar a reinicio hay que hacer ruido 3 segundos
else if (estado == "fin"){

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
  
}
//---------------Reinicio-////////////
else if (estado == "reinicio"){
  background(255);
  cantidad_tf=0;
  cantidad_tfig=0;
  tfon=[];
  tfig=[];
  estado ="fondo";
  marca = millis();
  cantidad_total_tf=0;
// Bandera
bandera_empezofigura = false;
}


     if(IMPRIMIR){
      printData();
    }
     //variable para saber si en el fotograma anterior habia sonido esto siempre al final del draw
     antesHabiaSonido = haySonido; // guardo el estado del fotograma anteior
}
 

////-----------------OTRAS FUNCIONES------/////
///----DEBUG------//////

/*
function printData(){
background(255);
gestorPitch.dibujar(100, 250);
gestorAmp.dibujar(100, 500);
console.log(gestorAmp.filtrada);
console.log(estado);
para probar si funciona la eleccion al azar de las paletas opc 1 es la paleta de la figura y 2 del fondo
paletas_color.debug(2);
para debuggear la mascara de la figura
console.log(index_mfig);
console.log(cantidad_tf);
}

*/

// ---- Pitch detection ---
function startPitch() {
  pitch = ml5.pitchDetection(model_url, audioContext , mic.stream, modelLoaded);
}

function modelLoaded() {
  getPitch();
}

function getPitch() {
  pitch.getPitch(function(err, frequency) {
    if (frequency) {

      gestorPitch.actualizar(frequency);    
      //console.log(frequency);
    } 
    getPitch();
  })
}




function setup() {
  columnWidth= devuelveAncho();
  tinte=random(0,255);
  createCanvas(windowWidth, windowHeight/4);
  totalColumns = floor(width / columnWidth);
  maxBrightness = 255;
  colorMode(HSB);
  noStroke();
}

function devuelveAncho() {
  let valorAncho;
  do {
    valorAncho = random(15.0, 50.0); // Genera un valor aleatorio entre 15 y 50
  } while (width % valorAncho == 0); // Verifica que el resto esté en el rango deseado
  return valorAncho;
}

function draw() {
  background(255);
  stroke(0);
  strokeWeight(2);
  // Dibuja las columnas
  for (let i = 0; i < totalColumns; i++) {
    let columnX = i * columnWidth;
    let brightnessValue = map(abs(i - currentColumn), 0, totalColumns / 0.5, 0, maxBrightness);
    fill(tinte, brightnessValue, 255);
    rect(columnX, 0, columnWidth, map(mouseX,mouseY,width,height, 10));
  }
  
  // Incrementa la columna actual
  currentColumn = (currentColumn + columnSpeed) % totalColumns;
  lastColumn = currentColumn - 1;
}
