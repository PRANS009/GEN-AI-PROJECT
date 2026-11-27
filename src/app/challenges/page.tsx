import { ChallengesView } from "@/components/challenges";
import { account } from "@/server/auth";
import { getUserLearningState } from "@/server/user-state";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const user = await account();
  const state = user ? await getUserLearningState(user.id, user.email ?? null) : null;
  return (
    <ChallengesView
      initialChallengeId={state?.last_challenge_id || "chal_1"}
      initialSolved={state?.solved_challenges || []}
      userEmail={user?.email || null}
    />
  );
}
