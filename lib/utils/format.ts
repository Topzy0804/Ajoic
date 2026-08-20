import type { groups } from "@/lib/db/schema";

type GroupFrequencyRow = Pick<
typeof groups.$inferSelect,
"frequency" | "customFrequencyDays"
>;

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-Ng", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFrequency(group: GroupFrequencyRow): string {
  switch (group.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "custom":
      return `Every ${group.customFrequencyDays ?? "?"} day${
        group.customFrequencyDays === 1 ? "" : "s"
      }`;
    default:
      return group.frequency;
  }
}