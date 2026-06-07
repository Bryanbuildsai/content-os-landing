export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, niche, posting, revenue, goal, profile, qualified } = req.body;

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    await fetch(`${SB_URL}/rest/v1/landing_leads`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name, email, niche, posting, revenue, goal, profile, qualified })
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
