# Team Grocery List

A shared, no-login, checkbox grocery list. Anyone with the link can add items,
check them off, and remove them. State is stored server-side and synced across
everyone's devices (each client polls every 4 seconds).

- **Frontend:** `index.html` — a single static, mobile-friendly page.
- **Backend:** `functions/api/items.js` — a serverless function exposing
  `GET`/`POST` at `/api/items`, backed by a key-value store.

There is no authentication by design. Treat the URL as the only "secret" — keep
it within your group.

## How it works

- On load the page does `GET /api/items` and then polls it every 4 seconds.
- Adding, toggling, or removing an item updates the page immediately and
  `POST`s the **full** updated array to `/api/items` as JSON.
- The server stores the array under a single key.
- The first time the API returns an empty array, the page seeds it with a
  default trip list and writes that back.

## API reference

`GET /api/items`
- Returns the stored array as JSON (`[]` if nothing has been saved yet).

`POST /api/items`
- Body: a JSON array of items, e.g.
  `[{ "id": "abc", "text": "Ice", "done": false }]`
- Validates that the body is an array, stores it, and returns `{ "ok": true }`.
- Returns `400` for invalid JSON or a non-array body.
