// Generic data pipeline: node --env-file=.env core/build.js <siteId>
// Loads sites/<siteId>/universe.js, executes its acquisition plan against
// the Channel3 API, writes sites/<siteId>/data/collection.json.

import { writeFileSync, mkdirSync } from "node:fs";
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

  let queriesRun = 0;
  for (const spec of universe.queries) {
    const filters = {};
    if (spec.price) filters.price = spec.price;
    if (spec.gender) filters.gender = spec.gender;

    const products = await client.searchAll(spec.query, { filters, maxPages: 2 });
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
