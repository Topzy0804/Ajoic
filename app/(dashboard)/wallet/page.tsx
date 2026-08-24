import Link from "next/link";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { walletTransactions } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils/format";
import { WalletActions } from "@/components/wallet/wallet-action";

const TYPE_LABEL: Record<string, string> = {
  deposit: "Added funds",
  withdrawal: "Withdrew funds",
  contribution: "Group contribution",
  payout: "Group payout",
};

export default async function WalletPage() {
  const { authUser, profile } = await getAuthedUser();

  const recentTransactions = await db.query.walletTransactions.findMany({
    where: eq(walletTransactions.userId, authUser.id),
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit: 5,
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-neutral-900">Wallet</h1>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500">Balance</p>
        <p className="mt-1 text-3xl font-semibold text-green-800">
          {formatCurrency(profile?.walletBalance ?? 0)}
        </p>

        <div className="mt-5">
          <WalletActions />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-sm font-medium text-neutral-900">Recent activity</h2>
          <Link
            href="/wallet/transaction"
            className="text-sm font-medium text-green-700 underline"
          >
            View all
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-neutral-500">
            No transactions yet.
          </p>
        ) : (
          <ul>
            {recentTransactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm text-neutral-800">{TYPE_LABEL[t.type] ?? t.type}</p>
                  <p className="text-xs text-neutral-400">
                    {t.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    t.type === "deposit" || t.type === "payout"
                      ? "text-green-700"
                      : "text-neutral-700"
                  }`}
                >
                  {t.type === "deposit" || t.type === "payout" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}