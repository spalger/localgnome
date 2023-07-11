import { ipcMain } from "electron";

import * as Rx from "rxjs";

import { toError } from "shared/errors";
import { IpcMethods, IpcMethodNames, IpcMethodMap } from "shared/IpcMethods";
import type { HandlerContext } from "./ipc_handlers/types";

import { IpcHandlers } from "./ipc_handlers";

export async function initIpcRouter(ctx: HandlerContext) {
  const subscriptions = new Map<string, Rx.Subscription | null>();

  // add the ability to unsubscribe from an IPC stream
  ipcMain.handle(`$:unsub`, (_, id) => {
    subscriptions.get(id)?.unsubscribe();
    subscriptions.delete(id);
  });

  IpcMethodNames.forEach(<N extends keyof IpcMethodMap>(methodName: N) => {
    const schema = IpcMethods[methodName];
    const handler = IpcHandlers[methodName];

    ipcMain.handle(methodName, (event, param, id) => {
      const sender = event.sender;
      const arg = schema.arg.parse(param);

      if (subscriptions.get(id)) {
        throw new Error("unable to reuse request uuid");
      }

      subscriptions.set(
        id,
        Rx.defer(() => handler(ctx, arg))
          .pipe(
            Rx.map((value): any => {
              try {
                return schema.result.parse(value);
              } catch (error) {
                console.error("invalid IPC route return value", error);
                process.exit(1);
              }
            }),
            Rx.materialize(),
            Rx.map((notif) => {
              if (notif.kind === "E") {
                const e = toError(notif.error);
                return {
                  ...notif,
                  error: {
                    message: e.message,
                    name: e.name,
                    stack: e.stack,
                  },
                };
              }

              return notif;
            })
          )
          .subscribe((value) => {
            if (sender.isDestroyed() && subscriptions.has(id)) {
              subscriptions.get(id)?.unsubscribe();
              subscriptions.delete(id);
            } else {
              sender.send(`$:${id}`, value);
            }
          })
      );
    });
  });

  return;
}
