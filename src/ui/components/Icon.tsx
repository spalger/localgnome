// @ts-expect-error
import iconsSvgPath from "file-loader!bootstrap-icons/bootstrap-icons.svg";
import type Icons from "bootstrap-icons/font/bootstrap-icons.json";

export type IconName = keyof typeof Icons;

interface Props {
  name: IconName;
}

export const Icon: React.FC<Props> = ({ name }) => (
  <svg className="bi" width="16" height="16" fill="currentColor">
    <use xlinkHref={`${iconsSvgPath}#${name}`} />
  </svg>
);
