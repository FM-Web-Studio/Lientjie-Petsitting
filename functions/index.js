/**
 * Cloud Functions - contact-form email notifications for BOTH Lientjie sites.
 *
 * Both the portfolio and the petsitting site live in the same Firebase project
 * (`lientjie-project`), so one Functions codebase serves both. A new document in
 * either messages collection emails a formatted summary to Lientjie's inbox via
 * that same Gmail account's SMTP (nodemailer) - no third-party service, same
 * approach as the Francois0203 project. Replying to the email goes straight to
 * the visitor.
 *
 * Collections watched:
 *   portfolio_messages/{id}   -> portfolio contact form
 *   messages/{id}             -> portfolio contact form (legacy, pre-restructure)
 *   petsitting_messages/{id}  -> petsitting contact form
 *
 * Setup (see functions/README.md):
 *   1. Project on the Blaze plan (done).
 *   2. On the Gmail account, enable 2-Step Verification, then create an
 *      "App password" (Google Account -> Security -> App passwords). This is a
 *      setting on your existing Gmail - NOT a new account/signup.
 *   3. firebase functions:secrets:set SMTP_PASSWORD   (paste the 16-char app password)
 *   4. functions/.env holds SMTP_USER + NOTIFY_TO (the Gmail address).
 *   5. firebase deploy --only functions
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineString, defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');

// Must match the region of the Firestore database. Verified via
// `firebase firestore:databases:get` -> lientjie-project is in europe-west1.
const REGION = 'europe-west1';

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '465' });
const SMTP_USER = defineString('SMTP_USER'); // the Gmail address that sends
const NOTIFY_TO = defineString('NOTIFY_TO'); // where notifications land (usually the same Gmail)
const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD'); // Gmail app password (secret)

// Per-site presentation, keyed by the config name passed to makeHandler().
const SITES = {
  portfolio_messages: {
    label: 'Portfolio',
    accent: '#7A5C1A',
    intro: 'Someone reached out through your portfolio.',
  },
  petsitting_messages: {
    label: 'Petsitting',
    accent: '#FF6B6B',
    intro: 'Someone reached out through your petsitting site.',
  },
};

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatWhen = (createdAt) => {
  const d = createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date();
  try {
    return d.toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });
  } catch {
    return d.toISOString();
  }
};

// Build a compact, email-client-friendly HTML message.
const buildHtml = ({ site, name, email, phone, message, when, extra }) => {
  const rows = [
    ['From', esc(name)],
    ['Email', email ? `<a href="mailto:${esc(email)}" style="color:${site.accent};font-weight:600;text-decoration:none;">${esc(email)}</a>` : '<span style="color:#94a3b8;">not provided</span>'],
    phone ? ['Phone', esc(phone)] : null,
    ...extra,
    ['Received', esc(when)],
  ].filter(Boolean);

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:${site.accent};padding:22px 28px;">
          <div style="color:#fff;font-size:18px;font-weight:700;">New ${esc(site.label)} message</div>
          <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:2px;">${esc(site.intro)}</div>
        </td></tr>
        <tr><td style="padding:26px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3f3f46;">
            ${rows.map(([k, v]) => `<tr><td style="padding:6px 0;width:120px;color:#71717a;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#18181b;">${v}</td></tr>`).join('')}
          </table>
        </td></tr>
        <tr><td style="padding:8px 28px 26px;">
          <div style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Message</div>
          <div style="background:#fafafa;border:1px solid #ececed;border-left:3px solid ${site.accent};border-radius:8px;padding:16px 18px;color:#27272a;font-size:15px;line-height:1.7;">${esc(message).replace(/\r?\n/g, '<br>')}</div>
        </td></tr>
        <tr><td style="background:#fafafa;border-top:1px solid #ececed;padding:14px 28px;color:#a1a1aa;font-size:12px;">
          Just hit Reply to respond to ${esc(name)} directly. Automated notification from your website contact form.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const buildText = ({ site, name, email, phone, message, when, extra }) =>
  `New ${site.label} message\n\n` +
  `From:     ${name}\n` +
  `Email:    ${email || 'not provided'}\n` +
  (phone ? `Phone:    ${phone}\n` : '') +
  extra.map(([k, v]) => `${k}: ${String(v).replace(/<[^>]+>/g, '')}\n`).join('') +
  `Received: ${when}\n\n` +
  `Message:\n${message}\n`;

// Shared handler for every watched collection.
const makeHandler = (configKey) => async (event) => {
  const data = event.data?.data();
  if (!data) { logger.warn('Trigger fired with no document data', { configKey, id: event.params.id }); return; }

  const site = SITES[configKey];
  const name = (data.name || '').trim() || 'Anonymous';
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const message = (data.message || '').trim() || '(empty message)';
  const when = formatWhen(data.createdAt);

  // Site-specific extra fields, if present.
  const extra = [];
  if (data.petName) extra.push(['Pet', `${data.petName}${data.petType ? ` (${data.petType})` : ''}`]);
  if (data.serviceInterest) extra.push(['Service', data.serviceInterest]);
  if (data.subject) extra.push(['Subject', data.subject]);

  const payload = { site, name, email, phone, message, when, extra };

  const port = Number(SMTP_PORT.value()) || 465;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port,
    secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASSWORD.value() },
  });

  try {
    await transporter.sendMail({
      from: `"Lientjie Websites" <${SMTP_USER.value()}>`,
      to: NOTIFY_TO.value() || SMTP_USER.value(),
      replyTo: email || undefined,
      subject: `New ${site.label} message from ${name}`,
      text: buildText(payload),
      html: buildHtml(payload),
    });
    logger.info('Notification sent', { configKey, id: event.params.id, from: email });
  } catch (err) {
    // Don't rethrow - a retry storm won't fix bad credentials, and the message
    // is safely stored in Firestore regardless. Surface it loudly in logs.
    logger.error('Failed to send notification', { configKey, id: event.params.id, error: err?.message });
  }
};

const opts = (document) => ({ document, region: REGION, secrets: [SMTP_PASSWORD], maxInstances: 5 });

exports.onPortfolioMessage = onDocumentCreated(opts('portfolio_messages/{id}'), makeHandler('portfolio_messages'));
// Legacy: the old portfolio (pre-restructure) writes to `messages`. Kept so no
// notification is missed until the new portfolio frontend is deployed. Safe to
// remove once the portfolio is redeployed onto portfolio_messages.
exports.onPortfolioMessageLegacy = onDocumentCreated(opts('messages/{id}'), makeHandler('portfolio_messages'));
exports.onPetsittingMessage = onDocumentCreated(opts('petsitting_messages/{id}'), makeHandler('petsitting_messages'));
