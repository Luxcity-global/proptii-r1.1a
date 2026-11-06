import * as https from 'https';
import { applyProptiiEmailLayout } from './emailLayout';

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
  const rawKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.EMAIL_FROM_ADDRESS || 'noreply@mail.proptii.co').trim();

  // Guard against placeholder keys or leading/trailing whitespace
  const isPlaceholder = !rawKey || rawKey.includes('your_resend_api') || rawKey.includes('your-resend');
  const apiKey = isPlaceholder ? '' : rawKey;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured in backend environment variables');
  }

  const body = JSON.stringify({
    from: `Proptii <${from}>`,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: applyProptiiEmailLayout(payload.html),
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
            const detail = parsed?.message || parsed?.error || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
            reject(new Error(`Resend error (${res.statusCode}): ${detail}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Resend response (HTTP ${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Network error connecting to Resend: ${err.message}`)));
    req.write(body);
    req.end();
  });
}
