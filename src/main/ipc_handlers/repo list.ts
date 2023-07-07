import Fs from "fs";

import * as Rx from "rxjs";
import { z } from "zod";

import { toError } from "shared/errors";
import { Handler } from "./types";

import { IpcMethods } from "shared/IpcMethods";

const dirEnts$ = Rx.bindNodeCallback(Fs.readdir);

type State = z.infer<(typeof IpcMethods)["repo list"]["result"]>;

export const RepoList: Handler<"repo list"> = ({ config }) => {
  return config.get$("reposDir").pipe(
    Rx.mergeMap((reposDir) => {
      if (!reposDir) {
        return Rx.of({
          scanning: false,
          error: "Please define the location of your metronome repos",
        });
      }

      return Rx.concat(
        Rx.of(<State>{
          scanning: true,
        }),
        dirEnts$(reposDir, { withFileTypes: true }).pipe(
          Rx.map(
            (dirEnts): State => ({
              scanning: false,
              repoNames: dirEnts
                .filter((ent) => ent.isDirectory())
                .map((ent) => ent.name),
            })
          ),
          Rx.catchError((error) =>
            Rx.of(<State>{
              scanning: false,
              error: toError(error).message,
            })
          )
        )
      );
    })
  );
};
