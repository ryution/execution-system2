import { createHash } from 'crypto';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, type, test } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const SERVER = process.env.MAILCHIMP_SERVER;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;

  // Debug: report which env vars are set (without exposing values)
  const envStatus = {
    MAILCHIMP_API_KEY: API_KEY ? `set (${API_KEY.length} chars, server: ${API_KEY.split('-').pop()})` : 'MISSING',
    MAILCHIMP_SERVER: SERVER || 'MISSING',
    MAILCHIMP_LIST_ID: LIST_ID || 'MISSING',
  };

  if (!API_KEY || !SERVER || !LIST_ID) {
    console.error('[Mailchimp] Missing environment variables:', envStatus);
    return res.status(500).json({
      error: 'Mailchimp not configured',
      debug: envStatus,
      help: 'Set MAILCHIMP_API_KEY, MAILCHIMP_SERVER, and MAILCHIMP_LIST_ID in Vercel Environment Variables, then redeploy.'
    });
  }

  // Mailchimp uses MD5 hash of lowercase email as the subscriber ID
  const emailHash = createHash('md5').update(email.toLowerCase()).digest('hex');
  const baseUrl = `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `apikey ${API_KEY}`,
  };

  const tag = type === 'playbook' ? 'Playbook Lead' : 'Diagnostic Complete';

  try {
    // Step 1: PUT (upsert) the member — creates OR updates
    const memberUrl = `${baseUrl}/members/${emailHash}`;
    const putBody = {
      email_address: email.toLowerCase(),
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME: name || '',
      },
    };

    console.log(`[Mailchimp] PUT ${memberUrl}`);
    const putRes = await fetch(memberUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody),
    });
    const putData = await putRes.json();

    if (!putRes.ok) {
      console.error('[Mailchimp] PUT failed:', putRes.status, putData);
      return res.status(putRes.status).json({
        error: 'Mailchimp API error',
        status: putRes.status,
        detail: putData.detail || putData.title || 'Unknown error',
        debug: test ? { envStatus, memberUrl, putBody, response: putData } : undefined,
      });
    }

    console.log(`[Mailchimp] PUT success: ${putData.email_address} (status: ${putData.status})`);

    // Step 2: Add tag via the tags endpoint
    const tagUrl = `${memberUrl}/tags`;
    const tagRes = await fetch(tagUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tags: [{ name: tag, status: 'active' }],
      }),
    });

    if (!tagRes.ok) {
      const tagData = await tagRes.json();
      console.warn('[Mailchimp] Tag failed (non-fatal):', tagRes.status, tagData);
    } else {
      console.log(`[Mailchimp] Tag "${tag}" applied successfully`);
    }

    // Return detailed info if this is a test call
    if (test) {
      return res.status(200).json({
        success: true,
        message: `${email} added/updated in Mailchimp with tag "${tag}"`,
        member: {
          email: putData.email_address,
          status: putData.status,
          id: putData.id,
          tags_count: putData.tags_count,
        },
        debug: { envStatus },
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Mailchimp] Network error:', error.message);
    return res.status(500).json({
      error: 'Failed to connect to Mailchimp',
      message: error.message,
      debug: test ? { envStatus } : undefined,
    });
  }
}
