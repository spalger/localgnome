import * as Rx from "rxjs";

import { Handler } from "./types";

export const Counter: Handler<"counter"> = ({ startFrom }) =>
  Rx.timer(0, 1000).pipe(Rx.map((i) => startFrom + i));
