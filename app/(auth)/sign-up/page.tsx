"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormValues } from "@/lib/validation/auth";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpFormValues) {
    setFormError(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
      },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    toast.success("Account created successfully! Please check your email for the verification code.");

    router.push(`/verify-otp?email=${encodeURIComponent(values.email)}&type=signup`);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        We&apos;ll send a code to verify your email.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="fullName" className="text-sm font-medium text-neutral-700">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            {...register("fullName")}
            placeholder="Chidi Okafor"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

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
            placeholder="At least 8 characters"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-neutral-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Sign up"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-green-700 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}