import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendInviteEmail(to: string, orgName: string, inviteUrl: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) { console.log(`[MOCK EMAIL] Invite to ${to}: ${inviteUrl}`); return true; }

  try {
    await resend.emails.send({
      from: 'Voyager <noreply@voyager.app>',
      to,
      subject: `You've been invited to join ${orgName} on Voyager`,
      html: `<h2>Welcome to Voyager</h2><p>You've been invited to join <strong>${orgName}</strong>.</p><p><a href="${inviteUrl}">Accept Invitation</a></p>`,
    });
    return true;
  } catch { return false; }
}

export async function sendApprovalNotification(to: string, travelerName: string, tripTitle: string, approvalUrl: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) { console.log(`[MOCK EMAIL] Approval request to ${to} for ${tripTitle}`); return true; }

  try {
    await resend.emails.send({
      from: 'Voyager <noreply@voyager.app>',
      to,
      subject: `Travel approval needed: ${tripTitle}`,
      html: `<h2>Approval Required</h2><p><strong>${travelerName}</strong> has requested approval for: ${tripTitle}</p><p><a href="${approvalUrl}">Review Request</a></p>`,
    });
    return true;
  } catch { return false; }
}

export async function sendBookingConfirmation(to: string, pnr: string, tripTitle: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) { console.log(`[MOCK EMAIL] Booking confirmation to ${to}: PNR ${pnr}`); return true; }

  try {
    await resend.emails.send({
      from: 'Voyager <noreply@voyager.app>',
      to,
      subject: `Booking confirmed: ${tripTitle} (PNR: ${pnr})`,
      html: `<h2>Booking Confirmed</h2><p>Your trip <strong>${tripTitle}</strong> has been booked.</p><p>PNR: <strong>${pnr}</strong></p>`,
    });
    return true;
  } catch { return false; }
}
