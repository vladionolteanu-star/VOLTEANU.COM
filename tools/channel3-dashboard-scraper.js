/* ============================================================================
 * Channel3 "most generous partners" scraper — RUNS IN THE BROWSER CONSOLE.
 *
 * Why the browser: the /dashboard/websites.data endpoint is authed by a Clerk
 * session cookie that lives ~60s and is auto-refreshed by the tab. Replaying it
 * server-side just bounces to /sign-in. Running here uses your live session.
 *
 * HOW TO USE:
 *   1. Be logged in at trychannel3.com/dashboard/websites (any page).
 *   2. Open DevTools -> "Consolă" (Console) tab.
 *   3. Paste this whole file, press Enter.
 *   4. Wait. It logs progress and, when done, downloads:
 *        channel3-websites.csv   (sorted by commission, high -> low)
 *        channel3-websites.json
 * ========================================================================== */
(async () => {
  const CONCURRENCY = 1;      // super lent, descarcă 1 pagină pe rând (viteza unui om)
  const DELAY_MS = 1500;      // pauză de 1.5 secunde între pagini pentru siguranță 100%
  const MAX_PAGES = Infinity; // trage absolut tot, dar salvează treptat

  // --- turbo-stream decoder (React Router single-fetch .data format) --------
  const NEG = new Map([[-1, null], [-2, NaN], [-3, -Infinity], [-4, -0], [-5, null], [-6, Infinity], [-7, undefined]]);

  function decodeTurbo(text) {
    if (text.includes('"SingleFetchRedirect"')) {
      console.warn("Posibil redirect:", text.substring(0, 200));
    }
    const lines = text.split("\n").filter((l) => l.length);
    const values = [];
    const promiseBase = {};
    for (const line of lines) {
      const m = line.match(/^([A-Za-z])(\d+):(.*)$/s);
      if (m && (m[3][0] === "[" || m[3][0] === "{")) {
        const chunk = JSON.parse(m[3]);
        promiseBase[m[1] + m[2]] = values.length;
        if (Array.isArray(chunk)) for (const e of chunk) values.push(e);
        else values.push(chunk);
      } else if (line[0] === "[") {
        for (const e of JSON.parse(line)) values.push(e);
      }
    }
    const cache = new Array(values.length);
    const done = new Array(values.length).fill(false);
    function hydrate(i) {
      if (typeof i !== "number") return i;
      if (i < 0) return NEG.has(i) ? NEG.get(i) : null;
      if (done[i]) return cache[i];
      const v = values[i];
      if (v === null || typeof v !== "object") { cache[i] = v; done[i] = true; return v; }
      if (Array.isArray(v)) {
        if (typeof v[0] === "string") {
          const tag = v[0];
          if (tag === "P" || tag === "R" || tag === "E") {
            const base = promiseBase["P" + v[1]] ?? promiseBase["R" + v[1]] ?? promiseBase["E" + v[1]];
            const r = base == null ? undefined : hydrate(base);
            if (tag === "E") throw new Error("Server rate-limit/eroare backend: " + JSON.stringify(r));
            cache[i] = r; done[i] = true; return r;
          }
          if (tag === "D") { const d = new Date(hydrate(v[1])); cache[i] = d; done[i] = true; return d; }
          cache[i] = null; done[i] = true; return null;
        }
        const out = []; cache[i] = out; done[i] = true;
        for (const e of v) out.push(hydrate(e));
        return out;
      }
      const out = {}; cache[i] = out; done[i] = true;
      for (const k in v) {
        const key = hydrate(Number(k[0] === "_" ? k.slice(1) : k));
        out[key] = hydrate(v[k]);
      }
      return out;
    }
    return hydrate(0);
  }

  // Deep-find the { items, pagination } node in the decoded tree.
  function findMerchants(root) {
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== "object" || seen.has(n)) continue;
      seen.add(n);
      if (Array.isArray(n.items) && n.pagination) return n;
      for (const k in n) stack.push(n[k]);
    }
    return null;
  }

  async function fetchPageWithRetry(page, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers = { accept: "*/*" };
        if (typeof window !== 'undefined' && window.Clerk && window.Clerk.session) {
          try {
            const token = await window.Clerk.session.getToken();
            if (token) headers.authorization = `Bearer ${token}`;
          } catch (e) {}
        }
        const res = await fetch(`/dashboard/websites.data?page=${page}`, {
          headers,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const root = decodeTurbo(text);
        const node = findMerchants(root);
        if (!node) {
          throw new Error("Date vendor lipsă din răspuns. Posibil rate limit intern.");
        }
        return node;
      } catch (err) {
        if (attempt === retries) throw err;
        console.warn(`[Pagina ${page}] Eroare (încercarea ${attempt}): ${err.message}. Aștept 2 secunde și reîncerc...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // --- run ------------------------------------------------------------------
  console.log("Fetching page 1 to discover total pages...");
  const first = await fetchPageWithRetry(1);
  const totalPages = Math.min(first.pagination.totalPages, MAX_PAGES);
  console.log(`Total: ${first.pagination.totalCount} sites across ${first.pagination.totalPages} pages. Scraping ${totalPages}...`);

  const byId = new Map();
  const absorb = (node) => {
    for (const m of node.items) {
      const rate = typeof m.bestCommissionRate === "number" ? m.bestCommissionRate : null;
      const key = m.merchantId ?? m.primaryDomain ?? m.name;
      byId.set(key, {
        name: m.name ?? "",
        domain: m.primaryDomain ?? "",
        commissionRate: rate,
        productCount: m.productCount ?? null,
      });
    }
  };
  absorb(first);

  const pages = [];
  for (let p = 2; p <= totalPages; p++) pages.push(p);

  const exportData = () => {
    const rows = [...byId.values()].sort(
      (a, b) => (b.commissionRate ?? -1) - (a.commissionRate ?? -1)
    );
    const dl = (name, content, type) => {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    };
    const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv =
      "commission_rate,domain,name,product_count\n" +
      rows.map((r) => [r.commissionRate ?? "", esc(r.domain), esc(r.name), r.productCount ?? ""].join(",")).join("\n");
    
    const count = byId.size;
    dl(`channel3-websites-${count}.csv`, csv, "text/csv");
    dl(`channel3-websites-${count}.json`, JSON.stringify(rows, null, 2), "application/json");
    console.log(`✅ Salvare cu succes! Fisierul conține ${count} vendori.`);
  };

  let done = 1;
  let nextExport = 50;
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(p => fetchPageWithRetry(p)));
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled") absorb(r.value);
      else {
        console.error("❌ EȘEC DEFINITIV la pagina", batch[j], ":", r.reason.message);
      }
    }
    done += batch.length;
    if (done % 10 < CONCURRENCY) console.log(`...am procesat ${done}/${totalPages} pagini (${byId.size} site-uri găsite)`);
    
    if (done >= nextExport) {
      console.log(`Ajuns la pagina ${done}. Facem o salvare intermediară pe parcurs...`);
      exportData();
      nextExport += 50;
    }
    
    if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`DONE FINAL. Extragere completa.`);
  exportData();
})();
