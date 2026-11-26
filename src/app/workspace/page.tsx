import { Explorer } from "@/components/explorer";
export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ database?: string }>;
}) {
  const { database } = await searchParams;
  return <Explorer key={database} id={database || "student_management"} />;
}
