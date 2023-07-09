import { z } from "zod";

export const ConfigSchema = z.object({
  reposDir: z.string().optional(),
});

export type ParsedConfig = z.infer<typeof ConfigSchema>;
