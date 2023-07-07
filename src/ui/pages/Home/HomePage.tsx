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
      {state.latest.scanning && <p>scanning repos...</p>}
      {state.latest.error && (
        <p className="bg-red-700 text-white">
          Unable to read repos: {state.latest.error}
        </p>
      )}
      {state.latest.repoNames && (
        <ul>
          {state.latest.repoNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
