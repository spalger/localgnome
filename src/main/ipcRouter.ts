import { ipcMain } from "electron";

import * as Rx from "rxjs";

import { toError } from "shared/errors";
import { IpcMethods, IpcMethodMap } from "shared/IpcMethods";
import type { HandlerContext } from "./ipc_handlers/types";

import { Handler } from "./ipc_handlers/types";
import { ConfigReadHandler, ConfigUpdateHandler } from "./ipc_handlers/config";
import { RepoListHandler } from "./ipc_handlers/repo list";
import { AppInfoHandler } from "./ipc_handlers/app";
import {
  RepoSwitchToMainHandler,
  RepoPullMainHandler,
  RepoSaveChangesHandler,
  RepoStashChangesHandler,
} from "./ipc_handlers/repo";

export async function initIpcRouter(ctx: HandlerContext) {
  const subscriptions = new Map<string, Rx.Subscription | null>();

  // setup each IPC route handler here
  setup("app:info", AppInfoHandler);
  setup("config:read", ConfigReadHandler);
  setup("config:update", ConfigUpdateHandler);
  setup("repo list", RepoListHandler);
  setup("repo:switchToMain", RepoSwitchToMainHandler);
  setup("repo:pullMain", RepoPullMainHandler);
  setup("repo:saveChanges", RepoSaveChangesHandler);
  setup("repo:stashChanges", RepoStashChangesHandler);

  // add the ability to unsubscribe from an IPC stream
  ipcMain.handle(`$:unsub`, (_, id) => {
    if (typeof id !== "string") {
      throw new Error(`invalid subscription id, expected a string, got ${id}`);
    }

    unsub(id);
  });

  return;

  // helper functions
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

  function setup<N extends keyof IpcMethodMap>(
    methodName: N,
    handler: Handler<N>
  ) {
    const schema = IpcMethods[methodName];
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
