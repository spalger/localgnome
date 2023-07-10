import * as Rx from "rxjs";

import { Handler } from "./types";

export const RepoListHandler: Handler<"repo list"> = ({ repos }) => {
  return Rx.concat(
    Rx.of(repos.getReposState()),
    repos.watch$().pipe(Rx.map(() => repos.getReposState()))
  );
};
