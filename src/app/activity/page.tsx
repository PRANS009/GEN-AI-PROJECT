import { account } from "@/server/auth";
import { ActivityHistoryView } from "@/components/activity-history";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await account();
  return <ActivityHistoryView signedIn={!!user} />;
}
