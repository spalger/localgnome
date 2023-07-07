import { z } from "zod";
import * as Rx from "rxjs";

import { toError } from "./errors";

export const RemoteObsNotif = z.union([
  z.object({
    kind: z.literal("C"),
  }),
  z.object({
    kind: z.literal("N"),
    value: z.any(),
  }),
  z.object({
    kind: z.literal("E"),
    error: z.object({
      name: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    }),
  }),
]);

export type RemoteObsNotif = z.infer<typeof RemoteObsNotif>;

export function toRemoteObsNotif(
  notif: Rx.ObservableNotification<any>
): RemoteObsNotif {
  if (notif.kind === "E") {
    const error = toError(notif.error);
    return {
      kind: "E",
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    };
  }

  return notif;
}

export function toRxjsNotif<T>(
  notif: RemoteObsNotif,
  valueSchema: z.Schema<T>
): Rx.ObservableNotification<T> {
  const parsed = RemoteObsNotif.parse(notif);

  switch (parsed.kind) {
    case "C":
      return parsed;
    case "N":
      return {
        kind: "N",
        value: valueSchema.parse(parsed.value),
      };
    case "E":
      const error = new Error(parsed.error.message);
      error.name = parsed.error.name;
      error.stack = parsed.error.stack;
      return {
        kind: "E",
        error,
      };
  }
}
