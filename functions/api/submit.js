// ==============================================================
// FILE: functions/api/submit.js
// Sends inquiry form submissions via Resend.
// Emails owner at Novalex1016@icloud.com and confirms to client.
// CORS enabled for all origins (proxied via Cloudflare Worker)
// ==============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const contentType = context.request.headers.get('Content-Type') || '';
    let session = '', desireddate = '', name = '', phone = '', email = '', message = '';

    if (contentType.includes('application/json')) {
      const json = await context.request.json();
      session     = json.session     || '';
      desireddate = json.desireddate || '';
      name        = json.name        || '';
      phone       = json.phone       || '';
      email       = json.email       || '';
      message     = json.message     || '';
    } else {
      const formData = await context.request.formData();
      session     = formData.get('session')     || '';
      desireddate = formData.get('desireddate') || '';
      name        = formData.get('name')        || '';
      phone       = formData.get('phone')       || '';
      email       = formData.get('email')       || '';
      message     = formData.get('message')     || '';
    }

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
