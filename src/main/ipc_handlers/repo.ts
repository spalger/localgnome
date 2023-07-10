import * as Rx from "rxjs";

import { Handler } from "./types";

export const RepoSwitchToMainHandler: Handler<"repo:switchToMain"> = (
  { repos },
  repoName
) => {
  const repo = repos.get(repoName);
  if (!repo) {
    return Rx.of({
      type: "error",
      error: "Repo not found",
    });
  }

  return Rx.defer(() => repo.switchToMain()).pipe(
    Rx.map(() => ({
      type: "success",
    }))
  );
};

export const RepoPullMainHandler: Handler<"repo:pullMain"> = (
  { repos },
  repoName
) => {
  const repo = repos.get(repoName);
  if (!repo) {
    return Rx.of({
      type: "error",
      error: "Repo not found",
    });
  }

  return Rx.defer(() => repo.pullMain()).pipe(
    Rx.map(() => ({
      type: "success",
    }))
  );
};
