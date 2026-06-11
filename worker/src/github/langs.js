// endpoint on the worker will be worker.com/github/languages
// Loads the languages used across the user's (non-fork) repositories,
// aggregated by bytes of code, top 6.
import { gql } from "./client.js";

export async function loadLanguages(login, token) {
  const data = await gql(
    `query($login:String!){
      user(login:$login){
        repositories(ownerAffiliations:OWNER, isFork:false, first:100){
          nodes{
            languages(first:10, orderBy:{field:SIZE, direction:DESC}){
              edges{ size node{ name color } }
            }
          }
        }
      }
    }`,
    { login },
    token
  );
  if (!data.user) throw new Error(`user '${login}' not found`);

  const totals = {};
  for (const repo of data.user.repositories.nodes) {
    for (const e of repo.languages.edges) {
      const n = e.node.name;
      if (!totals[n]) totals[n] = { size: 0, color: e.node.color || "#888888" };
      totals[n].size += e.size;
    }
  }
  const arr = Object.entries(totals)
    .map(([name, v]) => ({ name, size: v.size, color: v.color }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 6);
  const sum = arr.reduce((s, l) => s + l.size, 0) || 1;
  arr.forEach((l) => (l.pct = (l.size / sum) * 100));
  return arr;
}
