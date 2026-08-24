"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { users, walletTransactions } from "@/lib/db/schema";
import { walletAmountSchema, type WalletAmountFormValues } from "@/lib/validation/wallet";

type WalletResult = { error: string } | { success: true };

export async function depositFunds(input: WalletAmountFormValues): Promise<WalletResult> {
  const { authUser } = await getAuthedUser();

  const parsed = walletAmountSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid amount" };
  }

  await db.transaction(async (tx)  => {
    const [user] = await tx.select().from(users).where(eq(users.id, authUser.id)).limit(1);

    const newBalance = (Number(user.walletBalance) + parsed.data.amount).toFixed(2);

    await tx.insert(walletTransactions).values({
      userId: authUser.id,
      type: "deposit",
      amount: parsed.data.amount.toFixed(2),
      status: "completed",
    });

    await tx.update(users).set({ walletBalance: newBalance }).where(eq(users.id, authUser.id));
  });

  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  revalidatePath("/wallet/transaction");
  return { success: true };
}

export async function withdrawFunds(input: WalletAmountFormValues): Promise<WalletResult> {
  const { authUser } = await getAuthedUser();

  const parsed = walletAmountSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid amount" };
  }

  let result: WalletResult = { success: true };

  await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, authUser.id)).limit(1);

    const currentBalance = Number(user.walletBalance);

    if (parsed.data.amount > currentBalance) {
      result = { error: "Insufficient balance." };
      return;
    }

    const newBalance = (currentBalance - parsed.data.amount).toFixed(2);

    await tx.insert(walletTransactions).values({
      userId: authUser.id,
      type: "withdrawal",
      amount: parsed.data.amount.toFixed(2),
      status: "completed",
    });

    await tx.update(users).set({ walletBalance: newBalance }).where(eq(users.id, authUser.id));
  });

  if ("success" in result) {
    revalidatePath("/dashboard");
    revalidatePath("/wallet");
    revalidatePath("/wallet/transactions");
  }
  return result;
}