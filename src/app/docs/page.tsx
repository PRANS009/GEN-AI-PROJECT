import Link from "next/link";
import { Download, HeartPulse, Database } from "lucide-react";
export default function Docs() {
  return (
    <div className="page">
      <div className="heading">
        <h1>Developer guide</h1>
        <p>Work with the running foundation and its public API contract.</p>
      </div>
      <div className="doc-grid">
        <article>
          <HeartPulse />
          <h2>Service readiness</h2>
          <p>
            The health check verifies the Supabase connection and the installed
            application schema version. A ready deployment returns HTTP 200. An
            unavailable database returns 503.
          </p>
          <pre>GET /api/health</pre>
          <a className="button outline" href="/api/health">
            Open health check
          </a>
        </article>
        <article>
          <Database />
          <h2>Sample data</h2>
          <p>
            Explore four synthetic datasets. Table previews come from an
            isolated, memory-limited SQLite worker using the packaged seed
            records.
          </p>
          <Link className="button outline" href="/workspace">
            Open explorer
          </Link>
        </article>
        <article>
          <Download />
          <h2>Versioned API contract</h2>
          <p>
            The Phase 0 contract describes the planned developer API. The health
            endpoint is implemented in this release.
          </p>
          <a className="button outline" href="/openapi.yaml" download>
            Download OpenAPI
          </a>
        </article>
      </div>
    </div>
  );
}
