import React from "react";
import * as Rx from "rxjs";

import { useIpc } from "ui/lib/useIpc";
import { useLatest } from "ui/lib/useObservable";
import { useSignal } from "ui/lib/useSignal";

export const HomePage: React.FC = () => {
  const [newStart, trigger$] = useSignal();
  const countingUpFrom = useLatest(
    () => trigger$.pipe(Rx.map(() => Math.round(Math.random() * 1000))),
    []
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
      <p>
        Counting up from {countingUpFrom}{" "}
        <button onClick={newStart}>updt</button>
      </p>
      <p>
        {state.type === "init" ? (
          "Connecting to the backend..."
        ) : (
          <>Value: {state.latest}</>
        )}
      </p>
    </>
  );
};
