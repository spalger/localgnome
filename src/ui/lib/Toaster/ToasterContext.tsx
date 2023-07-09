import React from "react";
import { v4 as uuidV4 } from "uuid";

interface Props extends React.PropsWithChildren {}

interface ToastInput {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface Toast {
  id: string;
  paused: boolean;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration: number;
  durationFrom: number;
  pause: () => void;
  unpause: () => void;
}

interface ToasterContextValue {
  toasts: Toast[];
  add: (toast: ToastInput) => void;
}

const ToasterContext = React.createContext<ToasterContextValue | null>(null);
export { ToasterContext as __ToasterContext };

function makePauseSetter(
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
  id: string,
  paused: boolean
) {
  return () => {
    setToasts((toasts) => {
      const selfIndex = toasts.findIndex((t) => t.id === id);
      if (selfIndex === -1 || toasts[selfIndex].paused === paused) {
        return toasts;
      }

      const newToasts = [...toasts];
      newToasts[selfIndex].paused = paused;
      return newToasts;
    });
  };
}

export const ToasterContextProvider: React.FC<Props> = (props) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // when toasts changes, find the next toast that will expire and set a timer to expire that toast
  React.useEffect(() => {
    const next = toasts
      .flatMap((t) => {
        if (t.paused) {
          return [];
        }

        return {
          id: t.id,
          ms: t.duration - (Date.now() - t.durationFrom),
        };
      })
      .sort((a, b) => a.ms - b.ms)
      .at(0);

    if (!next) {
      return;
    }

    const { id, ms } = next;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ms);

    return () => {
      clearTimeout(timer);
    };
  }, [toasts]);

  const ctxValue = React.useMemo(
    (): ToasterContextValue => ({
      toasts,
      add(input: ToastInput) {
        const id = uuidV4();
        setToasts((prev) => [
          ...prev,
          {
            id,
            message: input.message,
            type: input.type ?? "info",
            paused: false,
            duration: input.duration ?? 5000,
            durationFrom: Date.now(),
            pause: makePauseSetter(setToasts, id, true),
            unpause: makePauseSetter(setToasts, id, true),
          },
        ]);
      },
    }),
    [toasts, setToasts]
  );

  return (
    <ToasterContext.Provider value={ctxValue}>
      {props.children}
    </ToasterContext.Provider>
  );
};
