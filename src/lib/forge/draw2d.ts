// Dibujo en Canvas 2D del cubo de alambre con la masa de lava. Sirve tanto en la página como
// dentro de un Worker (OffscreenCanvas), por eso no toca el DOM.

type P3 = [number, number, number];
type P2 = { x: number; y: number; z: number };

// Vértices y aristas de un cubo de lado 2.
const V: P3[] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
const EDGES: [number, number][] = [];
for (let a = 0; a < 8; a++) {
  for (let b = a + 1; b < 8; b++) {
    if (V[a].filter((c, i) => c !== V[b][i]).length === 1) EDGES.push([a, b]);
  }
}

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export interface Drawer2D {
  resize(size: number, dpr: number): void;
  render(rx: number, ry: number, time: number): void;
}

export function createDrawer2D(canvas: AnyCanvas): Drawer2D {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('Canvas 2D no disponible');

  let size = 0;
  let dpr = 1;

  // Rotación, perspectiva y proyección a pantalla (z > 0 = más cerca). Los senos y cosenos se
  // calculan una vez por cuadro y se reutilizan para los 8 vértices.
  const projector = (rx: number, ry: number, rz: number) => {
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    const c = size / 2;
    const k = size * 0.25;
    return ([x0, y0, z0]: P3): P2 => {
      let x = x0 * cosY + z0 * sinY;
      let z = -x0 * sinY + z0 * cosY;
      let y = y0 * cosX - z * sinX;
      z = y0 * sinX + z * cosX;
      const t = x * cosZ - y * sinZ;
      y = x * sinZ + y * cosZ;
      x = t;
      const s = 4.2 / (4.2 - z);
      return { x: c + x * s * k, y: c + y * s * k, z };
    };
  };

  // Contorno de la masa: radio que ondula con varias frecuencias (lóbulos grandes y lisos).
  const blobPath = (t: number, spin: number) => {
    const R = size * 0.2;
    const n = 120;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const q = a + spin;
      const r =
        R *
        (1 +
          0.13 * Math.sin(3 * q + t * 0.9) +
          0.09 * Math.sin(2 * q - t * 0.7 + 1.3) +
          0.05 * Math.sin(5 * q + t * 1.3 + 0.4) +
          0.03 * Math.sin(7 * q - t * 1.7));
      const x = size / 2 + Math.cos(a) * r;
      const y = size / 2 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  const drawEdge = (a: P2, b: P2) => {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 106, 30, 0.16)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'rgba(255, 110, 30, 0.95)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffc995';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCorner = (p: P2) => {
    const r = 9 * (1 + p.z * 0.15);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, 'rgba(255, 244, 220, 1)');
    g.addColorStop(0.3, 'rgba(255, 170, 90, 0.8)');
    g.addColorStop(1, 'rgba(255, 90, 31, 0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawBlob = (t: number, ry: number) => {
    const c = size / 2;
    const R = size * 0.2;
    // Brillo exterior y relleno: centro rojo que se desplaza, bordes naranja y amarillo.
    ctx.save();
    ctx.shadowColor = 'rgba(255, 90, 31, 0.55)';
    ctx.shadowBlur = size * 0.09;
    blobPath(t, ry * 0.8);
    const ox = Math.sin(t * 0.6) * R * 0.18;
    const oy = Math.cos(t * 0.5) * R * 0.14;
    const g = ctx.createRadialGradient(c + ox, c + oy, 0, c, c, R * 1.18);
    g.addColorStop(0, '#c81e10');
    g.addColorStop(0.35, '#f0461a');
    g.addColorStop(0.58, '#ff7a1a');
    g.addColorStop(0.78, '#ffb52a');
    g.addColorStop(1, '#ffe05a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // Vetas de lava más oscura que se mueven por dentro.
    ctx.save();
    blobPath(t, ry * 0.8);
    ctx.clip();
    for (let i = 0; i < 2; i++) {
      const sx = c + Math.sin(t * (0.4 + i * 0.3) + i * 2) * R * 0.55;
      const sy = c + Math.cos(t * (0.35 + i * 0.25) + i) * R * 0.5;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.55);
      sg.addColorStop(0, 'rgba(150, 18, 8, 0.45)');
      sg.addColorStop(1, 'rgba(150, 18, 8, 0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.restore();
  };

  return {
    resize(next, nextDpr) {
      size = next;
      dpr = nextDpr;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    },
    render(rx, ry, time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      // En pantalla Y apunta hacia abajo (al revés que en WebGL): los giros sobre X y Z se invierten
      // para que arrastrar y seguir el cursor se sientan igual que en la versión WebGL.
      const project = projector(-rx, ry, -0.1);
      const pts = V.map((p) => project(p));
      const edges = EDGES.map(([a, b]) => ({ a: pts[a], b: pts[b], z: (pts[a].z + pts[b].z) / 2 }));
      // Aristas de atrás, luego la masa, luego las de adelante.
      edges.filter((e) => e.z < 0).forEach((e) => drawEdge(e.a, e.b));
      pts.filter((p) => p.z < 0).forEach(drawCorner);
      drawBlob(time, ry);
      edges.filter((e) => e.z >= 0).forEach((e) => drawEdge(e.a, e.b));
      pts.filter((p) => p.z >= 0).forEach(drawCorner);
    },
  };
}
