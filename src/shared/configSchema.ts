import { z } from "zod";

export const ConfigSchema = z.object({
  reposDir: z.string().optional(),
  windowBounds: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional(),
});

export type ParsedConfig = z.infer<typeof ConfigSchema>;
