/**
 * Cuánto más grande es el lienzo que la caja del cubo (lado del lienzo / lado de la caja).
 * Al girar, una esquina con su brillo llega más allá de la caja; con este margen no se recorta.
 * Los dos renderizadores dibujan el cubo al mismo tamaño en pantalla que sin margen.
 */
export const BLEED = 1.24;

/** Lo que necesita el componente de cada forma de dibujar el cubo (WebGL o Canvas 2D). */
export interface ForgeRenderer {
  kind: 'webgl' | '2d';
  resize(size: number): void;
  /** rx, ry: rotación en radianes; time: segundos de animación de la lava. */
  render(rx: number, ry: number, time: number): void;
}
