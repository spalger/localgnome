import { IpcMethodMap } from "shared/IpcMethods";

import { Handler } from "./types";
import { RepoList } from "./repo list";
import { configRead, configUpdate } from "./config";

export const IpcHandlers: {
  [K in keyof IpcMethodMap]: Handler<K>;
} = {
  "repo list": RepoList,
  "config:read": configRead,
  "config:update": configUpdate,
};
