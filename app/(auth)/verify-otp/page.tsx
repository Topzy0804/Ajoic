"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/lib/validation/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

import { toast } from 'sonner';


function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const email = searchParams.get("email") ?? "";
  const type = (searchParams.get("type") as EmailOtpType) ?? "signup";

  const [formError, setFormError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
  });

  async function onSubmit(values: VerifyOtpFormValues) {
    setFormError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: values.code,
      type,
    });

    if (error) {
      setFormError(error.message);
      return;
    }
    toast.success("Email verified successfully!");

    router.refresh();
    router.push("/dashboard");
  }

  async function handleResend() {
    setFormError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setFormError(error.message);
      return;
    }
    setResent(true);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Verify your email</h1>
      <p className="mt-1 text-sm text-neutral-500">
        We sent a 6-digit code to <span className="font-medium">{email}</span>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="code" className="text-sm font-medium text-neutral-700">
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            {...register("code")}
            placeholder="12345678"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {resent && !formError && (
          <p className="text-sm text-green-700">New code sent — check your inbox.</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {isSubmitting ? "Verifying..." : "Verify & continue"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
        >
          Resend code
        </button>
      </form>
    </div>
  );
}

export default function verifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}