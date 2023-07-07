import React from "react";
import * as Rx from "rxjs";

import { toError } from "shared/errors";

export type ObsGetter<T> = () => Rx.Observable<T>;
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

type ObsSub<T> = {
  obs: Rx.Observable<T>;
  latest$: Rx.BehaviorSubject<ObservableState<T>>;
  subscription: Rx.Subscription;
  inital: ObservableState<T>;
};

function doSyncSubscribe<T>(obs: Rx.Observable<T>): ObsSub<T> {
  const latest$ = new Rx.BehaviorSubject<ObservableState<T>>({
    type: "init",
  });
  const subscription = obs.subscribe({
    next(value) {
      latest$.next({
        type: "next",
        latest: value,
      });
    },
    error(error) {
      latest$.next({
        type: "error",
        error: toError(error),
      });
    },
    complete() {
      const prev = latest$.getValue();
      if (prev.type !== "next") {
        latest$.next({
          type: "error",
          error: new Error(
            "observable completed without producing a single value"
          ),
        });
      } else {
        latest$.next({
          type: "complete",
          latest: prev.latest,
        });
      }
    },
  });

  return {
    obs,
    latest$,
    subscription,
    inital: latest$.getValue(),
  };
}

export function useObservable<T>(
  get: ObsGetter<T>,
  deps: React.DependencyList
): ObservableState<T> {
  const observable = React.useMemo(get, deps);
  const sub = React.useRef<ObsSub<T>>();

  if (sub.current && sub.current.obs !== observable) {
    sub.current.subscription.unsubscribe();
    sub.current = undefined;
  }

  if (!sub.current) {
    sub.current = doSyncSubscribe(observable);
  }

  const [state, setState] = React.useState<ObservableState<T>>(
    sub.current.inital
  );

  React.useEffect(() => {
    if (!sub.current) {
      return;
    }

    const stateSub = sub.current.latest$.subscribe((update) => {
      setState(update);
    });

    return () => {
      stateSub.unsubscribe();
    };
  }, [sub.current]);

  return state;
}

export function useLatest<T>(get: ObsGetter<T>, deps: React.DependencyList) {
  const state = useObservable(get, deps);
  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "init") {
    throw new Error(
      "observable must produce a value synchronously, do you want `.pipe(Rx.startWith())`?"
    );
  }

  return state.latest;
}
