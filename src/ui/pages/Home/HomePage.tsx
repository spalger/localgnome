import React from "react";

import { useIpcSub } from "ui/lib/useIpcSub";

export const HomePage: React.FC = () => {
  const state = useIpcSub("repo list", undefined);

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "init") {
    return null;
  }

  return (
    <div className="m-2">
      <h1 className="text-3xl mb-2">Repos</h1>
      {state.latest.scanning && <p>scanning repos...</p>}
      {state.latest.error && (
        <p className="bg-red-700 text-white">
          Unable to read repos: {state.latest.error}
        </p>
      )}
      {state.latest.repos && (
        <table className="w-full">
          <thead>
            <tr>
              <td>Name</td>
              <td>Current branch</td>
              <td>Upstream remote</td>
              <td>Commits behind</td>
              <td className="w-[100px]"></td>
            </tr>
          </thead>
          <tbody>
            {state.latest.repos.map((repo) => (
              <tr key={repo.path}>
                <td>{repo.name}</td>
                {repo.error ? (
                  <td className="bg-red-700 text-white col-span-3">
                    {repo.error}
                  </td>
                ) : (
                  <>
                    <td>{repo.currentBranch}</td>
                    <td>{repo.upstreamRemoteName}</td>
                    <td>{repo.commitsBehindUpstream}</td>
                  </>
                )}
                <td className="w-[200px] h-8">
                  {repo.currentBranch === "main" ? (
                    repo.commitsBehindUpstream === 0 ? null : (
                      <button
                        type="button"
                        className="bg-slate-900 border p-1 ml-3 text-xs hover:shadow-md hover:shadow-fuchsia-600"
                      >
                        update
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="bg-slate-900 border p-1 ml-3 text-xs hover:shadow-md hover:shadow-fuchsia-600"
                    >
                      switch to main
                    </button>
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
