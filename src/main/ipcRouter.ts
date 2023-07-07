import { ipcMain } from "electron";

import * as Rx from "rxjs";

import { toError } from "shared/errors";
import { IpcMethods, IpcMethodMap } from "shared/IpcMethods";
import { IpcHandlers } from "./ipc_handlers";

function isValidIpcMethod(name: string): name is keyof IpcMethodMap {
  return !!(name in IpcMethods);
}

export async function initIpcRouter() {
  const subscriptions = new Map<string, Rx.Subscription | null>();

  function unsub(id: string) {
    const subscription = subscriptions.get(id);
    if (subscription === null) {
      return;
    }
    if (!subscription) {
      throw new Error(
        `unknown subscription, unable to unsubscribe from id ${id}`
      );
    }

    subscription.unsubscribe();
    subscriptions.set(id, null);
  }

  ipcMain.handle(`$:unsub`, (_, id) => {
    if (typeof id !== "string") {
      throw new Error(`invalid subscription id, expected a string, got ${id}`);
    }

    unsub(id);
  });

  for (const [name, handler] of Object.entries(IpcHandlers)) {
    if (!isValidIpcMethod(name)) {
      throw new Error(`invalid ipc handler named ${name}`);
    }

    const schema = IpcMethods[name];
    ipcMain.handle(name, (event, param, id) => {
      const sender = event.sender;
      const arg = schema.arg.parse(param);

      if (subscriptions.get(id)) {
        throw new Error("unable to reuse request uuid");
      }

      subscriptions.set(
        id,
        Rx.defer(() => handler(arg))
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
              unsub(id);
            } else {
              sender.send(`$:${id}`, value);
            }
          })
      );

      return id;
    });
  }
}
