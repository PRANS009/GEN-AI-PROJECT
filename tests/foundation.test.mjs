import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { runPreview } from "../workers/preview.mjs";
import datasets from "../content/datasets.json" with { type: "json" };

test("all fixed sample tables execute in fresh bounded SQLite workers", async () => {
  for (const db of datasets)
    for (const table of db.tables) {
      const result = await runPreview(db.id, table.name);
      assert.deepEqual(result.rows, table.rows);
      assert.ok(result.columns.some((c) => c.pk));
    }
});
test("unknown sample fails and a timeout leaves the next worker usable", async () => {
  await assert.rejects(runPreview("unknown", "students"), /Unknown sample/);
  await assert.rejects(
    runPreview("student_management", "students", 1),
    /timed out/,
  );
  const sample = await runPreview("student_management", "enrolments");
  assert.equal(sample.foreignKeys.length, 2);
});
test("foundation migration provisions profiles and enforces owner policies", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role authenticated; create role anon;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;`);
    const one = crypto.randomUUID(),
      two = crypto.randomUUID();
    await db.query("insert into auth.users values ($1)", [one]);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261126000100_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.query("insert into auth.users values ($1)", [two]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      one,
    ]);
    assert.deepEqual((await db.query("select id from public.profiles")).rows, [
      { id: one },
    ]);
    assert.equal(
      (
        await db.query("update profiles set display_name='Other' where id=$1", [
          two,
        ])
      ).affectedRows,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update profiles set display_name='Student' where id=$1",
          [one],
        )
      ).affectedRows,
      1,
    );
    await assert.rejects(
      db.query("update profiles set id=$1", [two]),
      /permission denied/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      two,
    ]);
    assert.deepEqual(
      (await db.query("select id,display_name from profiles")).rows,
      [{ id: two, display_name: "Learner" }],
    );
    await db.exec("reset role; set role anon");
    assert.equal(
      (await db.query("select public.studio_schema_version() v")).rows[0].v,
      1,
    );
    await assert.rejects(
      db.query("select * from profiles"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
