import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/data";
import { resolveMonthKey } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your monthly salary and expense ledger.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthKey = resolveMonthKey(params.month);
  const data = await getDashboardData(monthKey);

  return <DashboardView data={data} monthKey={monthKey} />;
}
