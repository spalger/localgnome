import React from "react";

import { toError } from "shared/errors";
import { useIpcSub } from "ui/lib/useIpcSub";
import { GitStatus } from "./GitStatus";
import { Spinner } from "ui/components/Spinner";
import { Button } from "ui/components/Button";
import { ipcCall } from "ui/lib/ipc";
import { useToaster, ToasterService } from "ui/lib/Toaster";
import { useAlerts, AlertsService } from "ui/lib/Alerts";
import { RepoSnapshot } from "main/repos/Repo";

const ABORT = Symbol("abort");

function list(strings: string[]) {
  switch (strings.length) {
    case 0:
      return "";
    case 1:
      return strings[0];
    default:
      const last = strings.at(-1);
      return strings.slice(0, -1).join(", ") + " and " + last;
  }
}

async function optionallyDealWithChanges(
  repo: RepoSnapshot,
  alerts: AlertsService,
  toaster: ToasterService
) {
  if (!repo.gitStatus?.changedFiles) {
    return;
  }

  const result = await alerts.show({
    message: `There are uncommitted changes in the ${repo.currentBranch} branch, want to commit them first?`,
    choices: [
      {
        label: "Yes, commit them",
        value: "commit",
        primary: true,
      },
      {
        label: "No, stash them",
        value: "stash",
      },
      {
        label: "No, discard them",
        value: "discard",
      },
      {
        label: "No, ignore them",
        value: "ignore",
      },
    ],
  });

  if (result.type !== "selection") {
    return ABORT;
  }

  switch (result.choice) {
    case "commit":
      await ipcCall("repo:saveChanges", {
        repoName: repo.name,
      });

      toaster.add({
        message: `changes committed with message "save" in repo "${repo.name}"`,
        type: "success",
      });
      break;

    case "stash":
      await ipcCall("repo:stashChanges", {
        repoName: repo.name,
      });

      toaster.add({
        message: `changes stashed in repo "${repo.name}"`,
        type: "success",
      });
      break;

    case "discard":
      return await maybeDiscardRepoChanges(repo, alerts, toaster);
  }
}

async function maybeDiscardRepoChanges(
  repo: RepoSnapshot,
  alerts: AlertsService,
  toaster: ToasterService
) {
  const description = [];
  if (repo.gitStatus?.changedFiles) {
    description.push(`the ${repo.gitStatus.changedFiles} changed files`);
  }
  if (repo.gitStatus?.conflicts) {
    description.push(`the ${repo.gitStatus.conflicts} conflicting files`);
  }
  if (repo.commitsAheadUpstream) {
    description.push(
      `the ${repo.commitsAheadUpstream} commits you have made on main`
    );
  }

  const result = await alerts.show({
    message: `Are you sure? This will discard ${
      description.length ? list(description) : "all changes"
    } in repo "${repo.name}".`,
    choices: [
      {
        label: "Yes",
        value: "yes",
      },
      {
        label: "Cancel",
        value: "cancel",
      },
    ],
  });

  if (result.type !== "selection" || result.choice !== "yes") {
    return ABORT;
  }

  try {
    await ipcCall("repo:resetToMain", {
      repoName: repo.name,
    });
    toaster.add({
      message: `discarded changes in repo "${repo.name}"`,
      type: "success",
    });
  } catch (_) {
    const error = toError(_);
    toaster.add({
      message: `Failed to discard changes in repo "${repo.name}": ${error.message}`,
      type: "error",
    });
  }
}

