import React from "react";
import { createPortal } from "react-dom";

import { useToaster } from "./useToaster";

export const ToasterView: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>();
  const { toasts } = useToaster();

  if (!toasts.length) {
    if (ref.current) {
      document.body.removeChild(ref.current);
      ref.current = undefined;
    }

    return <></>;
  }

  if (!ref.current) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    ref.current = container;
  }

  return createPortal(
    <div className="fixed bottom-0 right-0 p-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="p-4 bg-white rounded-lg shadow-md">
          {toast.message}
        </div>
      ))}
    </div>,
    ref.current
  );
};
