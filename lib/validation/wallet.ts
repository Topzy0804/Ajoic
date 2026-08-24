import { z } from "zod";

export const walletAmountSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount is too large"),
});

export type WalletAmountFormValues = z.infer<typeof walletAmountSchema>;