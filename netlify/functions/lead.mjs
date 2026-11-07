// POST /api/lead — validates a lead server-side and stores it in Supabase.
// Secrets come only from environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createHash } from 'node:crypto';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const clean = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'שיטה לא נתמכת.' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    return json(500, { ok: false, error: 'המערכת אינה זמינה כרגע.' });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: 'בקשה לא תקינה.' });
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (clean(body.website, 200)) return json(200, { ok: true });

  const name = clean(body.name, 80);
  const phoneRaw = clean(body.phone, 30);
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  const address = clean(body.address, 160);
  const errors = [];
  if (name.length < 2) errors.push('שם');
  if (!/^(\+972|0)\d{8,9}$/.test(phone)) errors.push('טלפון');
  if (address.length < 4) errors.push('כתובת המבנה');
  if (errors.length) return json(422, { ok: false, error: 'יש לבדוק את השדות: ' + errors.join(', ') + '.' });

  const source = ['website', 'landing'].includes(body.source) ? body.source : 'unknown';
  const utm = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = clean(body.utm?.[k], 120);
    if (v) utm[k] = v;
  }

  // Rate limit: max 5 leads per IP per 10 minutes. IP is stored only as a salted hash.
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const ipHash = createHash('sha256').update(ip + '|' + SUPABASE_URL).digest('hex').slice(0, 32);
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?select=id&ip_hash=eq.${ipHash}&created_at=gte.${since}`,
      { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } }
    );
    const total = Number((countRes.headers.get('content-range') || '').split('/')[1] || 0);
    if (total >= 5) return json(429, { ok: false, error: 'נשלחו יותר מדי פניות בזמן קצר.' });

    const insert = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        name,
        phone,
        address,
        source,
        page: clean(body.page, 120),
        referrer: clean(body.referrer, 300),
        utm,
        ip_hash: ipHash,
        user_agent: clean(req.headers.get('user-agent'), 300),
        deploy_context: process.env.CONTEXT || 'unknown',
      }),
    });
    if (!insert.ok) {
      console.error('Supabase insert failed', insert.status, await insert.text());
      return json(502, { ok: false, error: 'הפרטים לא נשמרו.' });
    }
  } catch (err) {
    console.error('Lead handler error', err);
    return json(502, { ok: false, error: 'הפרטים לא נשמרו.' });
  }

  return json(200, { ok: true });
};

export const config = { path: '/api/lead' };
