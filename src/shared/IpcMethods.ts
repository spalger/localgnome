import { z } from "zod";
import { ConfigSchema } from "./configSchema";

function defineIpcMethods<
  K extends Record<string, { arg: z.Schema; result: z.Schema }>
>(methods: K) {
  return methods;
}

export const IpcMethods = defineIpcMethods({
  "repo list": {
    arg: z.undefined(),
    result: z.object({
      scanning: z.boolean(),
      error: z.string().optional(),
      repos: z
        .array(
          z.object({
            path: z.string(),
            name: z.string(),
            error: z.string().optional(),
            currentBranch: z.string().optional(),
            upstreamRemoteName: z.string().optional(),
            commitsBehindUpstream: z.number().optional(),
          })
        )
        .optional(),
    }),
  },
  "config:read": {
    arg: z.undefined(),
    result: ConfigSchema,
  },
  "config:update": {
    arg: ConfigSchema.partial(),
    result: ConfigSchema,
  },
});

export type IpcMethodMap = typeof IpcMethods;
export type IpcMethodName = keyof IpcMethodMap;
export type IpcMethodArg<N extends IpcMethodName> = z.infer<
  IpcMethodMap[N]["arg"]
>;
export type IpcMethodResult<N extends IpcMethodName> = z.infer<
  IpcMethodMap[N]["result"]
>;
