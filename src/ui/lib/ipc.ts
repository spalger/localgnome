import { ipcRenderer } from "electron";

import { v4 as uuid } from "uuid";
import { z } from "zod";
import * as Rx from "rxjs";

import { IpcMethods } from "shared/IpcMethods";
import { RemoteObsNotif, toRxjsNotif } from "shared/RxjsNotification";

export function ipc<N extends keyof typeof IpcMethods>(
  method: N,
  arg: z.infer<(typeof IpcMethods)[N]["arg"]>
) {
  const schema = IpcMethods[method];

  return Rx.defer(() => {
    const reqId = uuid();

    return new Rx.Observable<z.infer<(typeof IpcMethods)[N]["result"]>>(
      (subscriber) => {
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
              Rx.map((notif) => toRxjsNotif(notif, schema.result)),
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
      }
    );
  });
}
