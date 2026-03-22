type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendSystemEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
  } catch {
    // Avoid blocking critical flows when email provider is unavailable.
  }
}
