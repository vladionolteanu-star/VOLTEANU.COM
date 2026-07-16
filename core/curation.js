// Shared curation logic. A universe (sites/<id>/universe.js) supplies the
// data plan: chapters, queries, match/exclude regexes, caps. This module
// supplies the mechanics that never change between universes.
//
// Contract every universe honors:
//   official  -> direct references to the show. Kept even at 0% commission
//                and out of stock: they are the record.
//   in_style  -> the world around the show. Must pay (>0%) and must ship,
//                unless a query opts out with allowZero (theme > economics).

export function passesTheme(product, spec, universe) {
  const hay = `${product.title ?? ""} ${product.description ?? ""}`;
  if (universe.globalExclude.test(product.title ?? "")) return false;
  if (["kids", "toddler", "infant", "newborn"].includes(product.age)) return false;
  if (spec.exclude && spec.exclude.test(hay)) return false;
  if (spec.include && !spec.include.test(hay)) return false;
  if (spec.collection === "official") return universe.officialMatch.test(hay);
  return true;
}

function pickMainImage(images = []) {
  const cleaned = images.find((i) => i.is_main_image && i.is_cleaned_image);
  const main = images.find((i) => i.is_main_image);
  return (cleaned ?? main ?? images[0])?.url ?? null;
}

// Prefer in-stock, then commission, then price.
function pickBestOffer(offers = []) {
  const usable = offers.filter((o) => o?.url && o?.price?.price != null);
  if (usable.length === 0) return null;
  return usable.sort((a, b) => {
    const stock = Number(b.availability === "InStock") - Number(a.availability === "InStock");
    if (stock !== 0) return stock;
    const comm = (b.max_commission_rate ?? 0) - (a.max_commission_rate ?? 0);
    if (comm !== 0) return comm;
    return a.price.price - b.price.price;
  })[0];
}

// Variant fingerprint: "Cabana - M" == "Cabana - Xs", "Art 30x20/cfl" == "Art 24x16/wfl".
export function fingerprint(record) {
  const t = record.title
    .toLowerCase()
    .replace(/\b(size\s+)?(xxs|xs|s|m|l|xl|xxl|2xl|3xl|4xl)\b/g, "")
    .replace(/\b\d+(\.\d+)?\s?(mm|cm|inch|inches|in|oz|ml|l|ct|k|kt)\b/g, "")
    .replace(/\b\d+x\d+\b(\/\w+)?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${record.brand.toLowerCase()}|${t}`;
}

export function normalize(product, spec) {
  const offer = pickBestOffer(product.offers);
  const image = pickMainImage(product.images);
  if (!offer || !image) return null;

  return {
    id: product.id,
    title: product.title,
    brand: product.brands?.[0]?.name ?? "",
    category: product.category?.title ?? "",
    chapter: spec.chapter,
    collection: spec.collection,
    allowZero: spec.allowZero ?? false,
    note: spec.note,
    price: offer.price.price,
    compareAt: offer.price.compare_at_price ?? null,
    currency: offer.price.currency ?? "USD",
    image,
    url: offer.url, // monetizable link, attributed to the API key that searched
    retailer: offer.domain ?? "",
    commissionRate: offer.max_commission_rate ?? 0,
    availability: offer.availability ?? null,
  };
}

export function isSellable(record) {
  if (!record || !record.image || !record.url) return false;
  if (record.price < 8) return false;
  if (record.collection === "in_style") {
    if (record.availability !== "InStock") return false;
    if (record.commissionRate <= 0 && !record.allowZero) return false;
  }
  return true;
}

// Expected commission per sale; the ranking signal within a query.
export const ev = (r) => r.price * (r.commissionRate ?? 0);
