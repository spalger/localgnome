import Fs from "fs";
import Path from "path";

import * as Rx from "rxjs";
import { z } from "zod";
import simpleGit, { SimpleGit } from "simple-git";

import { toError } from "shared/errors";
import { IpcMethods } from "shared/IpcMethods";

import { Handler } from "./types";

const dirEnts$ = Rx.bindNodeCallback(Fs.readdir);

type State = z.infer<(typeof IpcMethods)["repo list"]["result"]>;
type RepoState = NonNullable<State["repos"]>[number];

function getCurrentBranch(git: SimpleGit): Rx.Observable<string | undefined> {
  return Rx.defer(async () => {
    const branches = await git.branchLocal();
    return branches.current;
  });
}

function getUpstreamRemoteName(
  git: SimpleGit
): Rx.Observable<string | undefined> {
  return Rx.defer(async () => {
    const remotes = await git.getRemotes(true);
    return remotes.some((remote) => remote.name === "upstream")
      ? "upstream"
      : "origin";
  });
}

function getCommitsBehindUpstream(
  git: SimpleGit,
  upstreamRemote$: Rx.Observable<string | undefined>
): Rx.Observable<number | undefined> {
  return upstreamRemote$.pipe(
    Rx.mergeMap(async (upstreamRemote) => {
      if (!upstreamRemote) {
        return undefined;
      }

      await git.fetch(upstreamRemote, "main");
      const output = await git.raw([
        "rev-list",
        "--count",
        `HEAD...${upstreamRemote}/main`,
      ]);

      return parseInt(output.trim(), 10);
    })
  );
}

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
          Rx.mergeMap((dirEnts) => {
            return Rx.combineLatest(
              dirEnts
                .filter((dir) => dir.isDirectory())
                .map((dirEnt): Rx.Observable<RepoState> => {
                  const repoDir = Path.join(reposDir, dirEnt.name);
                  const git = simpleGit(repoDir);

                  const upstreamRemote$ = getUpstreamRemoteName(git).pipe(
                    Rx.shareReplay()
                  );

                  return Rx.combineLatest([
                    getCurrentBranch(git),
                    upstreamRemote$,
                    getCommitsBehindUpstream(git, upstreamRemote$),
                  ]).pipe(
                    Rx.map(
                      ([
                        currentBranch,
                        upstreamRemoteName,
                        commitsBehindUpstream,
                      ]): RepoState => ({
                        path: repoDir,
                        name: dirEnt.name,
                        currentBranch,
                        upstreamRemoteName,
                        commitsBehindUpstream,
                      })
                    )
                  );
                })
            );
          }),
          Rx.map(
            (repos): State => ({
              scanning: false,
              repos,
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
