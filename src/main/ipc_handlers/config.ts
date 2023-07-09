import { Handler } from "./types";

export const configRead: Handler<"config:read"> = ({ config }) => {
  return config.value$;
};

export const configUpdate: Handler<"config:update"> = ({ config }, update) => {
  return config.update$(update);
};
