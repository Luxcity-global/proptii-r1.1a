/**
 * Shared Proptii email shell.
 * Matches the referencing email: logo, orange button, sign-off, and footer.
 * The twin copy lives in src/utils/proptiiEmailLayout.ts — keep them in sync.
 */

const LOGO_URL = 'https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png';

export function escapeEmailHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function proptiiButton(label: string, href: string): string {
  const text = String(label || '').trim();
  const withEmoji = text.startsWith('👉') ? text : `👉 ${text}`;
  return `
    <div style="margin: 24px 0; text-align: center;">
      <a href="${escapeEmailHtml(href)}"
         style="display: inline-block; background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.3);">
        ${escapeEmailHtml(withEmoji)}
      </a>
    </div>
  `;
}

export function renderProptiiEmail(options: {
  title?: string;
  bodyHtml: string;
  buttonLabel?: string;
  buttonHref?: string;
  pageTitle?: string;
}): string {
  const heading = options.title
    ? `<h2 style="color:#136C9E;margin:0 0 16px;font-size:24px;">${escapeEmailHtml(options.title)}</h2>`
    : '';
  const button = options.buttonLabel && options.buttonHref
    ? proptiiButton(options.buttonLabel, options.buttonHref)
    : '';
  const pageTitle = escapeEmailHtml(options.pageTitle || options.title || 'Proptii');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 24px 0; margin: 0; }
    .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); border-radius: 12px; }
    .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
    .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
    .info-item { margin: 5px 0; }
    .details { background: #f5f8fb; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(19, 108, 158, 0.08); }
    .details h3 { margin-top: 0; color: #136C9E; font-size: 16px; }
    .footer-logo img { height: 40px; }
    .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
    .footer-link { color: #136C9E; text-decoration: underline; }
    a { color: #136C9E; }
    hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
  </style>
</head>
<body>
  <div class="container" data-proptii-email-layout="1">
    ${heading}
    ${options.bodyHtml}
    ${button}
    <div style="margin-top: 32px;">
      Best regards,<br>
      The Proptii Team
    </div>
    <hr />
    <div class="footer-desc">
      <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co" class="footer-link">here</a>.</em>
    </div>
    <div class="footer-logo">
      <img src="${LOGO_URL}" alt="Proptii Logo" />
    </div>
  </div>
</body>
</html>`;
}

function extractEmailInner(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : html;
  return inner
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();
}

/** Wraps any email that is not already in the standard shell. Leaves recipients and subjects untouched. */
export function applyProptiiEmailLayout(html: string): string {
  const source = String(html || '').trim();
  if (!source) {
    return renderProptiiEmail({
      title: 'Notification from Proptii',
      bodyHtml: '<p>You have received a new message from Proptii.</p>',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
    });
  }
  if (
    source.includes('data-proptii-email-layout')
    || source.includes('footer-logo')
    || source.includes('one-stop AI platform')
  ) {
    return source;
  }
  const inner = extractEmailInner(source);
  const hasLink = /<a\s[^>]*href=/i.test(inner);
  return renderProptiiEmail({
    bodyHtml: inner,
    ...(hasLink ? {} : { buttonLabel: 'Open Proptii', buttonHref: 'https://proptii.co' }),
  });
}
