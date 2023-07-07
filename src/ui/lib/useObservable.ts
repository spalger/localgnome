import React from "react";
import * as Rx from "rxjs";

import { toError } from "shared/errors";

export type ObservableState<T> =
  | { type: "init" }
  | {
      type: "next";
      latest: T;
    }
  | {
      type: "complete";
      latest: T;
    }
  | {
      type: "error";
      error: Error;
    };

export function useObservable<T>(
  get: () => Rx.Observable<T>,
  deps: any[]
): ObservableState<T> {
  const observable = React.useMemo(get, deps);
  const [state, setState] = React.useState<ObservableState<T>>({
    type: "init",
  });

  React.useEffect(() => {
    if (state.type !== "init") {
      setState({ type: "init" });
    }

    const subscription = observable.subscribe({
      next(value) {
        setState({
          type: "next",
          latest: value,
        });
      },
      error(error) {
        setState({
          type: "error",
          error: toError(error),
        });
      },
      complete() {
        setState((state) => {
          if (state.type !== "next") {
            throw new Error(
              "Unable to `useObservable()` that completes without producing any values"
            );
          }

          return {
            type: "complete",
            latest: state.latest,
          };
        });
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [observable]);

  return state;
}
