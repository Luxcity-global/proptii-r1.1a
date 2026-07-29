# Proptii Email Template Design Guide

This document defines how Proptii transactional emails should **look**, **be structured**, and **be built**. Share this with anyone adding new backend email templates so they stay visually consistent.

For a list of existing templates and triggers, see [EMAIL_TEMPLATES_DOCUMENTATION.md](./EMAIL_TEMPLATES_DOCUMENTATION.md).

**Canonical reference implementation:** `proptii-backend/src/services/email.service.ts` (`baseStyles`, `wrapEmailContent`, `defaultFooter`).

### Visual previews (standalone HTML)

Open these in a browser to see the finished layout with sample data. Upload to Drive and share the links with your team as needed.

| Template | File |
|----------|------|
| Your Referencing Application Has Been Submitted | [referencing-application-submitted.html](./email-templates/referencing-application-submitted.html) |
| New Viewing Request | [new-viewing-request.html](./email-templates/new-viewing-request.html) |

---

## 1. Visual identity

### Brand colours (transactional emails)

Use these values. They match the majority of backend templates today.

| Role | Hex | Usage |
|------|-----|--------|
| **Primary blue** | `#136C9E` | Headings, links, section titles, info accents |
| **CTA orange (start)** | `#DC5F12` | Primary button gradient start |
| **CTA orange (end)** | `#FF6B1A` | Primary button gradient end |
| **Page background** | `#f5f7fa` | Outer `body` background |
| **Card background** | `#ffffff` | Main email container |
| **Details panel** | `#f5f8fb` | Key-facts / summary blocks |
| **Body text** | `#333333` | Paragraphs |
| **Muted text** | `#4b5563` / `#666666` | Footer, secondary copy |
| **Border / divider** | `#e2e8f0` | Horizontal rules, subtle borders |

Billing emails (`webhook.service.ts`) use a close variant: navy `#002B49`, orange `#F15A22`. New templates should follow the table above unless the email is explicitly part of the billing flow.

### Typography

| Element | Style |
|---------|--------|
| Font stack | `Arial, sans-serif` (web fonts like Archivo/Nunito Sans are **not** used in HTML emails — poor client support) |
| Line height | `1.6` on `body` |
| Email title (`.header`) | `24px`, `font-weight: 700`, colour `#136C9E` |
| Section title (`.details h3`) | `16px`, `font-weight: normal` (bold via markup), colour `#136C9E` |
| Body copy | Default size (~16px implied), colour `#333` |
| Footer | `14px`, colour `#666` |

### Layout

- **Max width:** `640px` (container centred on page background)
- **Container padding:** `32px 24px`
- **Border radius:** `12px` on the main card, `10px` on detail panels
- **Shadow:** `0 8px 24px rgba(19, 108, 158, 0.12)` on the card

---

## 2. Required page structure

Every email should follow this skeleton. Do not invent a new layout per email.

```
┌─────────────────────────────────────────────┐
│  body (#f5f7fa background, centred)       │
│  ┌───────────────────────────────────────┐  │
│  │  .container (white card, 640px max)   │  │
│  │                                       │  │
│  │  .header — email title (one line)     │  │
│  │                                       │  │
│  │  Greeting + intro paragraph(s)        │  │
│  │                                       │  │
│  │  .details — optional summary block    │  │
│  │                                       │  │
│  │  Supporting copy                      │  │
│  │                                       │  │
│  │  .cta — primary button (if needed)    │  │
│  │                                       │  │
│  │  .footer — sign-off + Proptii blurb   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### HTML skeleton (copy-paste starter)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 24px 0; margin: 0; }
    .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); border-radius: 12px; }
    .header { color: #136C9E; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .details { background: #f5f8fb; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(19, 108, 158, 0.08); }
    .details h3 { margin-top: 0; color: #136C9E; font-size: 16px; }
    .details p { margin: 8px 0; }
    .footer { margin-top: 40px; font-size: 14px; color: #666; text-align: left; }
    .footer hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    a { color: #136C9E; }
    .cta { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.25); }
    .muted { color: #4b5563; }
    .list { margin: 0; padding-left: 18px; }
    .list li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Email Title Here</div>

    <p>Hi {{firstName}},</p>
    <p>Introductory sentence explaining why the recipient is getting this email.</p>

    <div class="details">
      <h3>Section Title</h3>
      <p><strong>Label:</strong> {{value}}</p>
      <p><strong>Label:</strong> {{value}}</p>
    </div>

    <p>Any follow-up instructions or context.</p>

    <div class="cta">
      <a href="{{actionUrl}}" class="button">👉 Action Label on Proptii</a>
    </div>

    <div class="footer">
      <p>Best regards,<br>The Proptii Team</p>
      <hr />
      <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co">here</a>.</em>
    </div>
  </div>
</body>
</html>
```

