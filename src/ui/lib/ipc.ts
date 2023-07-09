import { ipcRenderer } from "electron";

import { v4 as uuid } from "uuid";
import { z } from "zod";
import * as Rx from "rxjs";

import { IpcMethods } from "shared/IpcMethods";
import { RemoteObsNotif, toRxjsNotif } from "shared/RxjsNotification";

const EMPTY = Symbol("EMPTY");

export async function ipcFirst<N extends keyof typeof IpcMethods>(
  method: N,
  arg: z.infer<(typeof IpcMethods)[N]["arg"]>
) {
  console.log("getting first value from ipc method", method, "using arg", arg);
  const first = await Rx.lastValueFrom(
    ipcSub(method, arg).pipe(Rx.take(1), Rx.defaultIfEmpty(EMPTY))
  );

  if (first === EMPTY) {
    throw new Error(
      `method "${method}" never produced a value, so ipcFirst() has nothing to return`
    );
  }

  return first;
}

export async function ipcCall<N extends keyof typeof IpcMethods>(
  method: N,
  arg: z.infer<(typeof IpcMethods)[N]["arg"]>
) {
  return await Rx.lastValueFrom(ipcSub(method, arg).pipe(Rx.toArray()));
}

export function ipcSub<
  N extends keyof typeof IpcMethods,
  R extends z.Schema = (typeof IpcMethods)[N]["result"],
  A extends z.Schema = (typeof IpcMethods)[N]["arg"]
>(method: N, arg: z.infer<A>) {
  const resultSchema = IpcMethods[method].result as unknown as R;

  return Rx.defer(() => {
    const reqId = uuid();

    return new Rx.Observable<z.infer<R>>((subscriber) => {
      // subscribe to the events for this req id which will
      // be turned into notifications which we reflect to
      // the subscriber
      subscriber.add(
        Rx.fromEvent(ipcRenderer, `$:${reqId}`)
          .pipe(
            Rx.map((args) => {
              if (!Array.isArray(args)) {
                throw new Error(
                  "ipcRenderer.on passes handlers received multiple arguments"
                );
              }

              // "0" is the "event" object, "1" is the observable state
              return RemoteObsNotif.parse(args[1]);
            }),
            Rx.map((notif) => toRxjsNotif(notif, resultSchema)),
            Rx.dematerialize()
          )
          .subscribe(subscriber)
      );

      // send an unsub request once the observable is cleaned up for
      // whatever reason
      subscriber.add(() => {
        void ipcRenderer.invoke(`$:unsub`, reqId);
      });

      // invoke the remote method
      ipcRenderer.invoke(method, arg, reqId).catch((error) => {
        subscriber.error(
          new Error(`failed to initialize ipc observable: ${error.message}`)
        );
      });
    });
  });
}
