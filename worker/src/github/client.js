// Shared GitHub API helpers used by the data loaders in this folder.
// GraphQL always needs a token; REST works better with one (higher rate limit).

const UA = "ipa-cards-worker";

export async function gql(query, variables, token) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": UA,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`GitHub GraphQL HTTP ${r.status}`);
  const j = await r.json();
  if (j.errors) throw new Error(j.errors.map((e) => e.message).join("; "));
  return j.data;
}

export async function rest(path, token) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `bearer ${token}`,
      "user-agent": UA,
      accept: "application/vnd.github+json",
    },
  });
  if (!r.ok) throw new Error(`GitHub REST HTTP ${r.status}`);
  return r.json();
}

// Plain HTML fetch (used for the best-effort achievements scrape — GitHub has
// no official achievements API). Uses a browser-like User-Agent because GitHub
// serves a stripped page to obvious bots. Returns "" on any failure.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchText(url) {
  try {
    const r = await fetch(url, {
      headers: { "user-agent": BROWSER_UA, accept: "text/html,application/xhtml+xml" },
    });
    return r.ok ? await r.text() : "";
  } catch {
    return "";
  }
}
