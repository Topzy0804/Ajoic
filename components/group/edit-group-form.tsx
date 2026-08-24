"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupFormValues } from "@/lib/validation/group";
import { updateGroup } from "@/app/(dashboard)/group/[groupId]/settings/action";
import type { groups } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

type GroupRow = typeof groups.$inferSelect;

export function EditGroupForm({
  groupId,
  group
}: {
  groupId: string;
  group: GroupRow
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description ?? "",
      contributionAmount: Number(group.contributionAmount),
      frequency: group.frequency,
      customFrequencyDays: group.customFrequencyDays ?? undefined,
      memberCap: group.memberCap,
      payoutAccountName: group.payoutAccountName ?? "",
      payoutAccountNumber: group.payoutAccountNumber ?? "",
      payoutBankName: group.payoutBankName ?? "",
    },
  });

  const frequency = watch("frequency");

  async function onSubmit(values: CreateGroupFormValues) {
    setFormError(null);
    setSaved(false);
    const result = await updateGroup(groupId, values);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          Group name
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-neutral-700">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          {...register("description")}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contributionAmount"
            className="text-sm font-medium text-neutral-700"
          >
            Contribution amount (₦)
          </label>
          <input
            id="contributionAmount"
            type="number"
            step="0.01"
            {...register("contributionAmount")}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.contributionAmount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.contributionAmount.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="memberCap" className="text-sm font-medium text-neutral-700">
            Member cap
          </label>
          <input
            id="memberCap"
            type="number"
            {...register("memberCap")}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.memberCap && (
            <p className="mt-1 text-sm text-red-600">{errors.memberCap.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="frequency" className="text-sm font-medium text-neutral-700">
          Contribution frequency
        </label>
        <select
          id="frequency"
          {...register("frequency")}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom — every X days</option>
        </select>
      </div>

      {frequency === "custom" && (
        <div>
          <label
            htmlFor="customIntervalDays"
            className="text-sm font-medium text-neutral-700"
          >
            Every how many days?
          </label>
          <input
            id="customIntervalDays"
            type="number"
            min={1}
            max={365}
            {...register("customFrequencyDays")}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.customFrequencyDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.customFrequencyDays.message}
            </p>
          )}
        </div>
      )}

      <div className="border-t border-neutral-200 pt-4" id="payout-account">
        <p className="mb-3 text-sm font-medium text-neutral-700">Payout account</p>
        <div className="flex flex-col gap-3">
          <input
            {...register("payoutAccountName")}
            placeholder="Account name"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              {...register("payoutAccountNumber")}
              placeholder="Account number"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
            <input
              {...register("payoutBankName")}
              placeholder="Bank name"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>
        </div>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}
      {saved && !formError && <p className="text-sm text-green-700">Saved.</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
