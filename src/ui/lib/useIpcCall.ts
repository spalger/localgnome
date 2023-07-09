import React from "react";

import { toError } from "shared/errors";
import type { IpcMethodMap } from "shared/IpcMethods";
import { ipcCall } from "./ipc";

interface CallState<R extends Zod.Schema> {
  loading: boolean;
  data?: Zod.infer<R>;
  error?: Error;
}

export function useIpcCall<
  N extends keyof IpcMethodMap,
  A extends Zod.Schema = IpcMethodMap[N]["arg"],
  R extends Zod.Schema = IpcMethodMap[N]["result"]
>(methodName: N): [CallState<R>, (arg: Zod.infer<A>) => void] {
  const [state, setState] = React.useState<CallState<R>>({ loading: false });

  const call = React.useCallback(
    (arg: Zod.infer<A>) => {
      setState({ loading: true });

      ipcCall(methodName, arg)
        .then((data) => {
          setState({ loading: false, data });
        })
        .catch((error) => {
          setState({ loading: false, error: toError(error) });
        });
    },
    [methodName]
  );

  return [state, call];
}
