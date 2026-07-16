# Team Grocery List

A shared, no-login, checkbox grocery list. Anyone with the link can add items,
check them off, and remove them. State is stored in Cloudflare Workers KV and
synced across everyone's devices (each client polls every 4 seconds).

- **Frontend:** `index.html` — a single static, mobile-friendly page.
- **Backend:** `functions/api/items.js` — a Cloudflare Pages Function exposing
  `GET`/`POST` at `/api/items`, backed by a KV namespace bound as `GROCERY_KV`.
- **Config:** `wrangler.toml` — Cloudflare Pages project config.

There is no authentication by design. Treat the URL as the only "secret" — keep
it within your group.

## How it works

- On load the page does `GET /api/items` and then polls it every 4 seconds.
- Adding, toggling, or removing an item updates the page immediately and
  `POST`s the **full** updated array to `/api/items` as JSON.
- The server stores the array under a single KV key, `items`.
- The first time the API returns an empty array, the page seeds it with a
  default trip list and writes that back.

---

## Deploy runbook (Cloudflare Pages + Workers KV)

### Prerequisites

- A Cloudflare account with the `youmissedit.org` zone already added.
- Node.js 18+ installed.
- Wrangler. The commands below use `npx wrangler` so no global install is
  required. (You can `npm install -g wrangler` if you prefer.)

### 1. Authenticate

```bash
npx wrangler login
```

This opens a browser to authorize Wrangler. If you have more than one account,
confirm the active one:

```bash
npx wrangler whoami
```

### 2. Create the KV namespace

```bash
npx wrangler kv namespace create grocery-list-kv
```

Wrangler prints a block like this:

```
[[kv_namespaces]]
binding = "grocery_list_kv"
id = "0123456789abcdef0123456789abcdef"
```

Copy the **`id`** value. Ignore the suggested `binding` name — this project's
code expects the binding to be named `GROCERY_KV`, not `grocery_list_kv`.

### 3. Put the namespace id into `wrangler.toml`

Edit `wrangler.toml` and replace the placeholder so the binding block reads:

```toml
[[kv_namespaces]]
binding = "GROCERY_KV"
id = "0123456789abcdef0123456789abcdef"   # <-- the id from step 2
```

Keep `binding = "GROCERY_KV"` exactly as-is; that is the name the Function
reads via `context.env.GROCERY_KV`.

### 4. Create the Pages project

```bash
npx wrangler pages project create team-grocery-list --production-branch main
```

### 5. Deploy

```bash
npx wrangler pages deploy . --project-name team-grocery-list
```

Because `wrangler.toml` includes the `[[kv_namespaces]]` block, this deploy
also applies the `GROCERY_KV` binding to the project's **production**
environment. The command prints your live URL, e.g.
`https://team-grocery-list.pages.dev`.

Open that URL — you should see the list seeded with the default items.

### 6. (If the binding didn't attach) Bind KV in the dashboard

If the app loads but adds/toggles fail, the KV binding may not have applied.
Add it by hand:

1. Cloudflare dashboard → **Workers & Pages** → **team-grocery-list**.
2. **Settings** → **Bindings** (older UIs: **Functions** → **KV namespace
   bindings**).
3. **Add binding**:
   - Variable name: `GROCERY_KV`
   - KV namespace: `grocery-list-kv`
   - Add it for **Production** (and **Preview** if you want previews to work).
4. Save, then redeploy: `npx wrangler pages deploy . --project-name team-grocery-list`.

### 7. Attach the custom domain `grocery.youmissedit.org`

Custom domains for Pages are attached in the dashboard (Wrangler has no stable
command for this). Because `youmissedit.org` is already on this Cloudflare
account, Cloudflare creates the DNS record for you automatically.

1. Cloudflare dashboard → **Workers & Pages** → **team-grocery-list**.
2. **Custom domains** tab → **Set up a custom domain**.
3. Enter `grocery.youmissedit.org` and continue.
4. Cloudflare adds the required `CNAME` (pointing at
   `team-grocery-list.pages.dev`) into the `youmissedit.org` zone and begins
   issuing a certificate. Confirm/activate when prompted.
5. Wait for status to become **Active** (usually a minute or two), then visit
   <https://grocery.youmissedit.org>.

---

## Local development

Run the site and its Function locally with Wrangler's Pages dev server:

```bash
npx wrangler pages dev . --kv GROCERY_KV
```

`--kv GROCERY_KV` gives you a local, in-memory KV namespace bound under the
same name, so `/api/items` works without touching production data. The dev
server prints a `http://localhost:...` URL.

## API reference

`GET /api/items`
- Returns the stored array as JSON (`[]` if nothing has been saved yet).

`POST /api/items`
- Body: a JSON array of items, e.g.
  `[{ "id": "abc", "text": "Ice", "done": false }]`
- Validates that the body is an array, stores it, and returns `{ "ok": true }`.
- Returns `400` for invalid JSON or a non-array body.

## Resetting the list

To wipe the list (the app will re-seed on next empty load):

```bash
npx wrangler kv key delete --binding GROCERY_KV items --remote
```

Or overwrite it with an empty array:

```bash
npx wrangler kv key put --binding GROCERY_KV items '[]' --remote
```
