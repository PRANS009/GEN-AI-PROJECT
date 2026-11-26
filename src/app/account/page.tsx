import { redirect } from "next/navigation";
import { account, authClient } from "@/server/auth";
import { renameProfile, signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await account();
  if (!user) redirect("/login");
  const client = await authClient();
  const { data, error } = await client!
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const { notice } = await searchParams;
  return (
    <div className="page">
      <div className="heading">
        <h1>Your account</h1>
        <p>{user.email}</p>
      </div>
      <section className="account-card">
        <h2>Profile</h2>
        {error ? (
          <p role="alert">
            Your profile could not be loaded. Check the database migration.
          </p>
        ) : (
          <form action={renameProfile}>
            <label>
              Display name
              <input
                required
                name="name"
                maxLength={60}
                defaultValue={data.display_name}
              />
            </label>
            <Button>Save changes</Button>
          </form>
        )}
        {notice && (
          <p role="status">
            {notice === "saved"
              ? "Profile saved."
              : "The change could not be completed. Try again."}
          </p>
        )}
        <form action={signOut}>
          <Button variant="outline">Sign out</Button>
        </form>
      </section>
    </div>
  );
}
