import { app } from "electron";
import * as Rx from "rxjs";

import { Handler } from "./types";

export const AppInfoHandler: Handler<"app:info"> = () => {
  return Rx.of({
    version: app.getVersion(),
    distributable: app.isPackaged,
  });
};
