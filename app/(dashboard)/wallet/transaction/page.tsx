import Link from "next/link";
import { eq } from "drizzle-orm";
import { getAuthedUser } from "@/lib/get-user";
import { db } from "@/lib/db";
import { walletTransactions } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils/format";

const TYPE_LABEL: Record<string, string> = {
  deposit: "Added funds",
  withdrawal: "Withdrew funds",
  contribution: "Group contribution",
  payout: "Group payout",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  completed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
};

export default async function TransactionsPage() {
  const { authUser } = await getAuthedUser();

  const transactions = await db.query.walletTransactions.findMany({
    where: eq(walletTransactions.userId, authUser.id),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center gap-2">
        <Link href="/wallet" className="text-sm text-neutral-400 hover:text-neutral-600">
          Wallet
        </Link>
        <span className="text-sm text-neutral-300">/</span>
        <span className="text-sm text-neutral-600">Transactions</span>
      </div>
      <h1 className="mt-1 text-xl font-semibold text-neutral-900">Transaction history</h1>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          No transactions yet.
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white">
          <ul>
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm text-neutral-800">{TYPE_LABEL[t.type] ?? t.type}</p>
                  <p className="text-xs text-neutral-400">
                    {t.createdAt.toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[t.status]}`}
                  >
                    {t.status}
                  </span>
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}