import React from "react";

import { useIpc } from "ui/lib/useIpc";
import { useCounter } from "ui/lib/useCounter";

export const HomePage: React.FC = () => {
  const [i, reset] = useCounter();
  const countingUpFrom = React.useMemo(
    () => Math.round(Math.random() * 1000),
    [i]
  );

  const state = useIpc("counter", {
    startFrom: countingUpFrom,
  });

  if (state.type === "error") {
    throw state.error;
  }

  return (
    <div className="m-2">
      <h1 className="text-3xl mb-2">Counter</h1>
      <p className="mb-2">Counting up from {countingUpFrom}</p>
      <p className="mb-2">
        {state.type === "init" ? (
          "Connecting to the backend..."
        ) : (
          <>Value: {state.latest}</>
        )}
      </p>

      <button
        onClick={reset}
        className="border border-white p-2 px-4 rounded-md cursor-pointer hover:text-white hover:shadow-lg hover:shadow-fuchsia-500"
      >
        updt
      </button>
    </div>
  );
};
