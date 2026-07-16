// Minimal Channel3 API client.
// Docs: https://docs.trychannel3.com/api-reference/v1/search
//
// Attribution model: authenticate with your own x-api-key. The buy links in
// offers[].url that come back are already monetizable and credited to your
// account. Do not rewrite them.

const BASE_URL = "https://api.trychannel3.com";

export function createClient(apiKey, { country = "US", currency = "USD" } = {}) {
  if (!apiKey) {
    throw new Error(
      "Missing Channel3 API key. Set CHANNEL3_API_KEY in your environment (.env)."
    );
  }

  const defaultConfig = { country, currency, mode: "default" };

  // One raw search request against POST /v1/search.
  async function search({ query, filters, config, limit = 30, pageToken } = {}) {
    const body = {
      query,
      filters,
      config: { ...defaultConfig, ...config },
      limit,
      page_token: pageToken,
    };

    const res = await fetch(`${BASE_URL}/v1/search`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Channel3 search failed (${res.status}): ${detail}`);
    }
    return res.json();
  }

  // Walk pagination until exhausted or maxPages reached.
  async function searchAll(query, { filters, config, limit = 30, maxPages = 4 } = {}) {
    const products = [];
    let pageToken;
    for (let page = 0; page < maxPages; page++) {
      const data = await search({ query, filters, config, limit, pageToken });
      products.push(...(data.products ?? []));
      pageToken = data.next_page_token;
      if (!pageToken) break;
    }
    return products;
  }

  return { search, searchAll };
}
