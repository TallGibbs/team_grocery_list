# Relay Team Grocery List

A shared, no-login, checkbox grocery list for a relay race trip. Anyone with the
link can add items, check them off, and remove them. State is stored
server-side and synced across everyone's devices (each client polls every
4 seconds).

- **Frontend:** `index.html` — a single static, mobile-friendly page.
- **Backend:** `functions/api/items.js` — a serverless function exposing
  `GET`/`POST` at `/api/items`, backed by a key-value store.

The list starts empty, so the team fills it in from scratch each trip.

There is no authentication by design. Treat the URL as the only "secret" — keep
it within your group.

## Using it

- **Copy link** (top right) copies the page URL to send to the team.
- **Add** appends an item; tapping an item or its checkbox marks it done.
- **Clear checked items** removes everything already checked off.
- **Start a new list** empties the list for everyone, after a confirmation
  prompt. Use it when the previous trip's list is still showing.

## How it works

- On load the page does `GET /api/items` and then polls it every 4 seconds.
- Adding, toggling, or removing an item updates the page immediately and
  `POST`s the **full** updated array to `/api/items` as JSON.
- The server stores the array under a single key.
- Nothing is pre-populated: an empty store renders an empty list.

## API reference

`GET /api/items`
- Returns the stored array as JSON (`[]` if nothing has been saved yet).

`POST /api/items`
- Body: a JSON array of items, e.g.
  `[{ "id": "abc", "text": "Ice", "done": false }]`
- Validates the body, stores it, and returns `{ "ok": true }`.
- Returns `400` with `{ "ok": false, "error": "..." }` for invalid JSON, a
  non-array body, or a list that exceeds the size limits: at most 500 items,
  500 characters of text per item, and 100 characters per id.
