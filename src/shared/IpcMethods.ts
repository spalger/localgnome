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
    result: z.union([
      z.object({
        type: z.literal("error"),
        error: z.string(),
      }),
      z.object({
        type: z.literal("valid"),
        repos: z.array(
          z.object({
            path: z.string(),
            name: z.string(),
            error: z.string().optional(),
            currentBranch: z.string().optional(),
            upstreamRemoteName: z.string().optional(),
            commitsBehindUpstream: z.number().optional(),
            gitStatus: z
              .object({
                changedFiles: z.number(),
                conflicts: z.number(),
              })
              .optional(),
          })
        ),
      }),
    ]),
  },
  "config:read": {
    arg: z.undefined(),
    result: ConfigSchema,
  },
  "config:update": {
    arg: ConfigSchema.partial(),
    result: ConfigSchema,
  },
  "repo:switchToMain": {
    arg: z.object({
      repoName: z.string(),
    }),
    result: z.union([
      z.object({
        type: z.literal("error"),
        error: z.string(),
      }),
      z.object({
        type: z.literal("success"),
      }),
    ]),
  },
  "repo:pullMain": {
    arg: z.object({
      repoName: z.string(),
    }),
    result: z.union([
      z.object({
        type: z.literal("error"),
        error: z.string(),
      }),
      z.object({
        type: z.literal("success"),
      }),
    ]),
  },
  "repo:saveChanges": {
    arg: z.object({
      repoName: z.string(),
    }),
    result: z.union([
      z.object({
        type: z.literal("error"),
        error: z.string(),
      }),
      z.object({
        type: z.literal("success"),
      }),
    ]),
  },
  "repo:stashChanges": {
    arg: z.object({
      repoName: z.string(),
    }),
    result: z.union([
      z.object({
        type: z.literal("error"),
        error: z.string(),
      }),
      z.object({
        type: z.literal("success"),
      }),
    ]),
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
