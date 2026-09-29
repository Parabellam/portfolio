import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Este esquema es el contrato con el collector: si la IA escribe un JSON
// que no cumple, el build falla y el PR no se puede aprobar.

export const CATEGORIES = [
  'Automatización e IA',
  'Bots y comunidades',
  'Infraestructura y DevOps',
  'Seguridad',
  'Herramientas para desarrolladores',
  'E-commerce',
  'Web y apps',
] as const;

const dual = z.object({
  general: z.string().min(1),
  tecnica: z.string().min(1),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/projects' }),
  schema: z.object({
    name: z.string(),
    order: z.number().default(100),
    featured: z.boolean().default(false),
    category: z.enum(CATEGORIES),
    status: z.enum(['En producción', 'En desarrollo', 'Prototipo']),
    source: z.enum(['Personal', 'GG Forge']),
    pitch: dual,
    problem: dual,
    solution: dual,
    result: dual,
    role: z.string(),
    highlights: z.array(dual).min(1),
    skills: z.array(z.string()),
    stack: z.array(z.string()),
    components: z
      .array(z.object({ name: z.string(), general: z.string(), tecnica: z.string() }))
      .default([]),
    milestones: z
      .array(z.object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), text: z.string() }))
      .default([]),
    demo: z
      .object({ url: z.url(), label: z.string().default('Probar demo') })
      .optional(),
  }),
});

export const collections = { projects };
