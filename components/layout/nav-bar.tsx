'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {   MoreVertical } from 'lucide-react';

export function Navbar({ fullName }: { fullName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/sign-in');
  }

  return (
    <header className='flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6'>
      <div />
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium text-neutral-700'>{fullName}</span>
        <Button
          onClick={handleLogOut}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3e5c46] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e4636]"
        >
          <MoreVertical className='h-4 w-4 text-white' />
          Log out
        </Button>
      </div>
    </header>
  );
}