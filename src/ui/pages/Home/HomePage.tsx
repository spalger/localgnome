import React from "react";

import { useIpcSub } from "ui/lib/useIpcSub";
import { GitStatus } from "./GitStatus";
import { Spinner } from "ui/components/Spinner";
import { Button } from "ui/components/Button";
import { ipcCall } from "ui/lib/ipc";
import { useToaster } from "ui/lib/Toaster";

export const HomePage: React.FC = () => {
  const state = useIpcSub("repo list", undefined);
  const toaster = useToaster();

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
                        onClick={() => {
                          ipcCall("repo:pullMain", repo.name).then(
                            () =>
                              toaster.add({
                                message: `${repo.name} pulled latest changes from main`,
                                type: "success",
                              }),
                            (error) => {
                              toaster.add({
                                message: `Failed to pull latest changes from main into ${repo.name}: ${error.message}`,
                                type: "error",
                              });
                            }
                          );
                        }}
                      >
                        update
                      </Button>
                    )
                  ) : (
                    <Button
                      type="button"
                      compact
                      onClick={() => {
                        ipcCall("repo:switchToMain", repo.name).then(
                          () =>
                            toaster.add({
                              message: `${repo.name} switched to main`,
                              type: "success",
                            }),
                          (error) => {
                            toaster.add({
                              message: `Failed to switch ${repo.name} to main: ${error.message}`,
                              type: "error",
                            });
                          }
                        );
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
