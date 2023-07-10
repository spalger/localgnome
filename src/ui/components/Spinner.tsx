import React from "react";
import "./Spinner.css";

interface Props {
  size?: number | "lg" | "md" | "sm" | "xs";
}

function sizeClass(size: Props["size"]): string[] {
  switch (size) {
    case "lg":
      return ["text-lg"];
    case "md":
      return ["text-md"];
    case "sm":
      return ["text-sm"];
    case "xs":
      return ["text-xs"];
    case undefined:
      return ["text-inherit"];
  }

  return [];
}

export const Spinner: React.FC<Props> = (props) => {
  return (
    <div className={[`lds-grid`, sizeClass(props.size)].flat().join(" ")}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};
