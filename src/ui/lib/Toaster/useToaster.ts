import React from "react";
import { __ToasterContext } from "./ToasterContext";

export function useToaster() {
  const ctx = React.useContext(__ToasterContext);
  if (!ctx) {
    throw new Error(
      "useToasterContext must be used within a ToasterContextProvider"
    );
  }
  return ctx;
}
