import { z } from "zod";

function defineIpcMethods<
  K extends Record<string, { arg: z.Schema; result: z.Schema }>,
>(methods: K) {
  return methods;
}

export const IpcMethods = defineIpcMethods({
  counter: {
    arg: z.object({
      startFrom: z.number(),
    }),
    result: z.number(),
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
