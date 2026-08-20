"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormValues } from "@/lib/validation/auth";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(values: SignInFormValues) {
    setFormError(null);
    setNeedsVerification(false);

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
      } else {
        setFormError(error.message);
      }
      return;
    }
    toast.success("Signed in successfully!");

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Sign in to Ajo</h1>
      <p className="mt-1 text-sm text-neutral-500">Welcome back.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        {needsVerification && (
          <p className="text-sm text-amber-600">
            Your email isn&apos;t verified yet.{" "}
            <Link
              href={`/verify-otp?email=${encodeURIComponent(
                getValues("email")
              )}&type=signup`}
              className="font-medium underline"
            >
              Verify it now
            </Link>
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-green-700 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}

