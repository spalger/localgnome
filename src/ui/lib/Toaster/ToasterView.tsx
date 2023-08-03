import React from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";

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
    <div className="fixed top-0 left-[calc(50%-200px)] w-[400px] p-4 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            "p-2 rounded-md shadow-md text-xs hover:opacity-75 transition-opacity duration-200 ease-in-out cursor-pointer",
            {
              "bg-green-900 text-white": toast.type === "success",
              "bg-red-900 text-white": toast.type === "error",
              "bg-yellow-600 text-black": toast.type === "warning",
              "bg-slate-900 text-white": toast.type === "info",
            }
          )}
          onMouseEnter={() => toast.pause()}
          onMouseLeave={() => toast.unpause()}
          onClick={() => toast.dismiss()}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    ref.current
  );
};
