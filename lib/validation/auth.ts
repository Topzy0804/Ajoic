import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const verifyOtpSchema = z.object({
  code: z
    .string()
    .length(8, "Enter the 8-digit code")
    .regex(/^\d+$/, "Code must be numbers only"),
});
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;