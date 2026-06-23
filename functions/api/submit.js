// ==============================================================
// FILE: functions/api/submit.js
// Sends inquiry form submissions via Resend.
// Emails owner at Novalex1016@icloud.com and confirms to client.
// CORS enabled for pictorialalchemy.com
// ==============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://pictorialalchemy.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const session     = formData.get('session')     || '';
    const desireddate = formData.get('desireddate') || '';
    const name        = formData.get('name')        || '';
    const phone       = formData.get('phone')       || '';
    const email       = formData.get('email')       || '';
    const message     = formData.get('message')     || '';

    // Validate required fields
    if (!name || !email || !phone || !session) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const RESEND_API_KEY = context.env.RESEND_API_KEY;
    const sendEmail = async (to, subject, text) => {
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pictorial Alchemy <inquiries@pictorialalchemy.com>',
          to: [to],
          subject: subject,
          text: text,
        }),
      });
    };

    // Email to owner
    await sendEmail(
      'Novalex1016@icloud.com',
      `New Inquiry - ${session} - ${name}`,
      `New inquiry from pictorialalchemy.com\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSession Type: ${session}\nDesired Date: ${desireddate}\n\nMessage:\n${message}`
    );

    // Confirmation to client (fire and forget)
    sendEmail(
      email,
      'Your inquiry has been received - Pictorial Alchemy',
      `Hi ${name},\n\nThank you for reaching out! I received your inquiry for a ${session} session on ${desireddate} and will be in touch within 48 hours.\n\nLooking forward to connecting,\nPictorial Alchemy\npictorialalchemy.com`
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}
