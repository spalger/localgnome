import React from "react";

import { __AlertsContext } from "./AlertsProvider";

export function useAlerts() {
  const ctx = React.useContext(__AlertsContext);

  if (!ctx) {
    throw new Error("useAlerts() can only be used within the AlertsProvider");
  }

  return ctx;
}
