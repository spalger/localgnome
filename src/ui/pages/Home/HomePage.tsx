import React from "react";

import { useIpc } from "ui/lib/useIpc";

export const HomePage: React.FC = () => {
  const countingUpFrom = React.useMemo(
    () => Math.round(Math.random() * 1000),
    [],
  );

  const state = useIpc("counter", {
    startFrom: countingUpFrom,
  });

  if (state.type === "error") {
    throw state.error;
  }

  return (
    <>
      <h1>Counter</h1>
      {state.type === "init" ? (
        "Connecting to the backend..."
      ) : (
        <>
          <p>Counting up from {countingUpFrom}</p>
          <p>Value: {state.latest}</p>
        </>
      )}
    </>
  );
};
