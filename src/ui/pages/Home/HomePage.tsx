import React from "react";

import { useIpc } from "ui/lib/useIpc";

export const HomePage: React.FC = () => {
  const state = useIpc("repo list", undefined);

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "init") {
    return null;
  }

  return (
    <div className="m-2">
      <h1 className="text-3xl mb-2">Repos</h1>
      <ul>
        {state.latest.map((repo) => (
          <li key={repo.name}>{repo.name}</li>
        ))}
      </ul>
    </div>
  );
};
