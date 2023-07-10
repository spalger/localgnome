import * as Rx from "rxjs";

import { Handler } from "./types";
import type {
  IpcMethodMap,
  IpcMethodResult,
  IpcMethodArg,
} from "shared/IpcMethods";
import { Repo } from "main/repos";

function operateOnRepo<N extends keyof IpcMethodMap & `repo:${string}`>(
  op: (
    repo: Repo,
    arg: IpcMethodArg<N>
  ) => Rx.ObservableInput<IpcMethodResult<N>>
): Handler<N> {
  return (ctx, arg) => {
    const repo = ctx.repos.get(arg.repoName);
    if (!repo) {
      return Rx.of({
        type: "error",
        error: "Repo not found",
      });
    }

    return Rx.defer(() => op(repo, arg));
  };
}

export const RepoSwitchToMainHandler = operateOnRepo<"repo:switchToMain">(
  (repo) => {
    return Rx.defer(() => repo.switchToMain()).pipe(
      Rx.map(() => ({
        type: "success",
      }))
    );
  }
);

export const RepoPullMainHandler = operateOnRepo<"repo:pullMain">((repo) => {
  return Rx.defer(() => repo.pullMain()).pipe(
    Rx.map(() => ({
      type: "success",
    }))
  );
});

export const RepoSaveChangesHandler = operateOnRepo<"repo:saveChanges">(
  (repo) => {
    return Rx.defer(() => repo.saveChanges()).pipe(
      Rx.map(() => ({
        type: "success",
      }))
    );
  }
);

export const RepoStashChangesHandler = operateOnRepo<"repo:stashChanges">(
  (repo) => {
    return Rx.defer(() => repo.stashChanges()).pipe(
      Rx.map(() => ({
        type: "success",
      }))
    );
  }
);
