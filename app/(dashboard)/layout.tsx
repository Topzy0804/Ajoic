import { getAuthedUser } from '@/lib/get-user';
import { Sidebar } from '@/components/layout/side-bar';
import { Navbar } from '@/components/layout/nav-bar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { profile } = await getAuthedUser();
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar fullName={profile?.fullName ?? "Account"} />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  );
}