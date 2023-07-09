import { useObservable, ObservableState } from "./useObservable";
import {
  IpcMethodName,
  IpcMethodArg,
  IpcMethodResult,
} from "shared/IpcMethods";
import { ipcSub } from "ui/lib/ipc";

export type IpcState<N extends IpcMethodName> = ObservableState<
  IpcMethodResult<N>
>;

export function useIpcSub<N extends IpcMethodName>(
  method: N,
  arg: IpcMethodArg<N>
): IpcState<N> {
  return useObservable(() => {
    return ipcSub(method, arg);
  }, [method, JSON.stringify(arg)]);
}
