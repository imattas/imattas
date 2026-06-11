# ipa-cards — Cloudflare Worker

Renders the GitHub profile cards (stats, top languages, repositories) as SVGs,
pulled live from `api.github.com`. This replaces the dynamic third-party cards
(github-readme-stats) with your own edge service — **no scheduled workflow**, and
the only thing the README depends on at view time is your own Worker.

The static language/tool badges in the main README are still fully local SVGs
under [`../assets/badges/`](../assets/badges) and need none of this.

## Layout

```
src/
  index.js              router: dispatches paths to loaders + renderers
  github/               data loaders (api.github.com only, no rendering)
    client.js             shared GraphQL / REST / HTML helpers
    profile.js            name, account badges, achievements, headline stats
    langs.js              top languages used
    repos.js              public non-fork repositories
  rendering/            SVG output (no API calls)
    icons.js              theme, colors, glyph constants
    badges.js             pills, language items, stat rows, progress bar
    cards.js              full card composition (profile / languages / repos)
  hackthebox/
    htb.js                live HTB stats JSON proxy
```

## Endpoints

| Path                 | Output                                         |
| -------------------- | ---------------------------------------------- |
| `/github/profile`    | SVG stats card: rank ring, stars/commits/PRs/issues/followers, account badges, achievement icons |
| `/github/languages`  | SVG: most-used languages bar + list            |
| `/github/repos`      | SVG: grid of repository cards                  |
| `/hackthebox` (`/htb`) | JSON: live Hack The Box stats (CORS-enabled) |

The `/github` SVG cards are cached at the edge for 30 minutes; `/hackthebox`
for 5 minutes — so the cards refresh on their own without any cron job.

## Customizing (query params)

Append to any `/github` endpoint. Combine freely.

| Param | Values | Notes |
| ----- | ------ | ----- |
| `user` | a GitHub login | render for a different account |
| `theme` | `dark` `light` `dracula` `radical` `tokyonight` `transparent` | preset palette |
| `bg` `title` `text` `icon` `accent` `link` `card` | color | bare hex (`0d1117`), `#hex`, CSS name, or `transparent` |
| `border` `card_border` | color | outer frame / inner tile borders |
| `badge` `badge_text` | color | pill colors |
| `transparent` | `true` | shortcut for `bg=transparent` |
| `hide_border` | `true` | drop the outer frame |
| `radius` | number | corner radius (px) |
| `disable_animations` | `true` | static SVG (no fade/grow/rank animation) |
| `achievements` | `off` | profile only — skip achievement icons (much smaller card) |
| `mock` | `1` | render from sample data, no token/API — for local preview |

`title_color`, `text_color`, `icon_color`, `bg_color` aliases are accepted too.

Example: `/github/profile?theme=dracula&hide_border=true&radius=16`

**On animations:** the cards embed CSS `@keyframes` (fade-in, language-bar grow,
rank-ring draw) — these animate when viewed directly and on github.com. Use
`disable_animations=true` if you want a frozen image.

**On achievements:** GitHub has no official API for profile achievements
(Pull Shark, Starstruck, …). `profile.js` scrapes them best-effort from the
`?tab=achievements` page and inlines the real badge images; it degrades to a
letter fallback if GitHub blocks the scrape or changes the markup. Because the
real badges are sizeable PNGs, a profile card with several achievements can be
~250 KB — pass `achievements=off` to drop them. The *account* badges (Star,
Developer Program, Campus Expert, Bug Bounty Hunter, Staff) come from the
GraphQL API and are always reliable.

## Deploy

1. Install Wrangler and sign in:
   ```sh
   npm install -g wrangler
   wrangler login
   ```

2. Set the username in [`wrangler.toml`](wrangler.toml) (`USERNAME = "..."`) if
   it isn't `imattas`.

3. Create a GitHub token and store it as a Worker **secret** (GraphQL requires
   auth; a token also raises the REST rate limit). A classic PAT with the
   `read:user` and `public_repo` scopes is enough for public stats — or a
   fine-grained token with read-only **Metadata** + **Contents**:
   ```sh
   wrangler secret put GITHUB_TOKEN
   # paste the token when prompted
   ```

4. (Optional — only if you use `/hackthebox`) store your HTB App Token:
   ```sh
   wrangler secret put HTB_TOKEN
   wrangler secret put HTB_USER_ID   # optional; otherwise resolved from the token
   ```

5. Deploy:
   ```sh
   wrangler deploy
   ```
   Wrangler prints the URL, e.g. `https://ipa-cards.<your-subdomain>.workers.dev`.

6. In the main [`../README.md`](../README.md), replace `YOUR-SUBDOMAIN` in the
   three card image URLs with your actual `workers.dev` subdomain (or a custom
   domain if you add a route).

## Local preview

```sh
wrangler dev
# then open http://localhost:8787/github/profile, /github/languages, /github/repos
```

Secrets set with `wrangler secret put` apply to the deployed Worker, not to
`wrangler dev`. For local runs, create a `.dev.vars` file (git-ignored) with:

```
GITHUB_TOKEN=ghp_xxx
# HTB_TOKEN=...        # only if testing /hackthebox
```
