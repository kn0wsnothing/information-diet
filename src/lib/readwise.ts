export type ReadwiseDocument = {
  id: string;
  url: string;
  source_url: string | null;
  title: string;
  author: string | null;
  category: string | null;
  location: string | null;
  word_count: number | null;
  reading_time: string | null;
  published_date: string | null;
  created_at: string;
  updated_at: string;
  last_moved_at: string | null;
};

function parseReadingMinutes(readingTime: string | null): number | null {
  if (!readingTime) return null;
  const match = readingTime.match(/(\d+)\s*min/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function inferMacroFromReadwise(doc: ReadwiseDocument): "SNACK" | "MEAL" | "TIME_TESTED" {
  const category = (doc.category ?? "").toLowerCase();
  const minutes = parseReadingMinutes(doc.reading_time);
  const words = doc.word_count ?? null;

  if (["tweet", "video"].includes(category)) return "SNACK";

  if (["epub", "pdf"].includes(category)) return "TIME_TESTED";

  if (minutes !== null) {
    if (minutes <= 6) return "SNACK";
    if (minutes >= 45) return "TIME_TESTED";
    return "MEAL";
  }

  if (words !== null) {
    if (words <= 900) return "SNACK";
    if (words >= 12000) return "TIME_TESTED";
    return "MEAL";
  }

  return "MEAL";
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * Math.pow(2, attempt), 10000);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      if (!res.ok) {
        throw new Error(`Readwise list failed: ${res.status}`);
      }

      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

export async function fetchReadwiseDocuments({
  token,
  updatedAfter,
  location,
  maxResults,
}: {
  token: string;
  updatedAfter?: string;
  location?: string;
  maxResults?: number;
}): Promise<ReadwiseDocument[]> {
  const all: ReadwiseDocument[] = [];
  let pageCursor: string | undefined;

  while (true) {
    if (maxResults && all.length >= maxResults) {
      console.log(`Readwise: Reached max results limit (${maxResults})`);
      break;
    }

    const url = new URL("https://readwise.io/api/v3/list/");
    if (pageCursor) url.searchParams.set("pageCursor", pageCursor);
    if (updatedAfter) url.searchParams.set("updatedAfter", updatedAfter);
    if (location) url.searchParams.set("location", location);

    console.log(`Readwise: Fetching page (current total: ${all.length})`);

    const res = await fetchWithRetry(
      url.toString(),
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        cache: "no-store",
      },
      3
    );

    const json = (await res.json()) as {
      nextPageCursor?: string;
      results: ReadwiseDocument[];
    };

    all.push(...(json.results ?? []));

    pageCursor = json.nextPageCursor;
    if (!pageCursor) break;
  }

  console.log(`Readwise: Fetched ${all.length} total documents`);
  return all;
}
