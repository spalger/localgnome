import Path from "path";
import Fs from "fs";

import * as Rx from "rxjs";

import { IpcMethodResult } from "shared/IpcMethods";
import { watch$ } from "main/lib/watch";
import { Config } from "main/config";
import { Repo } from "./Repo";

const readdir$ = Rx.bindNodeCallback(Fs.readdir);
type RepoMap = Map<string, Repo>;
type ReposState = IpcMethodResult<"repo list">;
type InternalRepoState =
  | { type: "error"; error: string }
  | { type: "valid"; repos: RepoMap };

export class RepoCollection {
  private readonly state$ = new Rx.BehaviorSubject<InternalRepoState>({
    type: "valid",
    repos: new Map(),
  });
  private readonly sub: Rx.Subscription;

  constructor(config: Config) {
    this.sub = config
      .get$("reposDir")
      .pipe(
        Rx.switchScan(
          (
            prev: InternalRepoState,
            reposDir
          ): Rx.Observable<InternalRepoState> => {
            if (!reposDir) {
              if (prev.type === "valid") {
                for (const repo of prev.repos.values()) {
                  repo.close();
                }
              }

              return Rx.of({
                type: "error",
                error: "No reposDir configured",
              });
            }

            return watch$(reposDir, { recursive: false }).pipe(
              Rx.startWith(undefined),
              Rx.switchScan((prev): Rx.Observable<InternalRepoState> => {
                const prevRepos = "repos" in prev ? prev.repos : undefined;
                const repos = new Map<string, Repo>();

                return readdir$(reposDir, { withFileTypes: true }).pipe(
                  Rx.catchError((error) => {
                    if (error.code === "ENOENT") {
                      const empty: InternalRepoState = {
                        type: "valid",
                        repos: new Map(),
                      };
                      return Rx.of(empty);
                    }

                    throw error;
                  }),
                  Rx.map((dirEntsOrState) => {
                    if (!Array.isArray(dirEntsOrState)) {
                      return dirEntsOrState;
                    }

                    for (const ent of dirEntsOrState) {
                      if (!ent.isDirectory()) {
                        continue;
                      }

                      const path = Path.resolve(reposDir, ent.name);
                      const existing = prevRepos?.get(path);
                      if (existing) {
                        repos.set(path, existing);
                      } else {
                        repos.set(path, new Repo(path, ent.name));
                      }
                    }

                    if (prevRepos) {
                      for (const repo of prevRepos.values()) {
                        if (!repos.has(repo.path)) {
                          repo.close();
                        }
                      }
                    }

                    return {
                      type: "valid",
                      repos,
                    };
                  })
                );
              }, prev)
            );
          },
          { type: "valid", repos: new Map() }
        )
      )
      .subscribe(this.state$);
  }

  getReposState(): ReposState {
    const internal = this.state$.getValue();
    if ("error" in internal) {
      return {
        error: internal.error,
      };
    }

    return {
      repos: Array.from(internal.repos.values()).map((repo) =>
        repo.getSnapshot()
      ),
    };
  }

  watch$() {
    return Rx.merge(
      this.state$,
      this.state$.pipe(
        Rx.mergeMap((state) =>
          "error" in state ? [] : Array.from(state.repos.values())
        ),
        Rx.distinct(),
        Rx.mergeMap((repo) => repo.watch$())
      )
    ).pipe(Rx.map(() => this));
  }

  close() {
    this.sub.unsubscribe();
    this.state$.complete();
  }
}
