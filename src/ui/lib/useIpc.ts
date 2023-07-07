import { useObservable, ObservableState } from "./useObservable";
import {
  IpcMethodName,
  IpcMethodArg,
  IpcMethodResult,
} from "shared/IpcMethods";
import { ipc } from "ui/lib/ipc";

export type IpcState<N extends IpcMethodName> = ObservableState<
  IpcMethodResult<N>
>;

export function useIpc<N extends IpcMethodName>(
  method: N,
  arg: IpcMethodArg<N>
): IpcState<N> {
  return useObservable(() => {
    return ipc(method, arg);
  }, [method, JSON.stringify(arg)]);
}
