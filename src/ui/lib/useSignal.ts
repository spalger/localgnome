import React from "react";
import * as Rx from "rxjs";

export function useSignal(): [() => void, Rx.Observable<number>] {
  const [subj, out] = React.useMemo(() => {
    const subj = new Rx.BehaviorSubject(0);
    return [subj, subj.asObservable()];
  }, []);

  const next = React.useCallback(() => {
    subj.next(subj.getValue() + 1);
  }, [subj]);

  return [next, out];
}
