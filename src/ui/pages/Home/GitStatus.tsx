import React from "react";
import type { RepoSnapshot } from "main/repos/Repo";

interface Props {
  status: NonNullable<RepoSnapshot["gitStatus"]>;
}

export const GitStatus: React.FC<Props> = ({ status }) => {
  const chunks: React.ReactNode[] = [];

  if (status.changedFiles) {
    chunks.push(
      <span className="text-yellow-600" key="changes">
        {status.changedFiles} C
      </span>
    );
  }

  if (status.conflicts) {
    chunks.push(
      <span className="text-red-900" key="conflicts">
        {status.changedFiles} !
      </span>
    );
  }

  return (
    <span className="space-x-2">
      {chunks.flatMap((c, i) => (i === 0 ? c : [",", c]))}
    </span>
  );
};
