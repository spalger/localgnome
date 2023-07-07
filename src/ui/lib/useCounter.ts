import React from "react";

const incr = (n: number) => n + 1;

export function useCounter(): [number, () => void] {
  const [i, set] = React.useState(0);
  const next = React.useCallback(() => set(incr), []);
  return [i, next];
}
