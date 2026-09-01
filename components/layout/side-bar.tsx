'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Groups', href: '/group' },
  { label: 'Notifications', href: '/notification' },
  { label: 'Profile', href: '/profile' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='flex h-screen w-56 flex-col border-r border-neutral-200 bg-green-800 text-white'>
      <div className='flex items-center gap-2 p-5 bg-white text-green-800 border-r-2 border-green-700'>
        <Image src="/logo.png" alt="Ajo Logo" width={28} height={28} />
        <span className='text-lg font-semibold'>Ajo</span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-green-100 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  )
}