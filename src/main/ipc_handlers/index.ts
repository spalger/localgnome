import { IpcMethodMap } from "shared/IpcMethods";

import { Handler } from "./types";
import { RepoList } from "./repo list";

export const IpcHandlers: {
  [K in keyof IpcMethodMap]: Handler<K>;
} = {
  "repo list": RepoList,
};
