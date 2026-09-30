/** Lo que necesita el componente de cada forma de dibujar el cubo (WebGL o Canvas 2D). */
export interface ForgeRenderer {
  kind: 'webgl' | '2d';
  resize(size: number): void;
  /** rx, ry: rotación en radianes; time: segundos de animación de la lava. */
  render(rx: number, ry: number, time: number): void;
}
