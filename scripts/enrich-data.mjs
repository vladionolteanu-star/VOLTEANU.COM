import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const apiKey = process.env.CHANNEL3_API_KEY;

if (!apiKey) {
  console.error("Missing CHANNEL3_API_KEY in .env");
  process.exit(1);
}

const BASE_URL = "https://api.trychannel3.com";

async function fetchProduct(id) {
  const res = await fetch(`${BASE_URL}/v1/products/${id}`, {
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    console.error(`Failed to fetch ${id}: ${res.status}`);
    return null;
  }
  return res.json();
}

function pickMainImage(images = []) {
  const cleaned = images.find((i) => i.is_main_image && i.is_cleaned_image);
  const main = images.find((i) => i.is_main_image);
  return cleaned ?? main ?? images[0] ?? null;
}

async function main() {
  const sitesDir = join(ROOT, "sites");
  const sites = readdirSync(sitesDir);
  
  for (const site of sites) {
    const file = join(sitesDir, site, "data", "collection.json");
    if (!existsSync(file)) continue;
    console.log(`Processing ${file}...`);
    const data = JSON.parse(readFileSync(file, "utf8"));
    let updated = 0;
    
    for (const item of data.items) {
      if (item.alt_text !== undefined) continue; // already enriched
      
      const product = await fetchProduct(item.id);
      if (!product) continue;
      
      const imageObj = pickMainImage(product.images);
      
      item.alt_text = imageObj?.alt_text ?? "";
      item.description = product.description ?? "";
      item.key_features = product.key_features ?? [];
      updated++;
      
      // Be polite to the API
      await new Promise((r) => setTimeout(r, 100));
    }
    
    if (updated > 0) {
      writeFileSync(file, JSON.stringify(data, null, 2));
      console.log(`Updated ${updated} items in ${file}`);
    } else {
      console.log(`No items needed updating in ${file}`);
    }
  }
}

main().catch(console.error);
