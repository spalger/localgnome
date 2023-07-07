export function toError(val: unknown) {
  if (val instanceof Error) {
    return val;
  }

  if (typeof val === "string") {
    return new Error(`the string "${val}" was thrown.`);
  }

  return new Error(`an unknown value was thrown.`);
}
