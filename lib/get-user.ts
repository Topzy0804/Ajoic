import { cache } from"react";
import { redirect } from"next/navigation";
import { createClient } from"@/lib/supabase/server";
import { db } from"@/lib/db";
import { users } from"@/lib/db/schema";
import { eq } from"drizzle-orm";

export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [profile] = await db.select().from(users).where(eq(users.id, user?.id)).limit(1);

  return { authUser: user, profile };
});