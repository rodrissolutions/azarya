import { z } from "zod";

export const Cents = z.number().int().nonnegative();
export type Cents = z.infer<typeof Cents>;

export const Currency = z.literal("USD");
export type Currency = z.infer<typeof Currency>;

export const Money = z.object({
  amountCents: Cents,
  currency: Currency,
});
export type Money = z.infer<typeof Money>;
