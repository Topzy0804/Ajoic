import { getAuthedUser } from '@/lib/get-user';

export default async function DashboardPage() {

  const { profile } = await getAuthedUser();

    return (
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
        Welcome, {profile?.fullName ?? "there"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        This is your dashboard. Wallet balance and group activity will show up
        here.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Wallet balance</p>
        <p className="mt-1 text-2xl font-semibold text-green-800">
          ₦{Number(profile?.walletBalance ?? 0).toLocaleString("en-NG")}
        </p>
      </div>
      </div>
    );
}