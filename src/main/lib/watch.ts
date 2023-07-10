import Fsp from "fs/promises";
import Path from "path";

import * as Rx from "rxjs";

export function watch$(
  path: string,
  opts?: { recursive?: boolean }
): Rx.Observable<Fsp.FileChangeInfo<string>> {
  return new Rx.Observable<Fsp.FileChangeInfo<string>>((subscriber) => {
    const abt = new AbortController();

    subscriber.add(() => {
      abt.abort();
    });

    return Rx.from(Fsp.watch(path, { ...opts, signal: abt.signal }))
      .pipe(
        // if the path doesn't exist then watch will throw an ENOENT, so we catch this
        // and watch the parent instead, waiting for it to indicate that the path exists
        // and then retry the `watch$(path)`
        Rx.catchError((error) => {
          if (error.code !== "ENOENT") {
            throw error;
          }

          const parent = Path.dirname(path);
          const filename = Path.basename(path);
          if (parent === path) {
            throw error;
          }

          return watch$(parent, { recursive: false }).pipe(
            Rx.first((e) => e.filename === filename),
            Rx.mergeMap(() => watch$(path, opts))
          );
        })
      )
      .subscribe(subscriber);
  });
}
