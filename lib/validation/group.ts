import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name is required')
    .max(100),

  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),

  contributionAmount: z.coerce
    .number({ 
      error: 'Enter a valid amount', 
    })
    .positive('Amount must be greater than 0'),

  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom'], {
    error: 'please pick a frequency',
  }),

  customFrequencyDays: z.coerce
    .number({
      error: 'Enter a valid number of days',
    })
    .int('Number of days must be a whole number')
    .min(1, 'frequency must be at least 1 day')
    .max(365, 'Frequency cannot exceed 365 days')
    .optional(),

memberCap: z.coerce
  .number({ error: 'Enter a valid number' })
  .int()
  .min(2, 'A group needs at least 2 members')
  .max(50, 'Max 50 members'),

payoutAccountName: z
  .string()
  .min(2, 'Account name is required')
  .max(100),

payoutAccountNumber: z
  .string()
  .regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),

payoutBankName: z
  .string()
  .min(2, 'Bank name is required')
  .max(100),
})
.refine(
  (data) =>
    data.frequency !== 'custom' ||
    data.customFrequencyDays !== undefined,
    {
      message: 'please specify the number of days',
      path: ['customFrequencyDays'],
    }
);

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;