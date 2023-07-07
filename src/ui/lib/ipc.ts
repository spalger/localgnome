import { ipcRenderer } from "electron";

import { v4 as uuid } from "uuid";
import { z } from "zod";
import * as Rx from "rxjs";

import { IpcMethods } from "shared/IpcMethods";
import { RpcObservableSchema } from "shared/RpcObservable";

export function ipc<N extends keyof typeof IpcMethods>(
  method: N,
  arg: z.infer<(typeof IpcMethods)[N]["arg"]>,
) {
  const schema = IpcMethods[method];

  return Rx.defer(() => {
    const reqId = uuid();

    const remoteState$ = Rx.fromEvent(ipcRenderer, `$:${reqId}`).pipe(
      Rx.map((args) => {
        if (!Array.isArray(args)) {
          throw new Error(
            "ipcRenderer.on passes handlers received multiple arguments",
          );
        }

        // "0" is the "event" object, "1" is the observable state
        return RpcObservableSchema.parse(args[1]);
      }),
    );

    const localState$ = remoteState$.pipe(
      Rx.map(
        (state): Rx.ObservableNotification<z.infer<typeof schema.result>> => {
          switch (state.type) {
            case "complete":
              return {
                kind: "C",
              };
            case "error":
              return {
                kind: "E",
                error: state.error,
              };
            case "next":
              return {
                kind: "N",
                value: schema.result.parse(state.value),
              };
          }
        },
      ),
      Rx.dematerialize(),
    );

    const init$ = Rx.defer(async () => {
      await ipcRenderer.invoke(method, arg, reqId);
    }).pipe(Rx.ignoreElements());

    return Rx.merge(localState$, init$).pipe(
      Rx.tap({
        complete() {
          ipcRenderer.invoke(`$:unsub`, reqId);
        },
      }),
    );
  });
}
