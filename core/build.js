// Generic data pipeline: node --env-file=.env core/build.js <siteId> [batch]
// Loads sites/<siteId>/universe.js, executes its acquisition plan against
// the Channel3 API, writes sites/<siteId>/data/collection.json.
//
// With [batch]: runs only queries tagged { batch: N } and merges the results
// into the existing collection instead of rebuilding it — credits are spent
// on the new queries only. Existing items seed the dedupe fingerprints and
// retailer caps, and are re-screened against globalExclude on the way in.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "./channel3.js";
import { passesTheme, normalize, isSellable, fingerprint, ev } from "./curation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const siteId = process.argv[2];
  if (!siteId) {
    console.error("Usage: node core/build.js <siteId>   (a folder in sites/)");
    process.exit(1);
  }
  const siteDir = join(__dirname, "..", "sites", siteId);
  const { default: universe } = await import(
    pathToFileURL(join(siteDir, "universe.js")).href
  );
  const OUT = join(siteDir, "data", "collection.json");

  const client = createClient(process.env.CHANNEL3_API_KEY, {
    country: process.env.CHANNEL3_COUNTRY ?? "US",
    currency: process.env.CHANNEL3_CURRENCY ?? "USD",
  });

  const byId = new Map();
  const byFingerprint = new Map();
  const retailerCount = new Map();
  const retailerCap = universe.retailerCapPerChapter ?? 3;

  const tryAdd = (record) => {
    if (byId.has(record.id)) return false;

    const fp = fingerprint(record);
    const twin = byFingerprint.get(fp);
    if (twin) {
      if (ev(record) <= ev(twin)) return false;
      byId.delete(twin.id);
      const rk = `${twin.chapter}|${twin.retailer}`;
      retailerCount.set(rk, (retailerCount.get(rk) ?? 1) - 1);
    }

    const rk = `${record.chapter}|${record.retailer}`;
    if ((retailerCount.get(rk) ?? 0) >= retailerCap) return false;

    byId.set(record.id, record);
    byFingerprint.set(fp, record);
    retailerCount.set(rk, (retailerCount.get(rk) ?? 0) + 1);
    return true;
  };

  const batch = process.argv[3] ? Number(process.argv[3]) : null;
  let queries = universe.queries;
  if (batch != null) {
    queries = universe.queries.filter((q) => q.batch === batch);
    if (queries.length === 0) {
      console.error(`No queries tagged { batch: ${batch} } in this universe.`);
      process.exit(1);
    }
    let seeded = 0;
    let dropped = 0;
    const prev = JSON.parse(readFileSync(OUT, "utf8"));
    for (const item of prev.items ?? []) {
      if (universe.globalExclude.test(item.title ?? "")) {
        dropped++;
        continue;
      }
      byId.set(item.id, item);
      byFingerprint.set(fingerprint(item), item);
      const rk = `${item.chapter}|${item.retailer}`;
      retailerCount.set(rk, (retailerCount.get(rk) ?? 0) + 1);
      seeded++;
    }
    console.log(
      `Merge mode: ${seeded} existing items kept, ${dropped} re-screened out, running ${queries.length} batch-${batch} queries.\n`
    );
  }

  let queriesRun = 0;
  let aborted = null;
  for (const spec of queries) {
    const filters = {};
    if (spec.price) filters.price = spec.price;
    if (spec.gender) filters.gender = spec.gender;

    // Out of credits mid-run is survivable: keep what we have, ship smaller.
    let products;
    try {
      products = await client.searchAll(spec.query, { filters, maxPages: 2 });
    } catch (err) {
      aborted = err.message;
      break;
    }
    queriesRun++;

    const candidates = products
      .filter((p) => passesTheme(p, spec, universe))
      .map((p) => normalize(p, spec))
      .filter(isSellable);

    if (spec.collection === "in_style") candidates.sort((a, b) => ev(b) - ev(a));

    let kept = 0;
    for (const record of candidates) {
      if (kept >= spec.cap) break;
      if (tryAdd(record)) kept++;
    }
    console.log(
      `${spec.chapter.padEnd(10)} ${String(kept).padStart(2)}/${spec.cap}  ${spec.query.slice(0, 60)}`
    );
  }

  const items = [...byId.values()];
  if (aborted && items.length === 0) {
    console.error(`API failed before anything was collected: ${aborted}`);
    process.exit(1);
  }
  if (aborted) {
    console.warn(
      `\nAPI stopped after ${queriesRun}/${queries.length} queries (${aborted}); writing the partial collection.`
    );
  }
  const chapterCounts = Object.fromEntries(
    universe.chapters.map((c) => [c.key, items.filter((i) => i.chapter === c.key).length])
  );
  const payload = {
    site: siteId,
    generatedAt: new Date().toISOString(),
    counts: {
      total: items.length,
      official: items.filter((i) => i.collection === "official").length,
      in_style: items.filter((i) => i.collection === "in_style").length,
      chapters: chapterCounts,
    },
    items,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(
    `\n${items.length} items | chapters: ${JSON.stringify(chapterCounts)} | ~${queriesRun * 2} API credits`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
