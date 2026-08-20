'use server';

import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/get-user';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/db/schema';
import { createGroupSchema, type CreateGroupFormValues } from '@/lib/validation/group';

type CreateGroupResult = { error: string } | never;

export async function createGroup(
  input: CreateGroupFormValues
): Promise<CreateGroupResult> {
  const { authUser } = await getAuthedUser();

  const parsed = createGroupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  let newGroupId: string;

  try {
    newGroupId = await db.transaction(async (tx) => {
      const [group] = await tx
        .insert(groups)
        .values({
          name: data.name,
          description: data.description || null,
          contributionAmount: data.contributionAmount.toFixed(2),
          frequency: data.frequency,
          customFrequencyDays: data.frequency === 'custom'
            ? data.customFrequencyDays
            : null,
          memberCap: data.memberCap,
          ownerId: authUser.id,
          paymentMethod: 'offline',
          payoutAccountName: data.payoutAccountName,
          payoutAccountNumber: data.payoutAccountNumber,
          payoutBankName: data.payoutBankName,
        })
        .returning({ id: groups.id });

        await tx.insert(groupMembers).values({
          groupId: group.id,
          userId: authUser.id,
          role: 'owner',
          position: 1,
        });

        return group.id;
        });
    } catch (err) {
      console.error('createGroup failed:', err);
      return { error: 'Something went wrong creating the group. Please try again.' };
    }
    
    redirect(`/dashboard/group/${newGroupId}`);
  }