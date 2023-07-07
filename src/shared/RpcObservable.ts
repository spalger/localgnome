import { z } from "zod";

export type RpcObservableState<T> =
  | {
      type: "complete";
    }
  | {
      type: "next";
      value: T;
    }
  | {
      type: "error";
      error: unknown;
    };

export const RpcObservableSchema = z.union([
  z.object({
    type: z.literal("complete"),
  }),
  z.object({
    type: z.literal("next"),
    value: z.unknown(),
  }),
  z.object({
    type: z.literal("error"),
    error: z.unknown(),
  }),
]);
