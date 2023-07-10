import { Handler } from "./types";

export const ConfigReadHandler: Handler<"config:read"> = ({ config }) => {
  return config.value$;
};

export const ConfigUpdateHandler: Handler<"config:update"> = (
  { config },
  update
) => {
  return config.update$(update);
};
