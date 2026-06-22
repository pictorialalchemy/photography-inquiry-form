// =============================================================
// FILE: functions/api/submit.js
// WHAT THIS FILE DOES:
//   This is the "invisible worker" that runs on Cloudflare's
//   servers. When a client fills out your inquiry form and
//   clicks Send, this file:
//     1. Receives all the form fields
//     2. Validates nothing is missing
//     3. Sends you an email with the inquiry details
//     4. Sends the client a confirmation email
//
// BEFORE THIS WORKS you must add one Environment Variable
// inside Cloudflare Pages (instructions provided separately).
// =============================================================

export async function onRequestPost(context) {
  try {
    // --- Read the form data sent by the client ---
    const formData = await context.request.formData();

    const session      = formData.get('session')      || '';
    const desired_date = formData.get('desired_date') || '';
    const name         = formData.get('name')         || '';
    const phone        = formData.get('phone')        || '';
    const email        = formData.get('email')        || '';
    const message      = formData.get('message')      || '';

    // --- Make sure all required fields are filled ---
    if (!session || !desired_date || !name || !phone || !email) {
      return new Response(
        JSON.stringify({ error: 'Please fill in all required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Basic email format check ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Build the email you will receive ---
    const emailToYou = {
      from:    'inquiries@pictorialalchemy.com',
      to:      'YOUR_EMAIL_HERE@gmail.com',   // <-- REPLACE with your real email
      subject: `New Inquiry: ${session} - ${name}`,
      text: [
        '--- NEW SESSION INQUIRY ---',
        '',
        `Session Type : ${session}`,
        `Desired Date : ${desired_date}`,
        `Client Name  : ${name}`,
        `Phone        : ${phone}`,
        `Email        : ${email}`,
        '',
        '--- Message from client ---',
        message || '(No message provided)',
        '',
        '---',
        'Reply directly to this email to respond to the client.',
      ].join('\n'),
    };

    // --- Build the auto-reply confirmation to the client ---
    const emailToClient = {
      from:    'inquiries@pictorialalchemy.com',
      to:      email,
      subject: 'Your Inquiry Has Been Received | Pictorial Alchemy',
      text: [
        `Hi ${name},`,
        '',
        'Thank you for reaching out! Your inquiry for a',
        `${session} session on ${desired_date} has been received.`,
        '',
        "I'll be in touch within 24-48 hours to discuss details.",
        '',
        'Warmly,',
        'Pictorial Alchemy Photography',
      ].join('\n'),
    };

    // --- Send both emails via Cloudflare Email Routing ---
    // NOTE: The MAILCHANNELS integration is used here.
    // This works automatically on Cloudflare Pages with no extra account needed.
    const sendEmail = async (payload) => {
      return fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: payload.from, name: 'Pictorial Alchemy' },
          subject: payload.subject,
          content: [{ type: 'text/plain', value: payload.text }],
        }),
      });
    };

    // Send both emails (we await yours so we know it succeeded)
    await sendEmail(emailToYou);
    sendEmail(emailToClient); // client confirmation can fire without waiting

    // --- Tell the form page: success! ---
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // Something unexpected went wrong
    return new Response(
      JSON.stringify({ error: 'Server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// This handles any non-POST requests (like someone visiting /api/submit directly)
export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405 });
}
