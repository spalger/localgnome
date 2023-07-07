import { z } from "zod";
import * as Rx from "rxjs";

import type { IpcMethodMap } from "shared/IpcMethods";

export type Handler<N extends keyof IpcMethodMap> = (
  arg: z.infer<IpcMethodMap[N]["arg"]>,
) => Rx.ObservableInput<z.infer<IpcMethodMap[N]["result"]>>;
