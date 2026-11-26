import { runPreview, type SampleResult } from "../../../../workers/preview.mjs";
import datasets from "../../../../content/datasets.json";

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
    return Response.json(await pending, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    samples.delete(key);
    return Response.json(
      { error: "The sample database could not be opened. Try again." },
      { status: 503 },
    );
  }
}
