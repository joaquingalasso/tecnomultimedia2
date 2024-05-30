class paleta {
  constructor(imagenPaleta) {
    this.imagenPaleta = this.elegirImagenAleatoria(imagenPaleta);
  }

  // Paleta fondo
  darUnColor() {
    let x, y, pixelColor;

    do {
      x = int(random(this.imagenPaleta.width));
      y = int(random(this.imagenPaleta.height));

      pixelColor = this.imagenPaleta.get(x, y);

      let { hue, saturation, brightness, alpha } = rgbToHsb(pixelColor);

      // Verificar si el color es "muy chillón" (saturación y brillo altos)
      if (saturation < 30 || brightness < 40) {
        // Generar nuevos valores de coordenadas y obtener un nuevo color
        continue;
      }

      return { hue, saturation, brightness, alpha };
    } while (true);
  }

  // Elegir una imagen aleatoria de un array
  elegirImagenAleatoria(imagenes) {
    let index = int(random(imagenes.length));
    return imagenes[index];
  }

  //testeo
  debug(opcion) {
    if (opcion == 1) {
      image(this.imagenPaleta_figura, 0, 0);
    } else if (opcion == 2) {
      image(this.imagenPaleta, 0, 0);
    }
  }
}

// Transformar RGB a HSB
function rgbToHsb(rgbColor) {
  colorMode(RGB); // Establecer el modo de color en RGB para evitar interferencias
  let c = color(rgbColor);
  colorMode(HSB); // Establecer el modo de color en HSB
  let hueValue = hue(c);
  let saturationValue = saturation(c);
  let brightnessValue = brightness(c);
  let alphaValue = alpha(c);

  return {
    hue: hueValue,
    saturation: saturationValue,
    brightness: brightnessValue,
    alpha: alphaValue,
  };
}
