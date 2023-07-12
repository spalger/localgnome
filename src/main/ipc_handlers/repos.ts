import * as Rx from "rxjs";

import { Handler } from "./types";

export const ReposListHandler: Handler<"repos:list"> = ({ repos }) => {
  return Rx.concat(
    Rx.of(repos.getReposState()),
    repos.watch$().pipe(Rx.map(() => repos.getReposState()))
  );
};

export const ReposRefreshHandler: Handler<"repos:refresh"> = (
  { repos },
  arg
) => {
  return Rx.from(arg.repoNames.map((name) => repos.get(name))).pipe(
    Rx.mergeMap(async (repo) => {
      await repo?.refresh();
    }),
    Rx.last(),
    Rx.map(() => ({
      type: "success",
    }))
  );
};
