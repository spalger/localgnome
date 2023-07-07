import { IpcMethodMap } from "shared/IpcMethods";

import { Handler } from "./types";
import { Counter } from "./counter";

export const IpcHandlers: {
  [K in keyof IpcMethodMap]: Handler<K>;
} = {
  counter: Counter,
};
