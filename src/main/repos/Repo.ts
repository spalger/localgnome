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

interface InternalState {
  erroring: Set<keyof RepoSnapshot>;
  repo: RepoSnapshot;
}

export class Repo {
  private readonly state$: Rx.BehaviorSubject<InternalState>;
  private readonly git: SimpleGit;
  private readonly sub: Rx.Subscription;
  private readonly refresh$: Rx.Subject<void>;
  private readonly pulledMain$: Rx.Subject<void>;
  private readonly nextFullRefresh$: Rx.Observable<void>;
  public readonly path: string;

  constructor(reposDir: string, public readonly name: string) {
    this.path = Path.resolve(reposDir, name);
    this.state$ = new Rx.BehaviorSubject<InternalState>({
      erroring: new Set(),
      repo: {
        name,
        path: this.path,
      },
    });

    this.git = simpleGit(this.path, { maxConcurrentProcesses: 1 });
    this.refresh$ = new Rx.Subject();
    this.pulledMain$ = new Rx.Subject();

    const stateProp$ = <N extends keyof RepoSnapshot>(
      property: N,
      source$: Rx.Observable<RepoSnapshot[N] | Error>
    ): Rx.Observable<[N, RepoSnapshot[N] | Error]> => {
      return source$.pipe(
        Rx.map((value): [N, RepoSnapshot[N] | Error] => [property, value]),
        Rx.share()
      );
    };

    const headChange$ = watch$(Path.resolve(this.path, ".git/HEAD")).pipe(
      Rx.share()
    );

    const remotesChange$ = watch$(
      Path.resolve(this.path, ".git/refs/remotes"),
      {
        recursive: true,
      }
    ).pipe(Rx.share());

    const currentBranch$ = stateProp$(
      "currentBranch",
      Rx.merge(this.refresh$, headChange$).pipe(
        Rx.startWith(undefined),
        Rx.switchMap(() => Rx.from(this.git.branchLocal())),
        Rx.map((branch) => branch.current)
      )
    );

    const upstreamRemoteName$ = stateProp$(
      "upstreamRemoteName",
      Rx.merge(this.refresh$, remotesChange$).pipe(
        Rx.startWith(undefined),
        Rx.switchMap(() => Rx.from(this.git.getRemotes())),
        Rx.map((remotes) =>
          remotes.some((remote) => remote.name === "upstream")
            ? "upstream"
            : "origin"
        )
      )
    );

    const commitsBehindUpstream$ = stateProp$(
      "commitsBehindUpstream",
      Rx.merge(
        // clear the current value when main is pulled
        Rx.merge(this.pulledMain$, this.refresh$).pipe(Rx.map(() => undefined)),

        Rx.combineLatest([
          upstreamRemoteName$,
          Rx.merge(
            this.pulledMain$,
            this.refresh$,
            // refresh at some point between 30 minutes and 1 hour, then hourly after that. This
            // prevents us from refreshing all repos at the same time, but should keep them
            // roughly up-to-date with the remote repos.
            Rx.timer(random(30 * MINUTE, 1 * HOUR), 1 * HOUR),
            Rx.merge(headChange$, remotesChange$).pipe(Rx.debounceTime(1000))
          ).pipe(Rx.startWith(undefined)),
        ]).pipe(
          Rx.switchMap(([[, upstreamRemoteName]]) => {
            if (!upstreamRemoteName || upstreamRemoteName instanceof Error) {
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
                  error.message.includes(
                    "Could not read from remote repository"
                  )
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
      )
    );

    const status$ = stateProp$(
      "gitStatus",
      Rx.merge(
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
      )
    );

    const stateChange$ = Rx.merge(
      currentBranch$,
      upstreamRemoteName$,
      commitsBehindUpstream$,
      status$
    );

    this.sub = stateChange$
      .pipe(
        Rx.scan((state, [property, value]) => {
          if (value instanceof Error) {
            return {
              erroring: new Set([...state.erroring, property]),
              repo: {
                ...state.repo,
                error: value.message,
              },
            };
          }

          const erroring = new Set(state.erroring);
          const clearError = state.erroring.has(property);
          const repo = { ...state.repo, [property]: value };
          if (clearError) {
            erroring.delete(property);
            repo.error = undefined;
          }

          return { erroring, repo };
        }, this.state$.getValue())
      )
      .subscribe(this.state$);

    this.nextFullRefresh$ = stateChange$.pipe(
      Rx.scan(
        (missing, [property]) => {
          return missing.filter((p) => p !== property);
        },
        [
          "currentBranch",
          "upstreamRemoteName",
          "commitsBehindUpstream",
          "gitStatus",
        ] as Array<keyof RepoSnapshot>
      ),
      Rx.first((missing) => missing.length === 0),
      Rx.map(() => undefined)
    );
  }

  watch$() {
    return this.state$.pipe(Rx.map(() => this));
  }

  close() {
    this.sub.unsubscribe();
    this.state$.complete();
    this.refresh$.complete();
    this.pulledMain$.complete();
  }

  getSnapshot(): RepoSnapshot {
    return {
      ...this.state$.getValue().repo,
    };
  }

  async switchToMain() {
    await this.git.checkout("main");
  }

  async pullMain() {
    const upstream = this.state$.getValue().repo.upstreamRemoteName;
    if (!upstream) {
      throw new Error(
        "unable to pull main until upstream remote name is loaded"
      );
    }

    await this.git.pull(upstream, "main");
    this.pulledMain$.next();
  }

  async saveChanges() {
    await this.git.raw(["add", "-A"]);
    await this.git.raw(["commit", "-m", "save"]);
  }

  async stashChanges() {
    await this.git.raw(["stash", "save", "-u"]);
  }

  async refresh() {
    await Rx.lastValueFrom(
      Rx.merge(
        this.nextFullRefresh$,
        Rx.defer(() => {
          this.refresh$.next();
          return Rx.EMPTY;
        })
      )
    );
  }
}
