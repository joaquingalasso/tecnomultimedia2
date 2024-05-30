class trazo_fig {
  constructor(imagen,trazo,paleta,gestorAmp) {
    //gestor sonido
    this.gestorAmp = gestorAmp;
    //margenes
    this.margen_tfig=10;
    //movimiento
    // Establecer la posición inicial en función del valor filtrado de amplitud
    this.max_largo_trazo = 50;
    this.longitud_incremento = 1;
    this.posX_fig=random(this.margen_tfig,width-this.margen_tfig);
    this.posY_fig=random(this.margen_tfig,height-this.margen_tfig);
    this.dx_fig;
    this.dy_fig;
    this.vel_fig = random(4, 7);
    this.angulo_fig;
    //color
    this.paleta=paleta;
    /*paleta figura que selecciona un pixel al azar utilizando como argumento la posY del trazo
    de esta forma se respeta la gama de colores porque establece un paralelismo entre la posy del trazo
    y la forma en la que se agrupan los colores en la imagen original*/
    this.colorsegun_y=this.paleta.darUnColor_figura(this.posY_fig);
    //HSBA
    this.hue_fig=this.colorsegun_y.hue;
    this.saturation_fig=this.colorsegun_y.saturation;
    this.brightness_fig=this.colorsegun_y.brightness;
    this.alpha_fig=this.colorsegun_y.alpha;
  
 //saltar al principio
    //Intervalo mínimo en milisegundos entre saltos al principio
    this.saltar_principio_intervalo =100; 
    //enmascarado//
    this.imagen= imagen;
    // trazo
     // Cambiar tamaño del trazo
     this.tam=8;
    //largo inicial trazo
     this.largo_trazo =0;
     this.cuantavar=10;
  // Asignar un índice aleatorio al array de imagenes para los trazos
  this.trazo = trazo;
  this.cual = floor(random(this.trazo.length));
  this.trazo = this.trazo[this.cual];
  }

//funciones y metodos//

  //metodos 
  // metodo  para verificar si los trazos están en los píxeles oscuros de la imagen de mascara
    pertenece_a_la_forma() {
      let x_en_img = floor(map(this.posX_fig, 0, width, 0, this.imagen.width));
      let y_en_img = floor(map(this.posY_fig, 0, height, 0, this.imagen.height));
      let estepixel = this.imagen.get(x_en_img, y_en_img);

      //manda true cada vez que el brillo de un pixel de la img de mascara es menor a 50//
      return brightness(estepixel) <50; 
      //aca podría hacer algo para modificar la opacidad en funcion a acercarse a los bordes
     //generar posicion aleatoria pero dentro de la mascara
    }


    //metodo para verificar si se sale de los margenes  de la pantalla
    esta_en_margenes(){
      return (
        this.posX_fig > this.margen_tfig &&
        this.posX_fig < width - this.margen_tfig &&
        this.posY_fig > this.margen_tfig &&
        this.posY_fig < height - this.margen_tfig
      );
    }

   //levanta una imagen al azar del array de imgs//
 elegirIndiceAleatorio() {
  this.cual = floor(random(this.trazo.length));
}

//funciones 
//funcion mover trazo//
  mover() { 
  // Incrementar la longitud del trazo
  this.largo_trazo += this.longitud_incremento * this.vel_fig;
    //se verifica si pasó el intervalo mínimo desde el último salto al principio antes de llamar a la función
      if (this.largo_trazo >= this.max_largo_trazo || !this.pertenece_a_la_forma()) {
        this.saltaralprincipio();
      }

    //angulos
    let anguloInicial=270;
    //map para la distribucion de trazo
    this.angulo_fig = map(this.posX_fig, 0, width, anguloInicial - 90-random(this.cuantavar),anguloInicial + 90+random(this.cuantavar));
    //map para el rotate de las imgs
this.anguloimg2= map(this.posX_fig,0, width, -90-random(this.cuantavar),+90+random(this.cuantavar));

    //direccion en x
    this.dx_fig = this.vel_fig * cos(radians(this.angulo_fig));
    //direccion en y
    this.dy_fig = this.vel_fig * sin(radians(this.angulo_fig));
    //variables de movimiento//
    this.posY_fig = this.posY_fig + this.dy_fig;
    this.posX_fig = this.posX_fig + this.dx_fig;   
  }


//reset de los trazos
  saltaralprincipio() {
  // Establecer la posición inicial en función del valor filtrado de amplitud
  this.posX_fig2=map(this.gestorAmp, AMP_MIN, AMP_MAX, this.margen_tfig, width-this.margen_tfig);
  this.posX_fig=random(this.margen_tfig,width-this.margen_tfig);
  this.posY_fig=random(this.margen_tfig,height-this.margen_tfig);
    //cambiar color segun pos en Y
    this.colorsegun_y=this.paleta.darUnColor_figura(this.posY_fig);
    //HSBA
    this.hue_fig=this.colorsegun_y.hue;
    this.saturation_fig=this.colorsegun_y.saturation;
    this.brightness_fig=this.colorsegun_y.brightness;
    //dar posicion al azar en y
        // variable para cambiar a una imagen aleatoria dentro del array de imgs// 
        this.elegirIndiceAleatorio();
        this.largo_trazo = 0;
          this.tam=8;
  }
   
//esto es para cambiar el tamaño en funcion al sonido, para actualizar cosas constantemente 
actualizar_conamp (amplitud){
this.tam=map(amplitud,AMP_MIN,AMP_MAX,8,10);
}
actualizar_conpitch(pitch){
  this.max_largo_trazo=map(pitch,0,1,50,120);
  this.cuantavar=map(pitch,0,1,10,60);
}


  dibujar() {
    // Calcular el centro de this.imagen
    let centroX_imagen = this.imagen.width / 2;
    let centroY_imagen = this.imagen.height / 2;
  
    // Calcular la distancia desde el centro de this.imagen
    let distanciaCentroImagen = dist(this.posX_fig, this.posY_fig, centroX_imagen, centroY_imagen);
  
    // Mapear la opacidad en función de la distancia al centro de this.imagen
     this.alpha_fig = map(distanciaCentroImagen, 0, height / 2, 1, 0.5);  
// Dibujar el trazo en el lienzo gráfico si pertenece a la forma y no está fuera de los margenes//
if (this.esta_en_margenes() && this.pertenece_a_la_forma()) {
  push();
  imageMode(CENTER);
  translate(this.posX_fig,this.posY_fig);
  //trazos con imgs//
  tint(this.hue_fig,this.saturation_fig,this.brightness_fig,this.alpha_fig);
  //tint(this.colorsegun_y);
  rotate(radians(this.anguloimg2));
  image(this.trazo,0,0,this.tam,this.tam);
  pop();
}
  }
}

