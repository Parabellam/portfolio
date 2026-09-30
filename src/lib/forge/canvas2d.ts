// Respaldo en Canvas 2D para navegadores sin WebGL con GPU (escritorios remotos, equipos sin
// aceleración gráfica). Sin GPU cada cuadro cuesta mucho, así que se dibuja en un Worker cuando
// el navegador lo permite; si no, en la página como antes.
import { createDrawer2D } from './draw2d';
import type { ForgeRenderer } from './types';
import workerUrl from './worker2d.ts?worker&url';

const dprNow = () => Math.min(window.devicePixelRatio || 1, 2);

// La política de seguridad exige Trusted Types para crear un Worker; esta política solo acepta
// el archivo del propio Worker.
let workerPolicy: { createScriptURL(url: string): unknown } | null | undefined;
function trustedWorkerUrl(): string {
  const tt = (window as unknown as { trustedTypes?: { createPolicy: Function } }).trustedTypes;
  if (!tt) return workerUrl;
  workerPolicy ??= tt.createPolicy('forge-worker', {
    createScriptURL: (url: string) => {
      if (url !== workerUrl) throw new TypeError('Worker no permitido');
      return url;
    },
  });
  return workerPolicy!.createScriptURL(workerUrl) as string;
}

function inPage(host: HTMLElement): ForgeRenderer {
  const canvas = document.createElement('canvas');
  host.replaceChildren(canvas);
  const drawer = createDrawer2D(canvas);
  return { kind: '2d', resize: (size) => drawer.resize(size, dprNow()), render: drawer.render };
}

function inWorker(host: HTMLElement): ForgeRenderer | null {
  if (typeof OffscreenCanvas === 'undefined' || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) {
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker(trustedWorkerUrl(), { type: 'module' });
    host.replaceChildren(canvas);
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

    // Si el Worker no arranca, se sigue dibujando en la página con un canvas nuevo.
    let current: ForgeRenderer | null = null;
    let lastSize = 0;
    worker.onerror = () => {
      worker.terminate();
      current = inPage(host);
      if (lastSize) current.resize(lastSize);
    };
    return {
      kind: '2d',
      resize(size) {
        lastSize = size;
        if (current) current.resize(size);
        else worker.postMessage({ type: 'resize', size, dpr: dprNow() });
      },
      render(rx, ry, time) {
        if (current) current.render(rx, ry, time);
        else worker.postMessage({ type: 'render', rx, ry, time });
      },
    };
  } catch {
    return null;
  }
}

export function createCanvasRenderer(host: HTMLElement): ForgeRenderer {
  return inWorker(host) ?? inPage(host);
}
