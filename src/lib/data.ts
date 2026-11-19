import { createClient } from "@/lib/supabase/server";
import type { DashboardData } from "@/lib/types";

export async function getDashboardData(
  monthKey: string,
): Promise<DashboardData> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard", {
    p_month: `${monthKey}-01`,
  });

  if (error) {
    console.error("get_dashboard_failed", error);
    throw new Error(
      "Could not load your ledger. Check that the Supabase migration has been applied.",
    );
  }

  if (!data) {
    throw new Error("The dashboard returned no data.");
  }

  return data as unknown as DashboardData;
}
