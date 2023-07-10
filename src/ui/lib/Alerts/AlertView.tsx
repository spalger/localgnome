import React from "react";
import { createPortal } from "react-dom";

import { Button } from "ui/components/Button";
import { Alert } from "./AlertsProvider";

interface Props {
  alert?: Alert<any>;
}

export const AlertView: React.FC<Props> = ({ alert }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!alert) {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        alert.onDismiss();
      }

      if (e.key === "Enter") {
        const primary = alert.choices.find((c) => c.primary);
        if (!primary) {
          return;
        }

        e.stopPropagation();
        e.preventDefault();
        alert.onChoice(primary.value);
      }
    };

    document.addEventListener("keydown", handler);
    console.log("added event listener");
    return () => document.removeEventListener("keydown", handler);
  }, [alert]);

  if (!alert) {
    ref.current?.remove();
    ref.current = null;
    return null;
  }

  if (!ref.current) {
    ref.current = document.createElement("div");
    document.body.appendChild(ref.current);
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-20 bg-black">
      <div className="bg-white rounded-md shadow-lg p-4">
        <div className="text-lg font-semibold mb-2">{alert.message}</div>
        <div className="flex justify-end gap-2">
          {alert.choices.map((choice) => (
            <Button
              key={choice.value}
              theme={choice.primary ? "primary" : undefined}
              onClick={() => alert.onChoice(choice.value)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    ref.current
  );
};
