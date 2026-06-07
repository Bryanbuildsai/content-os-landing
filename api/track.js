export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { event, metadata = {} } = req.body;
  if (!event) return res.status(400).json({ error: 'missing event' });

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    await fetch(`${SB_URL}/rest/v1/page_events`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ event, metadata })
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
