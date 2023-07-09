import React from "react";
import { ObservableState } from "./useObservable";
import {
  IpcMethodName,
  IpcMethodArg,
  IpcMethodResult,
} from "shared/IpcMethods";
import { ipcFirst } from "ui/lib/ipc";

export type IpcState<N extends IpcMethodName> = ObservableState<
  IpcMethodResult<N>
>;

export function useIpcFirst<N extends IpcMethodName>(
  method: N,
  arg: IpcMethodArg<N>
): IpcState<N> {
  const [state, setState] = React.useState<IpcState<N>>({
    type: "init",
  });

  React.useEffect(() => {
    ipcFirst(method, arg).then(
      (result) => setState({ type: "complete", latest: result }),
      (error) => setState({ type: "error", error })
    );
  }, [method, JSON.stringify(arg)]);

  return state;
}
