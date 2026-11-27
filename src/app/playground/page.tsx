import { SqlPlayground } from "@/components/playground";
import { account } from "@/server/auth";
import { getUserLearningState } from "@/server/user-state";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ database?: string }>;
}) {
  const [{ database }, user] = await Promise.all([searchParams, account()]);
  const state = user ? await getUserLearningState(user.id, user.email ?? null) : null;
  return (
    <SqlPlayground
      defaultDb={database || state?.last_database || "student_management"}
      initialSql={state?.playground_sql}
    />
  );
}
