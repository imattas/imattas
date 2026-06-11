// endpoint on the worker will be worker.com/github/repos
// Loads the user's public, non-fork repositories (newest first, top 12).
import { rest } from "./client.js";

export async function loadRepos(login, token) {
  const repos = await rest(
    `/users/${encodeURIComponent(login)}/repos?per_page=100&sort=updated&type=public`,
    token
  );
  return repos
    .filter((x) => !x.fork && x.name !== login)
    .slice(0, 12)
    .map((x) => ({
      name: x.name,
      desc: x.description || "",
      lang: x.language || "",
      stars: x.stargazers_count,
      forks: x.forks_count,
    }));
}
