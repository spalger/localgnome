import { randomUUID } from "crypto";
import { ipcMain } from "electron";

import * as Rx from "rxjs";
import { z } from "zod";

import { IpcMethods, IpcMethodMap } from "shared/IpcMethods";
import { IpcHandlers } from "./ipc_handlers";
import { RpcObservableState } from "shared/RpcObservable";

function isValidIpcMethod(name: string): name is keyof IpcMethodMap {
  return !!(name in IpcMethods);
}

export async function initIpcRouter() {
  const subscriptions = new Map<string, Rx.Subscription | null>();

  ipcMain.handle(`$:unsub`, (_, id) => {
    if (typeof id !== "string") {
      throw new Error(`invalid subscription id, expected a string, got ${id}`);
    }

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
  });

  for (const [name, handler] of Object.entries(IpcHandlers)) {
    if (!isValidIpcMethod(name)) {
      throw new Error(`invalid ipc handler named ${name}`);
    }

    const schema = IpcMethods[name];

    ipcMain.handle(name, (event, param) => {
      const sender = event.sender;
      const arg = schema.arg.parse(param);
      const id = randomUUID();

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
            })
          )
          .subscribe({
            next: (value) => {
              sender.send(`$:${id}`, {
                type: "next",
                value: value,
              } satisfies RpcObservableState<z.infer<typeof schema.result>>);
            },
            error: (error) => {
              sender.send(`$:${id}`, {
                type: "error",
                error,
              } satisfies RpcObservableState<z.infer<typeof schema.result>>);
            },
            complete: () => {
              sender.send(`$:${id}`, {
                type: "complete",
              } satisfies RpcObservableState<z.infer<typeof schema.result>>);
            },
          })
      );

      return id;
    });
  }
}
