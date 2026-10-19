export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export async function searchDuckDuckGo(query: string, limit = 4, signal?: AbortSignal): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: signal ?? AbortSignal.timeout(6000),
  });
  if (!response.ok) throw Error(`Search request failed with status ${response.status}`);
  const html = await response.text();

  const results: SearchResult[] = [];
  const regex = /<a[^>]*class="result__snippet[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const titleRegex = /<a[^>]*class="result__url"[^>]*>([\s\S]*?)<\/a>/g;

  const snippets = [...html.matchAll(regex)];
  const urls = [...html.matchAll(titleRegex)];

  for (let i = 0; i < Math.min(snippets.length, limit); i++) {
    const rawSnippet = snippets[i][2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const rawUrl = urls[i]?.[1]?.replace(/<[^>]+>/g, "").trim() || snippets[i][1];
    let resolvedUrl = rawUrl;
    if (resolvedUrl.startsWith("//duckduckgo.com/l/?uddg=")) {
      try {
        const decoded = new URL("https:" + resolvedUrl).searchParams.get("uddg");
        if (decoded) resolvedUrl = decoded;
      } catch {}
    }
    const titleMatch = html.slice(Math.max(0, snippets[i].index! - 400), snippets[i].index!).match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : `Result ${i + 1}`;

    if (rawSnippet) {
      results.push({
        title,
        snippet: rawSnippet,
        url: resolvedUrl.startsWith("http") ? resolvedUrl : `https://${resolvedUrl}`,
      });
    }
  }
  return results;
}

export async function searchWikipedia(query: string, limit = 4, signal?: AbortSignal): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "OmnipresentPresentationAgent/1.0" },
    signal: signal ?? AbortSignal.timeout(5000),
  });
  if (!response.ok) throw Error(`Wikipedia API failed with status ${response.status}`);
  const data = await response.json();
  const list = data?.query?.search ?? [];
  return list.slice(0, limit).map((item: any) => ({
    title: item.title,
    snippet: String(item.snippet || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
  }));
}

export async function searchWeb(query: string, limit = 4, signal?: AbortSignal): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];
  try {
    const ddg = await searchDuckDuckGo(query, limit, signal);
    if (ddg.length > 0) return ddg;
  } catch {}
  try {
    const wiki = await searchWikipedia(query, limit, signal);
    if (wiki.length > 0) return wiki;
  } catch {}
  return [];
}
