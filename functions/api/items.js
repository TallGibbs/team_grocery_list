// Cloudflare Pages Function backing /api/items
//
// Storage is a single Workers KV key ("items") holding the full list as a
// JSON-encoded array. The client always sends the complete array, so writes
// are simple whole-list replacements.

const KEY = "items";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
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

  if (!Array.isArray(data)) {
    return jsonResponse({ ok: false, error: "Expected a JSON array" }, 400);
  }

  await context.env.GROCERY_KV.put(KEY, JSON.stringify(data));
  return jsonResponse({ ok: true }, 200);
}
