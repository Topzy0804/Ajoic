'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupFormValues } from "@/lib/validation/group";
import { createGroup } from "./action";
import { toast } from "sonner";

export default function NewGroupPage() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
  });

  const selectedFrequency = watch('frequency');

  async function onSubmit(values: CreateGroupFormValues) {
    setFormError(null);
    const result = await createGroup(values);

    if (result && 'error' in result) {
      setFormError(result.error)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-neutral-900">Create a group</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Set up a new thrift group. You&apos;ll be the owner and first member.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6"
        noValidate
      >
        <div>
          <label htmlFor="name" className="text-sm font-medium text-neutral-700">
            Group name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            placeholder="e.g. Office Ajo Circle"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-medium text-neutral-700">
            Description <span className="text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            placeholder="What's this group for?"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
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
              placeholder="5000"
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
              placeholder="10"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
            {errors.memberCap && (
              <p className="mt-1 text-sm text-red-600">{errors.memberCap.message}</p>
            )}
          </div>
        </div>

        <div>
  <label
    htmlFor="frequency"
    className="text-sm font-medium text-neutral-700"
  >
    Contribution frequency
  </label>

  <select
    id="frequency"
    {...register("frequency")}
    defaultValue=""
    className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
  >
    <option value="" disabled>
      Select frequency
    </option>

    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
    <option value="custom">Custom</option>
  </select>

  {errors.frequency && (
    <p className="mt-1 text-sm text-red-600">
      {errors.frequency.message}
    </p>
  )}

  {selectedFrequency === "custom" && (
    <div className="mt-3">
      <label
        htmlFor="customFrequencyDays"
        className="text-sm font-medium text-neutral-700"
      >
        Custom interval
      </label>

      <div className="mt-1 flex items-center gap-2">
        <span className="text-sm text-neutral-500">Every</span>

        <input
          id="customFrequencyDays"
          type="number"
          min={1}
          max={365}
          {...register("customFrequencyDays")}
          placeholder="10"
          className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
        />

        <span className="text-sm text-neutral-500">days</span>
      </div>

      {errors.customFrequencyDays && (
        <p className="mt-1 text-sm text-red-600">
          {errors.customFrequencyDays.message}
        </p>
      )}

      <p className="mt-1 text-xs text-neutral-500">
        Choose how many days should pass between contributions.
      </p>
    </div>
  )}
</div>

        <div className="border-t border-neutral-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Payment method</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
              Offline (bank transfer) — online coming soon
            </span>
          </div>
          <p className="mb-4 text-sm text-neutral-500">
            Members will pay directly into this account, then upload a receipt
            for you to confirm each cycle.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="payoutAccountName"
                className="text-sm font-medium text-neutral-700"
              >
                Account name
              </label>
              <input
                id="payoutAccountName"
                type="text"
                {...register("payoutAccountName")}
                placeholder="Account holder's name"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
              />
              {errors.payoutAccountName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.payoutAccountName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="payoutAccountNumber"
                  className="text-sm font-medium text-neutral-700"
                >
                  Account number
                </label>
                <input
                  id="payoutAccountNumber"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  {...register("payoutAccountNumber")}
                  placeholder="0123456789"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                />
                {errors.payoutAccountNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.payoutAccountNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="payoutBankName"
                  className="text-sm font-medium text-neutral-700"
                >
                  Bank name
                </label>
                <input
                  id="payoutBankName"
                  type="text"
                  {...register("payoutBankName")}
                  placeholder="e.g. GTBank"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                />
                {errors.payoutBankName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.payoutBankName.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {isSubmitting ? "Creating group..." : "Create group"}
        </button>
      </form>
    </div>
  )
}