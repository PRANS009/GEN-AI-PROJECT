import { SqlPlayground } from "@/components/playground";

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ database?: string }>;
}) {
  const { database } = await searchParams;
  return <SqlPlayground defaultDb={database || "student_management"} />;
}
