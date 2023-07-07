import { isObj } from "./tsHelpers";

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (isObj(error) && typeof error.message === "string") {
    return new Error(error.message);
  }

  console.error("non error thrown:", error);
  return new Error("Unknown error, see console for details.");
}
