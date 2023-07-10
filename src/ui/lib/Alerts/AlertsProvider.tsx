import React from "react";

import { AlertView } from "./AlertView";

export interface Choice<T extends string> {
  label: React.ReactNode;
  value: T;
  primary?: boolean;
}

export interface AlertInput<T extends string> {
  message: React.ReactNode;
  choices: Array<Choice<T>>;
}

export interface Alert<T extends string> {
  message: React.ReactNode;
  choices: Array<Choice<T>>;
  onDismiss: () => void;
  onChoice: (choice: T) => void;
}

export type AlertResult<T extends string> =
  | {
      type: "selection";
      choice: T;
    }
  | {
      type: "dismiss";
    };

export interface AlertsContextValue {
  show<T extends string>(alert: AlertInput<T>): Promise<AlertResult<T>>;
}

const AlertsContext = React.createContext<AlertsContextValue | null>(null);
export { AlertsContext as __AlertsContext };

export const AlertsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [alerts, setAlerts] = React.useState<Alert<any>[]>([]);

  const ctxValue = React.useMemo((): AlertsContextValue => {
    return {
      show: async <T extends string>({ message, choices }: AlertInput<T>) => {
        return new Promise((resolve, reject) => {
          const primaryChoices = choices.filter((c) => c.primary);
          if (primaryChoices.length > 1) {
            reject(new Error("more than one primary choice provided"));
          }

          const alert: Alert<T> = {
            message,
            choices,
            onDismiss: () => {
              setAlerts((prev) => prev.filter((a) => a !== alert));
              reject(new Error("dialog dismissed"));
            },
            onChoice: (choice: any) => {
              setAlerts((prev) => prev.filter((a) => a !== alert));
              resolve({ type: "selection", choice });
            },
          };

          setAlerts((prev) => [alert, ...prev]);
        });
      },
    };
  }, []);

  const alert = alerts.at(0);

  return (
    <AlertsContext.Provider value={ctxValue}>
      <AlertView alert={alert} />
      {children}
    </AlertsContext.Provider>
  );
};
