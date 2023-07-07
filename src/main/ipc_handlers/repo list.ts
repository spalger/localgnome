import * as Rx from "rxjs";
import { z } from "zod";

import { Handler } from "./types";

import { IpcMethods } from "shared/IpcMethods";

type Repo = z.infer<(typeof IpcMethods)["repo list"]["result"]>[0];

export const RepoList: Handler<"repo list"> = () => {
  const repos: Repo[] = [
    { name: "repo 1" },
    { name: "repo 2" },
    { name: "repo 3" },
    { name: "repo 4" },
    { name: "repo 5" },
    { name: "repo 6" },
    { name: "repo 7" },
    { name: "repo 8" },
    { name: "repo 9" },
    { name: "repo 10" },
    { name: "repo 11" },
    { name: "repo 12" },
  ];

  return Rx.of(repos);
};
