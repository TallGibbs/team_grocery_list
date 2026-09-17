// Cloudflare Pages Function backing /api/items
//
// Storage is a single Workers KV key ("items") holding the full list as a
// JSON-encoded array. The client always sends the complete array, so writes
// are simple whole-list replacements.
//
// The endpoint is unauthenticated, so a bad write would clobber the list for
// everyone. The limits below keep a single request from wedging the shared
// key with something the page can no longer render or clear.

const KEY = "items";

const MAX_ITEMS = 500;
const MAX_TEXT_LENGTH = 500;
const MAX_ID_LENGTH = 100;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// Returns an error string when the payload is not a storable list, else null.
function validationError(data) {
  if (!Array.isArray(data)) return "Expected a JSON array";
  if (data.length > MAX_ITEMS) return `Too many items (max ${MAX_ITEMS})`;

  for (const item of data) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return "Each item must be an object";
    }
    if (typeof item.text !== "string") {
      return "Each item needs a text string";
    }
    if (item.text.length > MAX_TEXT_LENGTH) {
      return `Item text is too long (max ${MAX_TEXT_LENGTH} characters)`;
    }
    if (item.id != null && String(item.id).length > MAX_ID_LENGTH) {
      return `Item id is too long (max ${MAX_ID_LENGTH} characters)`;
    }
  }

  return null;
}

// GET /api/items -> the stored array (defaults to "[]" when unset).
export async function onRequestGet(context) {
  const stored = await context.env.GROCERY_KV.get(KEY);
  const body = stored != null ? stored : "[]";
  return new Response(body, { status: 200, headers: JSON_HEADERS });
}

// POST /api/items -> validate an array body, persist it, return { ok: true }.
export async function onRequestPost(context) {
  let data;
  try {
    data = await context.request.json();
  } catch (err) {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const error = validationError(data);
  if (error) {
    return jsonResponse({ ok: false, error }, 400);
  }

  await context.env.GROCERY_KV.put(KEY, JSON.stringify(data));
  return jsonResponse({ ok: true }, 200);
}
