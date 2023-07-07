import * as Rx from "rxjs";

import { Handler } from "./types";

export const Counter: Handler<"counter"> = ({ startFrom }) =>
  Rx.interval(1000).pipe(Rx.map((i) => startFrom + i));
