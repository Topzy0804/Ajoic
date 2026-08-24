"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletAmountSchema, type WalletAmountFormValues } from "@/lib/validation/wallet";
import { depositFunds, withdrawFunds } from "@/app/(dashboard)/wallet/action";
import { Button } from "@/components/ui/button";

export function WalletActions() {
  const router = useRouter();
  const [mode, setMode] = useState<"deposit" | "withdraw" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalletAmountFormValues>({
    resolver: zodResolver(walletAmountSchema),
  });

  function openMode(next: "deposit" | "withdraw") {
    setMode(next);
    setFormError(null);
    reset();
  }

  async function onSubmit(values: WalletAmountFormValues) {
    setFormError(null);
    const action = mode === "deposit" ? depositFunds : withdrawFunds;
    const result = await action(values);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    setMode(null);
    router.refresh();
  }

  if (!mode) {
    return (
      <div className="flex gap-3">
        <Button onClick={() => openMode("deposit")} className="flex-1">
          Add funds
        </Button>
        <Button onClick={() => openMode("withdraw")} className="flex-1">
          Withdraw
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <label htmlFor="amount" className="text-sm font-medium text-neutral-700">
        {mode === "deposit" ? "Amount to add (₦)" : "Amount to withdraw (₦)"}
      </label>
      <input
        id="amount"
        type="number"
        step="0.01"
        autoFocus
        {...register("amount")}
        placeholder="5000"
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
      />
      {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? "Processing..."
            : mode === "deposit"
              ? "Add funds"
              : "Withdraw"}
        </Button>
        <Button
          type="button"
          onClick={() => setMode(null)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}