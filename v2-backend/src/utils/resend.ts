import * as https from 'https';

export interface ResendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    content_type?: string;
  }>;
}

/**
 * Sends an email via the Resend REST API using Node's built-in https module.
 * No SDK dependency required.
 *
 * FROM is always noreply@mail.proptii.co (verified Resend sender domain).
 * Returns the Resend email ID on success, throws on failure.
 */
export async function sendEmail(payload: ResendEmailPayload): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS || 'noreply@mail.proptii.co';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }

  const body = JSON.stringify({
    from: `Proptii <${from}>`,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    ...(payload.attachments?.length ? { attachments: payload.attachments } : {}),
  });

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed.id as string);
          } else {
            reject(new Error(`Resend API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Resend response: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}
