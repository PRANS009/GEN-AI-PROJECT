import { runPreview, type SampleResult } from "../../../../workers/preview.mjs";
import datasets from "../../../../content/datasets.json";
import { logActivity } from "@/server/activity";

export const runtime = "nodejs";
// Only fixed, public seed views are cached. Distinct valid keys are bounded by the catalogue.
const samples = new Map<string, Promise<SampleResult>>();
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const dataset = datasets.find((item) => item.id === params.get("database"));
  const table = dataset?.tables.find(
    (item) => item.name === params.get("table"),
  );
  if (!dataset || !table)
    return Response.json(
      { error: "Choose a sample database and table." },
      { status: 400 },
    );
  const key = dataset.id + "/" + table.name;
  let pending = samples.get(key);
  if (!pending) {
    pending = runPreview(dataset.id, table.name);
    samples.set(key, pending);
  }
  try {
    const result = await pending;
    void logActivity({
      eventType: "explorer.preview",
      module: "explorer",
      action: "preview_table",
      status: "success",
      description: `Inspected ${dataset.id}.${table.name}`,
      durationMs: Math.round(result.durationMs),
      metadata: { database: dataset.id, table: table.name },
    });
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    samples.delete(key);
    void logActivity({
      eventType: "explorer.preview",
      module: "explorer",
      action: "preview_table",
      status: "failure",
      description: `Failed to inspect ${dataset.id}.${table.name}`,
      metadata: { database: dataset.id, table: table.name },
    });
    return Response.json(
      { error: "The sample database could not be opened. Try again." },
      { status: 503 },
    );
  }
}
