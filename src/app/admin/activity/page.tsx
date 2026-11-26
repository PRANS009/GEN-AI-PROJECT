import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/server/auth";
import { AdminActivityDashboard } from "@/components/admin-activity";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const gate = await requireAdmin();
  if (!gate.authorized) {
    if (gate.status === 401) {
      redirect("/login");
    }
    return (
      <div className="page">
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-[var(--surface)] p-8 text-center max-w-md mx-auto mt-10 space-y-3">
          <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-[var(--ink)]">403 · Access Denied</h1>
          <p className="text-sm text-[var(--muted)]">
            Administrator privileges are required to view platform-wide activity monitoring.
          </p>
        </div>
      </div>
    );
  }

  return <AdminActivityDashboard />;
}
