import { contextBridge } from "electron";

import { localGnome } from "./bridge";

contextBridge.exposeInMainWorld("localGnome", localGnome);
