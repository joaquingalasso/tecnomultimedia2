class paleta {
  constructor(imagenPaleta) {
    this.imagenPaleta = this.elegirImagenAleatoria(imagenPaleta);
    this.paletas = imagenPaleta;
  }

  // Paleta fondo
  darUnColor() {
    let x, y, pixelColor, gris;

    do {
      x = int(random(this.imagenPaleta.width));
      y = int(random(this.imagenPaleta.height));
      gris = int(random(1, 5));
      pixelColor = this.imagenPaleta.get(x, y);

      let { hue, saturation, brightness, alpha } = rgbToHsb(pixelColor);

      // Filtro para la primera imagen
      if (this.imagenPaleta === this.paletas[0]) {
        if (
          saturation < 10 ||
          brightness < 35 ||
          brightness > 70 ||
          (hue > 60 && hue < 185) ||
          hue > 270
        ) {
          continue;
        }
      }
      // Filtro para la segunda imagen
      else if (this.imagenPaleta === this.paletas[1]) {
        if (
          hue < 10 ||
          hue > 40 ||
          saturation > 60 ||
          (saturation > 7.5 && saturation < 50) ||
          (brightness > 11 && brightness < 45) ||
          brightness > 50
        ) {
          continue;
        }
      }
      // Filtro para la tercera imagen
      else if (this.imagenPaleta === this.paletas[2]) {
        if (
          saturation < 10 ||
          brightness < 35 ||
          brightness > 70 ||
          (hue > 60 && hue < 155) ||
          hue > 270
        ) {
          continue;
        }
      } else if (this.imagenPaleta === this.paletas[3]) {
        if (
          saturation < 10 ||
          brightness < 35 ||
          brightness > 70 ||
          (hue > 60 && hue < 175) ||
          hue > 270
        ) {
          continue;
        }
      }
      return { hue, saturation, brightness, alpha };
    } while (true);
  }

  // Elegir una imagen aleatoria de un array
  elegirImagenAleatoria(imagenes) {
    let index = int(random(imagenes.length));
    return imagenes[index];
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
