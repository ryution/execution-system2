export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, type } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const SERVER = process.env.MAILCHIMP_SERVER;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;

  if (!API_KEY || !SERVER || !LIST_ID) {
    console.error('[Mailchimp] Missing environment variables');
    return res.status(500).json({ error: 'Mailchimp not configured' });
  }

  try {
    const response = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `apikey ${API_KEY}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: name || '',
            SOURCE: type || 'unknown',
          },
          tags: [type === 'playbook' ? 'Playbook Lead' : 'Diagnostic Complete'],
        }),
      }
    );

    const data = await response.json();

    // "Member Exists" is fine — they're already subscribed
    if (response.ok || data.title === 'Member Exists') {
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: data.detail || 'Subscription failed' });
  } catch (error) {
    console.error('[Mailchimp] Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
