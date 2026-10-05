// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Las fuentes se descargan al compilar y se sirven desde el propio sitio: sin viaje extra a
  // Google Fonts antes de pintar la página.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-sans',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // Google ya no lo publica con este nombre; Fontsource conserva la versión Display.
      provider: fontProviders.fontsource(),
      name: 'Big Shoulders Display',
      cssVariable: '--font-display',
      weights: [800, 900],
      styles: ['normal'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  build: {
    // El CSS es pequeño: va dentro del HTML y no bloquea el primer pintado con otra petición.
    inlineStylesheets: 'always',
  },
  security: {
    // Política de contenido con hashes de cada script y estilo que genera Astro.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // Umami (estadísticas de visitas): el script se carga de cloud y envía a gateway.
        "connect-src 'self' https://gateway.umami.is",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "require-trusted-types-for 'script'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://cloud.umami.is'],
      },
    },
  },
  vite: {
    // El repo es público: publicar los mapas de origen no expone nada nuevo y ayuda a depurar.
    build: { sourcemap: true },
  },
});