export const HomePage: React.FC = () => {
  const state = useIpcSub("repos:list", undefined);
  const toaster = useToaster();
  const alerts = useAlerts();
  const [loadingRepos, setLoadingRepos] = React.useState<Set<string>>(
    new Set()
  );

  const runRepoOperation = React.useCallback(
    (
      repo: RepoSnapshot | RepoSnapshot[],
      fn: (repos: RepoSnapshot[]) => Promise<void>
    ) => {
      const repos = Array.isArray(repo) ? repo : [repo];

      const next = new Set(loadingRepos);
      for (const repo of repos) {
        next.add(repo.name);
      }
      setLoadingRepos(next);

      Promise.resolve()
        .then(() =>
          Promise.all(
            repos.map(async (repo) =>
              (await optionallyDealWithChanges(repo, alerts, toaster)) === ABORT
                ? ABORT
                : repo
            )
          )
        )
        .then(async (repos) => {
          const valid = repos.flatMap((r) => (r === ABORT ? [] : [r]));
          if (valid.length > 0) {
            await fn(valid);
          }
        })
        .finally(() => {
          setLoadingRepos((prev) => {
            const next = new Set(prev);
            for (const repo of repos) {
              next.delete(repo.name);
            }
            return next;
          });
        });
    },
    [setLoadingRepos]
  );

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "init") {
    return null;
  }

  return (
    <div className="m-2">
      <div className="flex flex-row">
        <h1 className="grow text-3xl mb-2">Repos</h1>
        <div className="grow-0">
          <Button
            type="button"
            compact
            disabled={state.latest.type !== "valid" || loadingRepos.size > 0}
            onClick={() => {
              if (state.latest.type !== "valid") {
                return;
              }

              const { repos } = state.latest;
              runRepoOperation(repos, async (repos) => {
                try {
                  await ipcCall("repos:refresh", {
                    repoNames: repos.map((repo) => repo.name),
                  });
                  toaster.add({
                    message: `refreshed all repo`,
                    type: "success",
                  });
                } catch (_) {
                  const error = toError(_);
                  toaster.add({
                    message: `Failed to refresh all repos: ${error.message}`,
                    type: "error",
                  });
                }
              });
            }}
          >
            refresh all
          </Button>
        </div>
      </div>
      {state.latest.type === "error" && (
        <p className="bg-error text-error">
          Unable to read repos: {state.latest.error}
        </p>
      )}
      {state.latest.type === "valid" && (
        <table className="w-full">
          <thead>
            <tr>
              <td>Name</td>
              <td>Open</td>
              <td>Status</td>
              <td>Current branch</td>
              <td>Upstream remote</td>
              <td>Ahead</td>
              <td>Behind</td>
              <td className="w-[100px]"></td>
            </tr>
          </thead>
          <tbody>
            {state.latest.repos.map((repo, i) => {
              const loading =
                loadingRepos.has(repo.name) ||
                (!repo.error &&
                  (repo.commitsBehindUpstream === undefined ||
                    repo.commitsAheadUpstream === undefined ||
                    repo.currentBranch === undefined ||
                    repo.upstreamRemoteName === undefined ||
                    repo.gitStatus === undefined));

              const controls = [
                <Button
                  key="refresh"
                  type="button"
                  compact
                  disabled={loading}
                  onClick={() =>
                    runRepoOperation(repo, async () => {
                      try {
                        await ipcCall("repos:refresh", {
                          repoNames: [repo.name],
                        });
                        toaster.add({
                          message: `refreshed repo "${repo.name}"`,
                          type: "success",
                        });
                      } catch (_) {
                        const error = toError(_);
                        toaster.add({
                          message: `Failed to refresh repo "${repo.name}": ${error.message}`,
                          type: "error",
                        });
                      }
                    })
                  }
                >
                  refresh
                </Button>,
              ];

              if (
                !repo.error &&
                repo.currentBranch === "main" &&
                (repo.commitsBehindUpstream ?? 0) > 0
              ) {
                controls.push(
                  <Button
                    key="pull-main"
                    type="button"
                    compact
                    disabled={loading || !!repo.gitStatus?.conflicts}
                    onClick={() => {
                      runRepoOperation(repo, async () => {
                        try {
                          await ipcCall("repo:pullMain", {
                            repoName: repo.name,
                          });
                          toaster.add({
                            message: `pulled latest changes from main in repo "${repo.name}"`,
                            type: "success",
                          });
                        } catch (_) {
                          const error = toError(_);
                          toaster.add({
                            message: `Failed to pull latest changes from main into repo "${repo.name}": ${error.message}`,
                            type: "error",
                          });
                        }
                      });
                    }}
                  >
                    pull main
                  </Button>
                );
              }

              if (!repo.error && repo.currentBranch !== "main") {
                controls.push(
                  <Button
                    key="switch-to-main"
                    type="button"
                    compact
                    disabled={loading || !!repo.gitStatus?.conflicts}
                    onClick={() => {
                      runRepoOperation(repo, async () => {
                        try {
                          await ipcCall("repo:switchToMain", {
                            repoName: repo.name,
                          });
                          toaster.add({
                            message: `switched repo "${repo.name}" to main`,
                            type: "success",
                          });
                        } catch (_) {
                          const error = toError(_);
                          toaster.add({
                            message: `Failed to switch repo "${repo.name}" to main: ${error.message}`,
                            type: "error",
                          });
                        }
                      });
                    }}
                  >
                    switch to main
                  </Button>
                );
              }

              return (
                <tr
                  key={repo.name}
                  className={
                    i % 2
                      ? "bg-slate-100 dark:bg-slate-900"
                      : "bg-slate-200 dark:bg-slate-950"
                  }
                >
                  <td>{repo.name}</td>
                  <td>
                    <Button
                      type="button"
                      compact
                      icon="terminal"
                      onClick={() =>
                        ipcCall("repo:open", {
                          type: "terminal",
                          repoName: repo.name,
                        }).catch((_) => {
                          const error = toError(_);
                          toaster.add({
                            message: `Failed to open repo "${repo.name}" in your terminal: ${error.message}`,
                            type: "error",
                          });
                        })
                      }
                    />
                    <Button
                      type="button"
                      compact
                      icon="pencil-square"
                      onClick={() =>
                        ipcCall("repo:open", {
                          type: "editor",
                          repoName: repo.name,
                        }).catch((_) => {
                          const error = toError(_);
                          toaster.add({
                            message: `Failed to open repo "${repo.name}" in your editor: ${error.message}`,
                            type: "error",
                          });
                        })
                      }
                    />
                  </td>
                  {repo.error ? (
                    <td className="bg-red-700 text-white" colSpan={5}>
                      {repo.error}
                    </td>
                  ) : (
                    <>
                      <td>
                        {repo.gitStatus ? (
                          <GitStatus status={repo.gitStatus} />
                        ) : (
                          <Spinner />
                        )}
                      </td>
                      <td>{repo.currentBranch ?? <Spinner />}</td>
                      <td>{repo.upstreamRemoteName ?? <Spinner />}</td>
                      <td>
                        {repo.commitsAheadUpstream === undefined ? (
                          <Spinner />
                        ) : (
                          <>
                            <span
                              className={
                                repo.commitsAheadUpstream === 0
                                  ? "text-disabled"
                                  : ""
                              }
                            >
                              {repo.commitsAheadUpstream}↑
                            </span>
                            {repo.commitsAheadUpstream > 0 &&
                            repo.currentBranch === "main" ? (
                              <Button
                                type="button"
                                compact
                                icon="trash"
                                className="ml-2"
                                onClick={() => {
                                  runRepoOperation(repo, async () => {
                                    await maybeDiscardRepoChanges(
                                      repo,
                                      alerts,
                                      toaster
                                    );
                                  });
                                }}
                              />
                            ) : null}
                          </>
                        )}
                      </td>
                      <td>
                        {repo.commitsBehindUpstream === undefined ? (
                          <Spinner />
                        ) : (
                          <span
                            className={
                              repo.commitsBehindUpstream === 0
                                ? "text-disabled"
                                : ""
                            }
                          >
                            {repo.commitsBehindUpstream}↓
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="w-[200px] h-8 space-x-3">{controls}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