### Backend wrapper pattern

Reuse the same approach as `email.service.ts`:

1. Define `baseStyles` once.
2. Define `defaultFooter` once.
3. Implement `wrapEmailContent(title, bodyContent, footerContent?)` so each email only supplies title + body.

```typescript
const wrapEmailContent = (title: string, bodyContent: string, footerContent: string = defaultFooter) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>${baseStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">${title}</div>
      ${bodyContent}
      ${footerContent}
    </div>
  </body>
  </html>
`;
```

---

## 3. Reusable components

### Primary CTA button

- One primary action per email.
- Pill shape (`border-radius: 50px`).
- Orange gradient background; **white** text with `color: #ffffff !important` (some clients strip link colours).
- Centre inside `.cta`.
- Label format: start with 👉 when pointing to an in-app action, e.g. `👉 View My Viewing Requests on Proptii`.

```html
<div class="cta">
  <a href="{{url}}" class="button">👉 Manage Viewing Requests on Proptii</a>
</div>
```

### Details / summary block (`.details`)

Use for structured facts: dates, amounts, addresses, contract names, etc.

- Light blue-grey background `#f5f8fb`
- Section heading as `<h3>` in primary blue
- Rows as `<p><strong>Label:</strong> value</p>`
- For multiple columns (e.g. referencing), add class `grid` with `display: grid; gap: 16px;`

### Status badge (contracts, payments)

```html
<span class="status-badge">✅ Fully Executed</span>
```

```css
.status-badge {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}
```

Semantic badge backgrounds:

| Meaning | Background | Text |
|---------|------------|------|
| Success | `#D1FAE5` | `#065F46` |
| Warning | `#FFF3CD` | `#BA7517` |
| Error | `#FEE2E2` | `#B91C1C` |

### Attachment notice

For emails with PDF/ZIP attachments:

```html
<div class="attachment-notice">
  <strong>📎 Contract Attachment</strong><br>
  Your signed contract is attached to this email as a PDF. Please save it to your records.
</div>
```

```css
.attachment-notice {
  background: #e0f2fe;
  padding: 16px;
  border-radius: 10px;
  margin: 20px 0;
  text-align: center;
  border: 1px solid #bae6fd;
}
.attachment-notice strong { color: #DC5F12; }
```

### Footer (required)

Standard sign-off:

```html
<div class="footer">
  <p>Best regards,<br>The Proptii Team</p>
  <hr />
  <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co">here</a>.</em>
</div>
```

For contract emails where a named sender is appropriate, only the first line changes (`Best regards,<br>{{senderName}}`); keep the italic Proptii blurb.

---

## 4. Content and tone rules

### Greeting

| Audience | Greeting |
|----------|----------|
| Known first name | `Hi {{firstName}},` |
| Formal external (referee, guarantor) | `Dear {{fullName}},` or `Dear Sir/Madam,` if name unknown |
| Unknown tenant/user | `Hi there,` (use first name only when splitting `user.name`) |

### Title (`.header`)

- Short, action-oriented, sentence case.
- One emoji at the start is acceptable for positive milestones (e.g. `Viewing Confirmed 🎉`, `📄 Signed Contract Ready`).
- Avoid ALL CAPS.

### Voice

- Clear, friendly, professional — not corporate legalese.
- Lead with **why** they received the email, then **what** happened, then **what to do next**.
- Use `N/A` or `Not provided` for missing optional fields — never leave blank labels.

### Links

