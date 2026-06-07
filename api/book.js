export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, niche, posting, revenue, goal, profile } = req.body;

  const GHL_KEY      = process.env.GHL_API_KEY;
  const LOCATION_ID  = process.env.GHL_LOCATION_ID;
  const PIPELINE_ID  = process.env.CONTENT_OS_PIPELINE_ID;
  const STAGE_ID     = process.env.CONTENT_OS_STAGE_CALL_BOOKED;
  const TG_TOKEN     = process.env.TELEGRAM_TOKEN_JOHN;
  const TG_CHAT      = process.env.TELEGRAM_CHAT_ID;
  const SB_URL       = process.env.SUPABASE_URL;
  const SB_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // 1. Create GHL contact (v2 API)
    const [firstName, ...rest] = (name || '').split(' ');
    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        firstName,
        lastName: rest.join(' ') || '',
        email,
        locationId: LOCATION_ID,
        tags: ['landing-page', 'call-booked'],
        source: 'Landing Page'
      })
    });
    const contactData = await contactRes.json();
    const contactId = contactData.contact?.id;

    // 2. Create opportunity in Content OS pipeline → Call Booked stage
    if (contactId) {
      await fetch('https://services.leadconnectorhq.com/opportunities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          title: `${name} — ${niche}`,
          pipelineId: PIPELINE_ID,
          pipelineStageId: STAGE_ID,
          contactId,
          locationId: LOCATION_ID,
          monetaryValue: 5000,
          status: 'open'
        })
      });
    }

    // 3. Telegram notification
    const revenueLabel = {
      under5k: 'Under $5K',
      '5k10k': '$5K–$10K',
      '10k25k': '$10K–$25K',
      '25kplus': '$25K+'
    }[revenue] || revenue;

    const msg = [
      '🔥 New Call Booked!',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Niche: ${niche}`,
      `Posting: ${posting === 'yes' ? 'Yes ✓' : 'No ✗'}`,
      `Revenue: ${revenueLabel}`,
      `Goal: ${goal}`,
      ...(profile ? [`Profile: ${profile}`] : [])
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg })
    });

    // 4. Mark lead as booked in Supabase (match by email)
    if (SB_URL && SB_KEY && email) {
      await fetch(`${SB_URL}/rest/v1/landing_leads?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ booked_call: true })
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('book handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
