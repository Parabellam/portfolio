// Dibuja el cubo 2D fuera del hilo principal. La página solo manda el ángulo y el tiempo; si
// llegan varios mensajes antes de dibujar, se dibuja solo el último.
import { createDrawer2D, type Drawer2D } from './draw2d';

type Message =
  | { type: 'init'; canvas: OffscreenCanvas }
  | { type: 'resize'; size: number; dpr: number }
  | { type: 'render'; rx: number; ry: number; time: number };

let drawer: Drawer2D | null = null;
let next: { rx: number; ry: number; time: number } | null = null;
let scheduled = false;

const nextFrame: (fn: () => void) => void =
  typeof requestAnimationFrame === 'function' ? (fn) => requestAnimationFrame(fn) : (fn) => setTimeout(fn, 16);

const draw = () => {
  scheduled = false;
  if (drawer && next) drawer.render(next.rx, next.ry, next.time);
  next = null;
};

self.onmessage = (e: MessageEvent<Message>) => {
  const m = e.data;
  if (m.type === 'init') drawer = createDrawer2D(m.canvas);
  else if (m.type === 'resize') drawer?.resize(m.size, m.dpr);
  else {
    next = m;
    if (!scheduled) {
      scheduled = true;
      nextFrame(draw);
    }
  }
};
