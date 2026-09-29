# Portafolio de Stiven Ruiz

**En vivo:** https://web-production-2f06e.up.railway.app

Portafolio que se mantiene solo. La mayoría de mis proyectos viven en repos privados, así que este sitio nunca ve su código: solo recibe datos ya revisados.

## Cómo funciona

```
Repos privados ──► portfolio-collector (GitHub Actions, privado)
                     ├─ Actividad: commits por día → src/data/activity.json   (sin IA, commit directo)
                     └─ Fichas: Claude Code lee cada repo con cambios →
                        src/data/projects/<slug>.json → Pull Request que yo apruebo
                                    │
                                    ▼
                   Este repo (Astro estático) ──► Railway (Caddy)
```

- **Dos niveles de lectura:** cada proyecto se explica para un reclutador (vista *General*) y para un equipo técnico (vista *Técnica*).
- **Mapa de actividad** tipo GitHub, pero en palabras ("Avance constante") y con el hito de cada semana, en lugar de conteos de commits.
- **El esquema es el filtro:** [`src/content.config.ts`](src/content.config.ts) valida cada ficha. Si la IA escribe algo fuera de contrato, el build falla y el PR no se puede aprobar.
- **Sin secretos:** el sitio es 100 % estático y no usa variables de entorno.

## Desarrollo

```bash
npm install
npm run dev
```

Stack: Astro, TypeScript, CSS sin frameworks, Caddy y Railway.
