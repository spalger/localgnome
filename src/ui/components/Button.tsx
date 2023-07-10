import classNames from "classnames";

interface Props extends React.PropsWithChildren {
  type?: "button" | "submit";
  theme?: "primary" | "secondary";
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<Props> = (props) => (
  <button
    type={props.type ?? "button"}
    disabled={props.disabled}
    onClick={props.onClick}
    className={classNames(
      "border rounded-md bg-indigo-950 border-indigo-600  ",
      "text-white",
      props.compact ? "p-1 text-xs" : "p-2 px-4 font-semibold",
      "hover:bg-indigo-900 hover:shadow-md hover:shadow-fuchsia-500",
      {
        "bg-indigo-500": props.theme === "primary",
      }
    )}
  >
    {props.children}
  </button>
);
