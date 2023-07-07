import { z } from "zod";
import * as Rx from "rxjs";

import type { IpcMethodMap } from "shared/IpcMethods";
import type { Config } from "main/config";

export type HandlerContext = {
  config: Config;
};

export type Handler<N extends keyof IpcMethodMap> = (
  ctx: HandlerContext,
  arg: z.infer<IpcMethodMap[N]["arg"]>
) => Rx.ObservableInput<z.infer<IpcMethodMap[N]["result"]>>;
