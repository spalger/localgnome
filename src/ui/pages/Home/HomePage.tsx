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

async function optionallyDealWithChanges(
  repo: RepoSnapshot,
  alerts: AlertsService,
  toaster: ToasterService
) {
  if (!repo.gitStatus?.changedFiles) {
    return;
  }

  const result = await alerts.show({
    message: `There are uncommitted changes in the ${repo.currentBranch} branch, want to commit them before switching to main?`,
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
        label: "No, ignore them",
        value: "ignore",
      },
    ],
  });

  if (result.type !== "selection") {
    return;
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
  }
}

export const HomePage: React.FC = () => {
  const state = useIpcSub("repo list", undefined);
  const toaster = useToaster();
  const alerts = useAlerts();

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "init") {
    return null;
  }

  return (
    <div className="m-2">
      <h1 className="text-3xl mb-2">Repos</h1>
      {state.latest.type === "error" && (
        <p className="bg-red-700 text-white">
          Unable to read repos: {state.latest.error}
        </p>
      )}
      {state.latest.type === "valid" && (
        <table className="w-full">
          <thead>
            <tr>
              <td>Name</td>
              <td>Status</td>
              <td>Current branch</td>
              <td>Upstream remote</td>
              <td>Commits behind</td>
              <td className="w-[100px]"></td>
            </tr>
          </thead>
          <tbody>
            {state.latest.repos.map((repo, i) => (
              <tr
                key={repo.name}
                className={i % 2 ? "bg-slate-900" : "bg-slate-950"}
              >
                <td>{repo.name}</td>
                {repo.error ? (
                  <td className="bg-red-700 text-white col-span-4">
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
                    <td>{repo.commitsBehindUpstream ?? <Spinner />}</td>
                  </>
                )}
                <td className="w-[200px] h-8 space-x-3">
                  {repo.currentBranch === "main" ? (
                    (repo.commitsBehindUpstream ?? 0) === 0 ? null : (
                      <Button
                        type="button"
                        compact
                        disabled={!!repo.gitStatus?.conflicts}
                        onClick={() => {
                          optionallyDealWithChanges(repo, alerts, toaster)
                            .then(async () => {
                              await ipcCall("repo:pullMain", {
                                repoName: repo.name,
                              });
                              toaster.add({
                                message: `pulled latest changes from main in repo "${repo.name}"`,
                                type: "success",
                              });
                            })
                            .catch((_) => {
                              const error = toError(_);
                              toaster.add({
                                message: `Failed to pull latest changes from main into repo "${repo.name}": ${error.message}`,
                                type: "error",
                              });
                            });
                        }}
                      >
                        update
                      </Button>
                    )
                  ) : (
                    <Button
                      type="button"
                      compact
                      disabled={!!repo.gitStatus?.conflicts}
                      onClick={() => {
                        optionallyDealWithChanges(repo, alerts, toaster)
                          .then(async () => {
                            await ipcCall("repo:switchToMain", {
                              repoName: repo.name,
                            });
                            toaster.add({
                              message: `switched repo "${repo.name}" to main`,
                              type: "success",
                            });
                          })
                          .catch((_) => {
                            const error = toError(_);
                            toaster.add({
                              message: `Failed to switch repo "${repo.name}" to main: ${error.message}`,
                              type: "error",
                            });
                          });
                      }}
                    >
                      switch to main
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
