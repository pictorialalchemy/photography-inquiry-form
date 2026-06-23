// ==============================================================
// FILE: functions/api/submit.js
// Receives inquiry form data from both pages and emails it
// to the owner via MailChannels (built into Cloudflare Pages).
// Field names match exactly what the HTML forms send.
// ==============================================================

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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sendEmail = async (payload) => {
      return fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: 'inquiries@pictorialalchemy.com', name: 'Pictorial Alchemy' },
          subject: payload.subject,
          content: [{ type: 'text/plain', value: payload.text }],
        }),
      });
    };

    // Email to you (the owner)
    const emailToYou = {
      to: 'Novalex1016@icloud.com',
      subject: `New Inquiry — ${session} — ${name}`,
      text: `New inquiry received from pictorialalchemy.com\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSession Type: ${session}\nDesired Date: ${desireddate}\n\nMessage:\n${message}`,
    };

    // Confirmation email to the client
    const emailToClient = {
      to: email,
      subject: 'Your inquiry has been received — Pictorial Alchemy',
      text: `Hi ${name},\n\nThank you for reaching out! I received your inquiry for a ${session} session on ${desireddate} and will be in touch within 48 hours.\n\nLooking forward to connecting,\nPictorial Alchemy\npictorialalchemy.com`,
    };

    await sendEmail(emailToYou);
    sendEmail(emailToClient); // fire and forget

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