- All in-app links must use the environment-aware base URL (`APP_URL` → `FRONTEND_URL` → localhost in dev → `https://proptii.co` in production). See `getBaseUrl()` in `email.service.ts`.
- Marketing site: always `https://proptii.co` (not `mail.proptii.co`).
- Link text should describe the destination; avoid “click here” alone.

### Dates, times, and money

| Type | Format |
|------|--------|
| Dates | `en-GB` long form: `Thursday, 18 June 2026` |
| Times | 12-hour with AM/PM: `2:30 PM` |
| Currency | `£` prefix, e.g. `£10` or `£99/month` |

### Subject lines

- Specific and scannable: `New Viewing Request`, `Your Viewing Request Confirmation`, `Payment failed — action required`.
- Include the tenant/applicant name when it helps the recipient triage inbox.

---

## 5. Technical rules of thumb (email HTML)

Email clients are inconsistent. Follow these constraints:

1. **Tables vs flex/grid:** Prefer simple block layout. `display: grid` is used in current templates and works in many clients, but test critical emails in Gmail + Outlook. For maximum compatibility, use a single-column layout only.
2. **No external CSS files** — all styles inline in `<style>` in `<head>`, or inline on elements for buttons in some legacy templates.
3. **No JavaScript.**
4. **No background images** unless tested; solid colours are safer.
5. **Images:** If adding a logo, use absolute HTTPS URLs, always include `alt` text, and design so the email still reads well if images are blocked.
6. **`meta charset="utf-8"`** on every template.
7. **Escape user content** injected into HTML to prevent broken markup/XSS (`&`, `<`, `>`, quotes). Newlines in user messages → `<br />`.
8. **Plain-text fallback:** When using `EmailService.sendEmail`, provide a `text` body where possible for accessibility and deliverability.
9. **Button as `<a>`:** Never use `<button>` for CTAs; use styled `<a href="...">`.
10. **Test width:** Content should not exceed ~640px; avoid horizontal scroll on mobile.

---

## 6. What not to do

| Avoid | Why |
|-------|-----|
| New colour palettes per email | Breaks brand recognition |
| Full-width orange header bars (legacy contract template) | Superseded by white card + blue title pattern |
| Multiple competing CTAs | One primary action per email |
| `Segoe UI` / custom fonts only | Falls back unpredictably; Arial is the standard |
| Hard-coded `localhost` URLs in production code | Use `getBaseUrl()` |
| Skipping the footer blurb | Required for brand consistency and product context |
| Dark `#0A2342` header blocks (support form style) | Legacy; do not copy for new templates |

---

## 7. Checklist before shipping a new template

- [ ] Uses `wrapEmailContent` or the skeleton above (640px white card on `#f5f7fa` background)
- [ ] Title in `.header` with `#136C9E`
- [ ] Details block for structured data (if applicable)
- [ ] At most one primary `.button` CTA
- [ ] Standard footer with Proptii tagline
- [ ] Links built with `getBaseUrl()` / env-aware helper
- [ ] Dates/times/currency formatted for UK (`en-GB`)
- [ ] User-supplied strings escaped
- [ ] Tested in Gmail (web + mobile) and Outlook
- [ ] Subject line matches email purpose

---

## 8. Where templates live today

| Area | File |
|------|------|
| **Primary transactional (reference)** | `proptii-backend/src/services/email.service.ts` |
| Contract signing | `proptii-backend/src/services/contract-email.service.ts` |
| Billing (receipt, payment failed, trial ending) | `proptii-backend/src/modules/billing/webhook.service.ts` |
| Support form (legacy layout) | `api/src/functions/support-email/index.ts` |

New backend templates should be added next to related domain logic but **import or duplicate `baseStyles` + `wrapEmailContent` from the email service pattern** — not fork a new visual style.

---

## 9. Quick visual reference

**Primary button:** orange gradient pill, white bold text, centred.

**Details panel:** soft blue-grey box, blue section heading, bold labels.

**Page:** light grey outer background, floating white card with subtle blue-tinted shadow.

**Links in body:** `#136C9E`, underlined by client default is fine.

For a high-fidelity marketing mock (billing trial reminder), see `public/images/pricing/pricing-page-v2/screen-6-email.html` — use it as **content/layout inspiration** only; implement with Arial and the colours in section 1 for actual sent emails.
