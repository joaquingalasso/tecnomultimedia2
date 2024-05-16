let columnWidth; // Ancho de cada columna
let columnSpeed = 0.1; // Velocidad a la que aumenta la luminosidad
let totalColumns; // Número total de columnas
let currentColumn = 0; // Columna actual
let maxBrightness; // Brillo máximo
let lastColumn;
let tinte;

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
