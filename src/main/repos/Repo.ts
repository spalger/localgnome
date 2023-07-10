import Path from "path";

import * as Rx from "rxjs";
import simpleGit, { SimpleGit } from "simple-git";

import { watch$ } from "main/lib/watch";
import { toError } from "shared/errors";

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export interface RepoSnapshot {
  name: string;
  path: string;
  error?: string;
  currentBranch?: string;
  upstreamRemoteName?: string;
  commitsBehindUpstream?: number;
  gitStatus?: {
    changedFiles: number;
    conflicts: number;
  };
}

export class Repo {
  private readonly state$: Rx.BehaviorSubject<RepoSnapshot>;
  private readonly git: SimpleGit;
  private readonly sub: Rx.Subscription;
  private readonly refresh$: Rx.Subject<void>;
  private readonly pulledMain$: Rx.Subject<void>;
  public readonly path: string;

  constructor(reposDir: string, public readonly name: string) {
    this.path = Path.resolve(reposDir, name);
    this.state$ = new Rx.BehaviorSubject({
      name,
      path: this.path,
    });

    this.git = simpleGit(this.path, { maxConcurrentProcesses: 1 });
    this.refresh$ = new Rx.Subject();
    this.pulledMain$ = new Rx.Subject();

    const headChange$ = watch$(Path.resolve(this.path, ".git/HEAD")).pipe(
      Rx.share()
    );
    const remotesChange$ = watch$(
      Path.resolve(this.path, ".git/refs/remotes"),
      {
        recursive: true,
      }
    ).pipe(Rx.share());

    const currentBranch$ = Rx.merge(this.refresh$, headChange$).pipe(
      Rx.startWith(undefined),
      Rx.switchMap(() => Rx.from(this.git.branchLocal())),
      Rx.map((branch) => branch.current),
      Rx.shareReplay(1)
    );

    const upstreamRemoteName$ = Rx.merge(this.refresh$, remotesChange$).pipe(
      Rx.startWith(undefined),
      Rx.switchMap(() => Rx.from(this.git.getRemotes())),
      Rx.map((remotes) =>
        remotes.some((remote) => remote.name === "upstream")
          ? "upstream"
          : "origin"
      ),
      Rx.shareReplay(1)
    );

    const commitsBehindUpstream$ = Rx.merge(
      // clear the current value when main is pulled
      this.pulledMain$.pipe(Rx.map(() => 0)),

      Rx.combineLatest([
        currentBranch$,
        upstreamRemoteName$,
        Rx.merge(
          this.refresh$,
          this.pulledMain$,
          headChange$,
          remotesChange$,
          // refresh at some point between 30 minutes and 1 hour, then hourly after that. This
          // prevents us from refreshing all repos at the same time, but should keep them
          // roughly up-to-date with the remote repos.
          Rx.timer(random(30 * MINUTE, 1 * HOUR), 1 * HOUR)
        ).pipe(Rx.startWith(undefined)),
      ]).pipe(
        Rx.debounceTime(1000),
        Rx.switchMap(([currentBranch, upstreamRemoteName]) => {
          if (!currentBranch || !upstreamRemoteName) {
            return Rx.of(undefined);
          }

          return Rx.defer(async () => {
            try {
              await this.git.fetch(upstreamRemoteName, "main");
              return parseInt(
                (
                  await this.git.raw([
                    "rev-list",
                    "--count",
                    `HEAD...${upstreamRemoteName}/main`,
                  ])
                ).trim(),
                10
              );
            } catch (_) {
              const error = toError(_);
              if (
                error.message.includes("Permission denied") &&
                error.message.includes("Could not read from remote repository")
              ) {
                console.error(
                  `full error when fetching latest changes from ${upstreamRemoteName}/main`,
                  error.message
                );

                return new Error(
                  `Unable to fetch latest changes from ${upstreamRemoteName}/main. Please check your SSH keys/agent.`
                );
              }

              throw error;
            }
          });
        })
      )
    );

    const status$ = Rx.merge(
      this.refresh$,
      this.pulledMain$,
      currentBranch$,
      Rx.timer(0, MINUTE),
      watch$(this.path, { recursive: true }).pipe(Rx.debounceTime(1000))
    ).pipe(
      Rx.switchMap(
        async (): Promise<NonNullable<RepoSnapshot["gitStatus"]>> => {
          const status = await this.git.status();
          return {
            conflicts: status.conflicted.length,
            changedFiles: status.files.length,
          };
        }
      )
    );

    const tapSetter = (property: keyof RepoSnapshot) => {
      return Rx.tap((value: any) => {
        const snapshot = this.state$.getValue();
        this.state$.next({
          ...snapshot,
          [property]: value,
        });
      });
    };

    this.sub = Rx.merge(
      currentBranch$.pipe(tapSetter("currentBranch")),
      upstreamRemoteName$.pipe(tapSetter("upstreamRemoteName")),
      commitsBehindUpstream$.pipe(tapSetter("commitsBehindUpstream")),
      status$.pipe(tapSetter("gitStatus"))
    ).subscribe();
  }

  watch$() {
    return this.state$.pipe(Rx.map(() => this));
  }

  close() {
    this.sub.unsubscribe();
    this.state$.complete();
    this.pulledMain$.complete();
  }

  getSnapshot(): RepoSnapshot {
    return {
      ...this.state$.getValue(),
    };
  }

  async switchToMain() {
    await this.git.checkout("main");
  }

  async pullMain() {
    const upstream = this.state$.getValue().upstreamRemoteName;
    if (!upstream) {
      throw new Error(
        "unable to pull main until upstream remote name is loaded"
      );
    }

    await this.git.pull(upstream, "main");
    this.pulledMain$.next();
  }
}
