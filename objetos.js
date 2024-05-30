class Columna {

    constructor(paleta, cantidadCeldas){
        this.grosor = 1;
        this.tinte = hue(paleta.darUnColor());
        this.cantidad = width / cantidadCeldas;
    }

    dibujar(){
        background(0);
        push()
        //rectMode(CENTER);
        for (let i = 0; i < cantidadCeldas; i++) {
            // new Celda (color, alto, ancho);
            strokeWeight( this.grosor);
            fill(this.tinte, 100, map(sin((frameCount * 0.1 + i) * 0.4), -1, 5, 0, 255));
            rect(this.cantidad * i, 0, this.cantidad, mouseY);
          }
        pop();
    }
}